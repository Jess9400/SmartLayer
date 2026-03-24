import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import { AlphaAgent } from '../agents/alpha';
import { BetaAgent } from '../agents/beta';
import { getBetaSubscriptions, subscribeToAlpha, unsubscribeFromAlpha, saveCustomAlpha } from '../memory/store';
import { contractsConfigured, registerAlphaOnChain, getOnChainLeaderboard } from '../services/contracts';
import { getWebhookAlphas, saveWebhookAlpha, deleteWebhookAlpha } from '../memory/webhooks';
import { AGENT_IDS } from '../utils/constants';

const router = Router();

export function createAgentRoutes(alphas: AlphaAgent[], beta: BetaAgent) {
  // Return all agents: all alphas + beta
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const [alphaStates, betaState] = await Promise.all([
        Promise.all(alphas.map(a => a.getState())),
        beta.getState(),
      ]);

      // Enrich alpha states with on-chain reputation scores
      if (contractsConfigured()) {
        try {
          const onChain = await getOnChainLeaderboard(alphas.map(a => a.id));
          const scoreMap = new Map(onChain.map(e => [e!.agentId, e]));
          for (const state of alphaStates) {
            const chain = scoreMap.get(state.id);
            if (chain) {
              state.memory.reputationScore = chain.reputationScore;
              state.memory.performance.winRate = chain.winRate;
              state.memory.performance.totalInvested = chain.totalFeesEarned; // fees as proxy
            }
          }
        } catch (e) {
          console.warn('[agents] On-chain enrichment failed (non-fatal):', e instanceof Error ? e.message : e);
        }
      }

      res.json({ alphas: alphaStates, alpha: alphaStates[0], beta: betaState });
    } catch {
      res.status(500).json({ error: 'Failed to get agent states' });
    }
  });

  // Beta subscriptions
  router.get('/subscriptions', (_req: Request, res: Response) => {
    res.json({ subscribedAlphaIds: getBetaSubscriptions() });
  });

  router.post('/subscribe', (req: Request, res: Response) => {
    const { alphaId } = req.body;
    if (!alphaId) { res.status(400).json({ error: 'alphaId required' }); return; }
    subscribeToAlpha(AGENT_IDS.BETA, alphaId);
    res.json({ success: true, subscribedAlphaIds: getBetaSubscriptions() });
  });

  router.post('/unsubscribe', (req: Request, res: Response) => {
    const { alphaId } = req.body;
    if (!alphaId) { res.status(400).json({ error: 'alphaId required' }); return; }
    unsubscribeFromAlpha(AGENT_IDS.BETA, alphaId);
    res.json({ success: true, subscribedAlphaIds: getBetaSubscriptions() });
  });

  // Register a new external Alpha agent
  router.post('/register-alpha', async (req: Request, res: Response) => {
    const { name, pitchStyle, feeAddress } = req.body;

    if (!name || !pitchStyle || !feeAddress) {
      res.status(400).json({ error: 'name, pitchStyle, and feeAddress are required' });
      return;
    }

    if (!ethers.isAddress(feeAddress)) {
      res.status(400).json({ error: 'feeAddress must be a valid Ethereum address' });
      return;
    }

    // Generate a unique alphaId from the name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20);
    const alphaId = `agent-alpha-${slug}-${Date.now().toString(36)}`;

    let txHash: string | undefined;

    // Register on-chain if contracts are configured
    if (contractsConfigured()) {
      try {
        const ownerKey = process.env.AGENT_ALPHA_PRIVATE_KEY!;
        txHash = await registerAlphaOnChain(ownerKey, alphaId, name, pitchStyle, feeAddress);
        console.log(`[chain] Registered Alpha ${name} (${alphaId}): ${txHash}`);
      } catch (e: any) {
        console.warn('[chain] Alpha registration failed (non-fatal):', e.message);
      }
    }

    // Create the agent instance using the platform key (fees go to feeAddress via contract)
    const alphaKey = process.env.AGENT_ALPHA_PRIVATE_KEY || '';
    const newAlpha = new AlphaAgent(alphaKey, alphaId, name, 'External Alpha', pitchStyle);
    await newAlpha.init();

    // Add to live alphas array (mutates the array passed into this factory — routes see it immediately)
    alphas.push(newAlpha);

    // Persist so it survives restart
    saveCustomAlpha({ id: alphaId, name, pitchStyle, feeAddress, registeredAt: new Date().toISOString(), txHash });

    // Auto-subscribe Beta to the new Alpha
    subscribeToAlpha(AGENT_IDS.BETA, alphaId);

    res.json({
      success: true,
      alphaId,
      name,
      feeAddress,
      txHash: txHash || null,
      subscribedAlphaIds: getBetaSubscriptions(),
    });
  });

  // Register an external Alpha agent via webhook
  router.post('/webhook', (req: Request, res: Response) => {
    const { name, webhookUrl, pitchStyle } = req.body;
    if (!name || !webhookUrl || !pitchStyle) {
      res.status(400).json({ error: 'name, webhookUrl, and pitchStyle are required' });
      return;
    }
    try { new URL(webhookUrl); } catch {
      res.status(400).json({ error: 'webhookUrl must be a valid URL' });
      return;
    }
    const alpha = saveWebhookAlpha({ name, webhookUrl, pitchStyle, registeredAt: new Date().toISOString() });
    subscribeToAlpha(AGENT_IDS.BETA, alpha.id);
    res.json({ success: true, alphaId: alpha.id, name, webhookUrl, subscribedAlphaIds: getBetaSubscriptions() });
  });

  // List registered webhook Alphas
  router.get('/webhooks', (_req: Request, res: Response) => {
    res.json(getWebhookAlphas());
  });

  // Remove a webhook Alpha
  router.delete('/webhook/:id', (req: Request, res: Response) => {
    const removed = deleteWebhookAlpha(req.params.id);
    if (!removed) { res.status(404).json({ error: 'Webhook Alpha not found' }); return; }
    res.json({ success: true });
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const alpha = alphas.find(a => a.id === req.params.id);
      const agent = alpha || (req.params.id === AGENT_IDS.BETA ? beta : null);
      if (!agent) { res.status(404).json({ error: 'Agent not found' }); return; }
      res.json(await agent.getState());
    } catch {
      res.status(500).json({ error: 'Failed to get agent state' });
    }
  });

  return router;
}
