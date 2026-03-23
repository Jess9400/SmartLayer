import { Router, Request, Response } from 'express';
import { AlphaAgent } from '../agents/alpha';
import { BetaAgent } from '../agents/beta';
import { executeDeal } from '../deals/execution';
import { saveDeal, getAllDeals } from '../memory/store';
import { getYieldOpportunities } from '../services/defillama';
import { WSMessage } from '../types';
import { WebSocket } from 'ws';

const router = Router();

export function createDealRoutes(
  alpha: AlphaAgent,
  beta: BetaAgent,
  broadcast: (msg: WSMessage) => void
) {
  // Get all deals
  router.get('/', (_req: Request, res: Response) => {
    res.json(getAllDeals());
  });

  // Discover yield opportunities
  router.get('/opportunities', async (_req: Request, res: Response) => {
    try {
      const opps = await getYieldOpportunities();
      res.json(opps);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
  });

  // Full deal round: discover → pitch → analyze → decide → (execute)
  router.post('/round', async (_req: Request, res: Response) => {
    try {
      // 1. Discover
      broadcast({ type: 'agent_message', agentId: alpha.id, agentName: alpha.name, message: 'Scanning DeFiLlama for yield opportunities on XLayer...', timestamp: new Date().toISOString() });
      const opportunities = await getYieldOpportunities();
      const opportunity = opportunities[0];

      broadcast({ type: 'agent_message', agentId: alpha.id, agentName: alpha.name, message: `Found ${opportunities.length} opportunities. Best: ${opportunity.protocol} ${opportunity.pool} at ${opportunity.apy}% APY`, timestamp: new Date().toISOString() });

      // 2. Pitch
      broadcast({ type: 'agent_message', agentId: alpha.id, agentName: alpha.name, message: 'Crafting pitch for Agent Beta...', timestamp: new Date().toISOString() });
      const alphaBalance = await alpha.getBalance();
      let deal = await alpha.generatePitch(opportunity, alphaBalance);
      saveDeal(deal);

      broadcast({ type: 'agent_message', agentId: alpha.id, agentName: alpha.name, message: deal.pitchMessage, timestamp: new Date().toISOString() });
      broadcast({ type: 'deal_update', deal, timestamp: new Date().toISOString() });

      // 3. Analyze
      broadcast({ type: 'agent_message', agentId: beta.id, agentName: beta.name, message: 'Received pitch. Running deep analysis...', timestamp: new Date().toISOString() });
      const betaBalance = await beta.getBalance();
      deal = await beta.analyzeDeal(deal, betaBalance);
      saveDeal(deal);

      if (deal.analysisResult) {
        broadcast({ type: 'analysis_update', deal, timestamp: new Date().toISOString() });
      }

      // 4. Decision message
      const decisionEmoji = deal.decision === 'accept' ? '✅' : deal.decision === 'counter' ? '🔄' : '❌';
      broadcast({
        type: 'agent_message',
        agentId: beta.id,
        agentName: beta.name,
        message: `${decisionEmoji} ${deal.decisionReasoning}`,
        timestamp: new Date().toISOString(),
      });
      broadcast({ type: 'deal_update', deal, timestamp: new Date().toISOString() });

      // 5. Execute if accepted
      if (deal.decision === 'accept' && deal.investmentAmount) {
        broadcast({ type: 'agent_message', agentId: beta.id, agentName: beta.name, message: `Executing deal on XLayer — investing $${deal.investmentAmount} USDC...`, timestamp: new Date().toISOString() });

        deal = { ...deal, status: 'executing' };
        saveDeal(deal);
        broadcast({ type: 'deal_update', deal, timestamp: new Date().toISOString() });

        deal = await executeDeal(deal, beta.privateKey, beta.walletAddress);
        saveDeal(deal);

        if (deal.txHash) {
          broadcast({
            type: 'deal_executed',
            deal,
            message: `Deal executed! TX: ${deal.txHash}`,
            timestamp: new Date().toISOString(),
          });
        } else {
          broadcast({ type: 'agent_message', agentId: beta.id, agentName: beta.name, message: 'Execution failed. Will retry in next round.', timestamp: new Date().toISOString() });
        }
      }

      res.json(deal);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      broadcast({ type: 'error', message, timestamp: new Date().toISOString() });
      res.status(500).json({ error: message });
    }
  });

  return router;
}
