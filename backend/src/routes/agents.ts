import { Router, Request, Response } from 'express';
import { AlphaAgent } from '../agents/alpha';
import { BetaAgent } from '../agents/beta';
import { getBetaSubscriptions, subscribeToAlpha, unsubscribeFromAlpha } from '../memory/store';
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
