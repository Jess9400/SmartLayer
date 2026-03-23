import { Router, Request, Response } from 'express';
import { runLearningCycle } from '../memory/learning';
import { WSMessage } from '../types';

const router = Router();

export function createLearningRoutes(broadcast: (msg: WSMessage) => void) {
  router.post('/analyze', async (_req: Request, res: Response) => {
    try {
      broadcast({ type: 'learning_update', message: 'Running learning cycle...', timestamp: new Date().toISOString() });
      const result = await runLearningCycle();
      broadcast({ type: 'learning_update', data: result, message: result.keyInsight, timestamp: new Date().toISOString() });
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });

  router.get('/patterns', async (_req: Request, res: Response) => {
    try {
      const result = await runLearningCycle();
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });

  return router;
}
