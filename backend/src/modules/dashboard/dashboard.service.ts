import { DashboardRepository } from './dashboard.repository';
import { UserDashboardSummary, AdminDashboardSummary } from './dashboard.types';
import { prisma } from '../../config/database';

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
   * Resolves actual count aggregates from the database for user stats and service catalogue stats.
   */
  async getAdminSummary(): Promise<AdminDashboardSummary> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalRetailers,
      totalDistributors,
      totalMasterDistributors,
      totalCategories,
      totalServices,
      activeServices,
      inactiveServices,
      recentServicesRaw,
      pendingRecharges,
      underReviewRecharges,
      rechargesCreditedToday,
      rechargesRejectedToday,
    ] = await Promise.all([
      this.dashboardRepository.countUsersByRole('USER'),
      this.dashboardRepository.countUsersByUserType('RETAILER'),
      this.dashboardRepository.countUsersByUserType('DISTRIBUTOR'),
      this.dashboardRepository.countUsersByUserType('MASTER_DISTRIBUTOR'),
      this.dashboardRepository.countCategories(),
      this.dashboardRepository.countServices(),
      this.dashboardRepository.countServicesByStatus('ACTIVE'),
      this.dashboardRepository.countServicesByStatus('INACTIVE'),
      this.dashboardRepository.findRecentServices(5),
      // Wallet Recharge KPIs
      prisma.walletRecharge.count({ where: { status: 'VERIFICATION_PENDING' } }),
      prisma.walletRecharge.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.walletRecharge.count({
        where: { status: 'BALANCE_CREDITED', creditedAt: { gte: startOfToday } },
      }),
      prisma.walletRecharge.count({
        where: { status: 'REJECTED', resolvedAt: { gte: startOfToday } },
      }),
    ]);

    const recentServices = recentServicesRaw.map((s) => ({
      ...s,
      mrp: Number(s.mrp),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return {
      totalUsers,
      totalRetailers,
      totalDistributors,
      totalMasterDistributors,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      rejectedOrders: 0,
      totalCategories,
      totalServices,
      activeServices,
      inactiveServices,
      recentServices,
      pendingRecharges,
      underReviewRecharges,
      rechargesCreditedToday,
      rechargesRejectedToday,
    };
  }
}
