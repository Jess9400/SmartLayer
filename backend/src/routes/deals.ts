import { Router, Request, Response } from 'express';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { AlphaAgent } from '../agents/alpha';
import { BetaAgent } from '../agents/beta';
import { executeDeal } from '../deals/execution';
import { saveDeal, getAllDeals, getAlphaLeaderboard, getBetaSubscriptions, getDealsByAlpha, computeReputationScore, getAgentMemory } from '../memory/store';
import { recordDealOnChain, contractsConfigured, getOnChainLeaderboard, getVaultBalance } from '../services/contracts';
import { getYieldOpportunities } from '../services/defillama';
import { getWebhookAlphas } from '../memory/webhooks';
import { WSMessage, Deal, UserGoal } from '../types';
import { ethers } from 'ethers';

const router = Router();

export function createDealRoutes(
  alphas: AlphaAgent[],
  beta: BetaAgent,
  broadcast: (msg: WSMessage) => void
) {
  router.get('/', (_req: Request, res: Response) => {
    res.json(getAllDeals());
  });

  router.get('/leaderboard', async (_req: Request, res: Response) => {
    // Try on-chain first; merge with in-memory for any missing fields
    if (contractsConfigured()) {
      try {
        const alphaIds = alphas.map(a => a.id);
        const onChain = await getOnChainLeaderboard(alphaIds);
        if (onChain.length > 0) {
          res.json(onChain);
          return;
        }
      } catch (e) {
        console.warn('[leaderboard] On-chain fetch failed, falling back to in-memory:', e instanceof Error ? e.message : e);
      }
    }
    res.json(getAlphaLeaderboard());
  });

  router.get('/history/:agentId', (req: Request, res: Response) => {
    const deals = getDealsByAlpha(req.params.agentId)
      .filter(d => d.decision !== undefined)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    res.json(deals);
  });

  router.get('/opportunities', async (_req: Request, res: Response) => {
    try {
      const opps = await getYieldOpportunities();
      res.json(opps);
    } catch {
      res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
  });

  // Competitive deal round: all subscribed Alphas pitch simultaneously → Beta scores each → proportional allocation
  router.post('/round', async (req: Request, res: Response) => {
    try {
      // Resolve which address to use as vault user (connected wallet if has balance, else Beta)
      let resolvedUserAddress: string | undefined;
      const requestedUser: string | undefined = req.body?.userAddress;

      // Extract user goal if provided
      const userGoal: UserGoal | undefined = req.body?.userGoal?.targetAmountXETH
        ? req.body.userGoal as UserGoal
        : undefined;

      if (userGoal) {
        broadcast({ type: 'agent_message', agentId: 'agent-beta', agentName: 'Agent Beta', message: `🎯 Goal loaded: ${userGoal.targetAmountXETH} XETH in ${userGoal.timelineMonths} months (${userGoal.riskTolerance} risk) — calibrating strategy...`, timestamp: new Date().toISOString() });
      }

      if (contractsConfigured() && requestedUser && ethers.isAddress(requestedUser)) {
        const userBalance = await getVaultBalance(requestedUser).catch(() => '0');
        if (parseFloat(userBalance) > 0) {
          resolvedUserAddress = requestedUser;
          broadcast({ type: 'agent_message', agentId: 'system', agentName: 'System', message: `💼 Deploying from user vault: ${requestedUser.slice(0, 8)}...${requestedUser.slice(-4)} (${parseFloat(userBalance).toFixed(5)} XETH)`, timestamp: new Date().toISOString() });
        }
      }

      // 1. Discover opportunities
      broadcast({ type: 'agent_message', agentId: 'system', agentName: 'System', message: 'Starting competitive deal round — scanning DeFiLlama for opportunities...', timestamp: new Date().toISOString() });
      const opportunities = await getYieldOpportunities();

      // 2. Find which Alphas Beta is subscribed to
      const subscribedIds = getBetaSubscriptions();
      const activeAlphas = alphas.filter(a => subscribedIds.includes(a.id));

      if (activeAlphas.length === 0) {
        res.status(400).json({ error: 'Beta has no subscribed Alpha agents' });
        return;
      }

      broadcast({
        type: 'agent_message', agentId: 'system', agentName: 'System',
        message: `${activeAlphas.length} Alpha agent${activeAlphas.length > 1 ? 's' : ''} competing: ${activeAlphas.map(a => a.name).join(', ')}`,
        timestamp: new Date().toISOString()
      });

      // 3. All Alphas pitch in parallel (each gets a different opportunity)
      const betaBalance = await beta.getBalance();
      // Use user's vault balance as budget if they have one, otherwise Beta's balance
      const budgetBalance = resolvedUserAddress
        ? (await getVaultBalance(resolvedUserAddress).catch(() => betaBalance))
        : betaBalance;
      const pitchPromises = activeAlphas.map(async (alpha, i) => {
        const opp = opportunities[i % opportunities.length];
        broadcast({ type: 'agent_message', agentId: alpha.id, agentName: alpha.name, message: `Crafting pitch for ${opp.protocol} ${opp.pool} @ ${opp.apy}% APY...`, timestamp: new Date().toISOString() });
        const alphaBalance = await alpha.getBalance();
        const deal = await alpha.generatePitch(opp, alphaBalance);
        const dealWithAddr = { ...deal, pitcherAddress: alpha.walletAddress };
        saveDeal(dealWithAddr);
        broadcast({ type: 'agent_message', agentId: alpha.id, agentName: alpha.name, message: dealWithAddr.pitchMessage, timestamp: new Date().toISOString() });
        broadcast({ type: 'deal_update', deal: dealWithAddr, timestamp: new Date().toISOString() });
        return { alpha, deal: dealWithAddr };
      });

      const pitches: Array<{ alpha: { id: string; name: string; walletAddress: string }; deal: Deal }> = await Promise.all(pitchPromises);

      // 3b. Webhook Alpha pitches (external agents calling in via HTTP)
      const webhookAlphas = getWebhookAlphas().filter(wh => subscribedIds.includes(wh.id));
      if (webhookAlphas.length > 0) {
        broadcast({ type: 'agent_message', agentId: 'system', agentName: 'System', message: `Calling ${webhookAlphas.length} external webhook Alpha(s)...`, timestamp: new Date().toISOString() });
        const webhookPitches = await Promise.all(webhookAlphas.map(async (wh, i) => {
          const opp = opportunities[(pitches.length + i) % opportunities.length];
          broadcast({ type: 'agent_message', agentId: wh.id, agentName: wh.name, message: `Calling ${wh.name} webhook...`, timestamp: new Date().toISOString() });
          try {
            const betaCtx = getAgentMemory('agent-beta');
            const response = await axios.post(wh.webhookUrl, {
              opportunity: opp,
              betaContext: {
                dealsAccepted: betaCtx.dealsAccepted.slice(-3).map(d => ({ protocol: d.protocol, apy: d.apy })),
                riskProfile: betaCtx.riskProfile || 'moderate',
                budgetBalance,
              },
            }, { timeout: 10000 });
            const data = response.data;
            const deal: Deal = {
              id: uuid(),
              timestamp: new Date(),
              protocol: data.protocol || opp.protocol,
              pool: data.pool || opp.pool,
              chain: opp.chain,
              apy: data.apy || opp.apy,
              tvl: opp.tvl,
              riskLevel: opp.riskLevel,
              audited: opp.audited,
              contractAddress: opp.contractAddress,
              pitcherId: wh.id,
              pitcherAddress: '',
              pitchMessage: data.pitchMessage || 'No pitch provided',
              suggestedAmount: data.suggestedAmount || 0.0005,
              confidence: data.confidence || 50,
              receiverId: 'agent-beta',
              executed: false,
              status: 'pitching',
            };
            saveDeal(deal);
            broadcast({ type: 'agent_message', agentId: wh.id, agentName: wh.name, message: deal.pitchMessage, timestamp: new Date().toISOString() });
            broadcast({ type: 'deal_update', deal, timestamp: new Date().toISOString() });
            return { alpha: { id: wh.id, name: wh.name, walletAddress: '' }, deal };
          } catch (e: any) {
            broadcast({ type: 'agent_message', agentId: wh.id, agentName: wh.name, message: `⚠️ Webhook unreachable: ${e.message}`, timestamp: new Date().toISOString() });
            return null;
          }
        }));
        webhookPitches.filter(Boolean).forEach(p => pitches.push(p!));
      }

      // 4. Beta analyzes each pitch in parallel
      broadcast({ type: 'agent_message', agentId: beta.id, agentName: beta.name, message: `Analyzing ${pitches.length} competing pitch${pitches.length > 1 ? 'es' : ''}...`, timestamp: new Date().toISOString() });

      const analysisPromises = pitches.map(async ({ alpha, deal }) => {
        const analyzed = await beta.analyzeDeal(deal, budgetBalance, userGoal);
        saveDeal(analyzed);
        if (analyzed.analysisResult) {
          broadcast({ type: 'analysis_update', deal: analyzed, timestamp: new Date().toISOString() });
        }
        const decisionEmoji = analyzed.decision === 'accept' ? '✅' : analyzed.decision === 'counter' ? '🔄' : '❌';
        broadcast({
          type: 'agent_message', agentId: beta.id, agentName: beta.name,
          message: `${decisionEmoji} ${alpha.name}: ${analyzed.decisionReasoning}`,
          timestamp: new Date().toISOString(),
        });
        const alphaMemory = getAgentMemory(alpha.id);
        const repScore = computeReputationScore(alphaMemory);
        return { alpha, deal: analyzed, overallScore: analyzed.analysisResult?.overallScore ?? 0, repScore };
      });

      const results = await Promise.all(analysisPromises);

      // 5. Record rejected deals on-chain (fire-and-forget)
      // Alpha wallet is the deployer/owner of ReputationRegistry
      const operatorKey = process.env.AGENT_ALPHA_PRIVATE_KEY!;
      if (contractsConfigured()) {
        for (const r of results) {
          if (r.deal.decision !== 'accept') {
            const apyBps = Math.round(r.deal.apy * 100);
            recordDealOnChain(operatorKey, r.alpha.id, false, apyBps, 0n, 0n)
              .then(h => console.log(`[chain] Rejected deal recorded: ${h}`))
              .catch(e => console.warn('[chain] Record rejected deal failed:', e.message));
          }
        }
      }

      // 6. Proportional capital allocation: weight = analysisScore(60%) + reputationScore(40%)
      const accepted = results.filter(r => r.deal.decision === 'accept' && r.deal.investmentAmount);

      if (accepted.length === 0) {
        broadcast({ type: 'agent_message', agentId: beta.id, agentName: beta.name, message: 'No deals met the acceptance threshold this round.', timestamp: new Date().toISOString() });
        res.json(results.map(r => r.deal));
        return;
      }

      // Compute weighted allocation scores
      const weighted = accepted.map(r => ({
        ...r,
        allocScore: (r.overallScore * 0.6) + (r.repScore * 0.4),
      }));
      const totalAllocScore = weighted.reduce((s, r) => s + r.allocScore, 0);
      const maxBudget = Math.min(parseFloat(budgetBalance) * 0.4, 0.002); // max 40% of balance, capped at 0.002 XETH

      const allocations = weighted.map(r => ({
        ...r,
        allocatedAmount: maxBudget * (r.allocScore / totalAllocScore),
      }));

      // Broadcast allocation breakdown
      const allocMsg = allocations.map(r =>
        `${r.alpha.name}: ${(r.allocScore).toFixed(0)} score → ${(r.allocScore / totalAllocScore * 100).toFixed(0)}% allocation (${r.allocatedAmount.toFixed(5)} XETH)`
      ).join(' | ');
      broadcast({
        type: 'agent_message', agentId: beta.id, agentName: beta.name,
        message: `💰 Capital allocation: ${allocMsg}`,
        timestamp: new Date().toISOString(),
      });

      // 6. Execute all accepted deals
      const finalDeals: Deal[] = [];
      for (const r of allocations) {
        const dealToExec = { ...r.deal, investmentAmount: Math.min(r.allocatedAmount, 0.001) };
        const modeTag = contractsConfigured() ? '[Vault]' : '[Native]';
        broadcast({ type: 'agent_message', agentId: beta.id, agentName: beta.name, message: `Executing ${r.alpha.name}'s deal on XLayer ${modeTag}...`, timestamp: new Date().toISOString() });

        // Use resolved user address (connected wallet with vault balance) or fall back to Beta demo wallet
        const userAddress = contractsConfigured() ? (resolvedUserAddress || beta.walletAddress) : undefined;
        const executed = await executeDeal(dealToExec, beta.privateKey, beta.walletAddress, r.alpha.walletAddress, userAddress);
        saveDeal(executed);

        if (executed.txHash) {
          broadcast({ type: 'deal_executed', agentId: r.alpha.id, agentName: r.alpha.name, deal: executed, message: `${r.alpha.name} deal executed! TX: ${executed.txHash}`, timestamp: new Date().toISOString() });
          if (executed.swapTxHash) {
            broadcast({
              type: 'agent_message', agentId: beta.id, agentName: beta.name,
              message: `🔄 OKX DEX swap: XETH → USDC executed on-chain. TX: ${executed.swapTxHash}`,
              timestamp: new Date().toISOString(),
            });
          }
          if (executed.depositTxHash) {
            broadcast({
              type: 'agent_message', agentId: beta.id, agentName: beta.name,
              message: `🏦 ${executed.adapterUsed ?? 'Yield'} deposit: ${executed.swapToAmount ?? 'USDC'} earning yield on-chain. TX: ${executed.depositTxHash}`,
              timestamp: new Date().toISOString(),
            });
          }
          if (executed.alphaFeeTxHash) {
            const feeXETH = (executed.alphaFeeAmount || 0).toFixed(6);
            broadcast({
              type: 'agent_message', agentId: beta.id, agentName: beta.name,
              message: `💸 Paid ${feeXETH} XETH (3% fee) to ${r.alpha.name}. TX: ${executed.alphaFeeTxHash}`,
              timestamp: new Date().toISOString(),
            });
          }
        }
        finalDeals.push(executed);
      }

      // Include rejected deals in response too
      const rejectedDeals = results.filter(r => r.deal.decision !== 'accept').map(r => r.deal);
      res.json([...finalDeals, ...rejectedDeals]);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      broadcast({ type: 'error', message, timestamp: new Date().toISOString() });
      res.status(500).json({ error: message });
    }
  });

  return router;
}
