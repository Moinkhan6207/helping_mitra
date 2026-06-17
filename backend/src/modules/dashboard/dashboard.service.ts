import { DashboardRepository } from './dashboard.repository';
import { UserDashboardSummary, AdminDashboardSummary } from './dashboard.types';

export class DashboardService {
  private dashboardRepository = new DashboardRepository();

  /**
   * Compiles the dashboard summary for a specific USER role.
   * Features like wallet and orders are placeholders for this phase.
   */
  async getUserSummary(userId: string): Promise<UserDashboardSummary> { // eslint-disable-line @typescript-eslint/no-unused-vars
    return {
      walletBalance: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      rejectedOrders: 0,
    };
  }

  /**
   * Compiles the admin dashboard summary.
   * Resolves actual count aggregates from the database for user stats.
   * Wallet/Orders details are returned as placeholders.
   */
  async getAdminSummary(): Promise<AdminDashboardSummary> {
    const [totalUsers, totalRetailers, totalDistributors, totalMasterDistributors] =
      await Promise.all([
        this.dashboardRepository.countUsersByRole('USER'),
        this.dashboardRepository.countUsersByUserType('RETAILER'),
        this.dashboardRepository.countUsersByUserType('DISTRIBUTOR'),
        this.dashboardRepository.countUsersByUserType('MASTER_DISTRIBUTOR'),
      ]);

    return {
      totalUsers,
      totalRetailers,
      totalDistributors,
      totalMasterDistributors,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      rejectedOrders: 0,
    };
  }
}
