import { Request, Response } from 'express';
import { db } from '../config/database';

export class HealthController {
  async health(_req: Request, res: Response): Promise<Response> {
    return res.status(200).json({ status: 'ok' });
  }

  async ready(_req: Request, res: Response): Promise<Response> {
    const isDbHealthy = await db.checkHealth();
    if (!isDbHealthy) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
      });
    }

    return res.status(200).json({
      status: 'ready',
      database: 'connected',
    });
  }
}

export const healthController = new HealthController();
