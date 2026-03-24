import { Router, Request, Response } from 'express';
import { AlphaAgent } from '../agents/alpha';
import { BetaAgent } from '../agents/beta';
import { executeDeal } from '../deals/execution';
import { saveDeal, getAllDeals, getAlphaLeaderboard, getBetaSubscriptions, getDealsByAlpha, computeReputationScore, getAgentMemory } from '../memory/store';
import { recordDealOnChain, contractsConfigured } from '../services/contracts';
import { getYieldOpportunities } from '../services/defillama';
import { WSMessage, Deal } from '../types';
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

  router.get('/leaderboard', (_req: Request, res: Response) => {
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
  router.post('/round', async (_req: Request, res: Response) => {
    try {
      // 1. Discover opportunities
      broadcast({ type: 'agent_message', agentId: 'system', agentName: 'System', message: 'Starting competitive deal round — scanning DeFiLlama for opportunities...', timestamp: new Date().toISOString() });
      const opportunities = await getYieldOpportunities();

      // 2. Find which Alphas Beta is subscribed to
      const subscribedIds = getBetaSubscriptions();
      const activeAlphas = alphas.filter(a => subscribedIds.includes(a.id));

      if (activeAlphas.length === 0) {
        res.json({ error: 'Beta has no subscribed Alpha agents' });
        return;
      }

      broadcast({
        type: 'agent_message', agentId: 'system', agentName: 'System',
        message: `${activeAlphas.length} Alpha agent${activeAlphas.length > 1 ? 's' : ''} competing: ${activeAlphas.map(a => a.name).join(', ')}`,
        timestamp: new Date().toISOString()
      });

      // 3. All Alphas pitch in parallel (each gets a different opportunity)
      const betaBalance = await beta.getBalance();
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

      const pitches = await Promise.all(pitchPromises);

      // 4. Beta analyzes each pitch in parallel
      broadcast({ type: 'agent_message', agentId: beta.id, agentName: beta.name, message: `Analyzing ${pitches.length} competing pitch${pitches.length > 1 ? 'es' : ''}...`, timestamp: new Date().toISOString() });

      const analysisPromises = pitches.map(async ({ alpha, deal }) => {
        const analyzed = await beta.analyzeDeal(deal, betaBalance);
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
      const maxBudget = Math.min(parseFloat(betaBalance) * 0.4, 0.002); // max 40% of balance, capped at 0.002 XETH

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

        // Use vault user address = Beta agent address for demo (in production = depositing user's address)
        const userAddress = contractsConfigured() ? beta.walletAddress : undefined;
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
