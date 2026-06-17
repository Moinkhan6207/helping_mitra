import { Request, Response } from 'express';
import { sendSuccess } from '../../core/responses/api.response';
import { healthService } from './health.service';

export class HealthController {
  /**
   * GET /api/health
   * Returns system execution state.
   */
  public getHealth = async (req: Request, res: Response): Promise<void> => {
    const healthInfo = await healthService.getAppHealth();
    sendSuccess(res, 'Helping Mitra API is running', healthInfo, 200);
  };

  /**
   * GET /api/health/db
   * Confirms downstream connectivity with PostgreSQL/NeonDB.
   */
  public getDatabaseHealth = async (req: Request, res: Response): Promise<void> => {
    const dbInfo = await healthService.getDatabaseHealth();
    sendSuccess(res, 'Database connection is working', dbInfo, 200);
  };
}

export const healthController = new HealthController();
