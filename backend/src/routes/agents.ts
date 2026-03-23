import { Router, Request, Response } from 'express';
import { AlphaAgent } from '../agents/alpha';
import { BetaAgent } from '../agents/beta';

const router = Router();

export function createAgentRoutes(alpha: AlphaAgent, beta: BetaAgent) {
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const [alphaState, betaState] = await Promise.all([
        alpha.getState(),
        beta.getState(),
      ]);
      res.json({ alpha: alphaState, beta: betaState });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get agent states' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const agent = req.params.id === 'agent-alpha' ? alpha : beta;
      const state = await agent.getState();
      res.json(state);
    } catch (err) {
      res.status(500).json({ error: 'Failed to get agent state' });
    }
  });

  router.get('/:id/balance', async (req: Request, res: Response) => {
    try {
      const agent = req.params.id === 'agent-alpha' ? alpha : beta;
      const balance = await agent.getBalance();
      res.json({ balance, agentId: req.params.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get balance' });
    }
  });

  return router;
}
