import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../core/responses/api.response';
import { catchAsync } from '../../core/errors/catchAsync';

export class DashboardController {
  private dashboardService = new DashboardService();

  /**
   * Fetches the user dashboard summary.
   */
  getUserSummary = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const summary = await this.dashboardService.getUserSummary(userId);
    sendSuccess(res, 'User dashboard summary fetched successfully', summary, 200);
  });

  /**
   * Fetches the admin dashboard summary.
   */
  getAdminSummary = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const summary = await this.dashboardService.getAdminSummary();
    sendSuccess(res, 'Admin dashboard summary fetched successfully', summary, 200);
  });
}
