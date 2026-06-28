import { DashboardRepository } from './dashboard.repository';
import { UserDashboardSummary, AdminDashboardSummary } from './dashboard.types';
import { prisma } from '../../config/database';

export class DashboardService {
  private dashboardRepository = new DashboardRepository();

  /**
   * Compiles the dashboard summary for a specific USER role.
   */
  async getUserSummary(userId: string): Promise<UserDashboardSummary> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      uploadPendingOrders,
      observationOrders,
      completedOrders,
      rejectedOrders,
      todayPanSale,
      monthlyPanSale,
      todayCommission,
      monthlyCommission,
      todayNewPan,
      todayCsfPan,
    ] = await Promise.all([
      this.dashboardRepository.countTotalOrders(userId),
      this.dashboardRepository.countOrdersByStatus(userId, 'PENDING'),
      this.dashboardRepository.countOrdersByStatus(userId, 'PROCESSING'), // Using PROCESSING for upload pending
      this.dashboardRepository.countOrdersByStatus(userId, 'REJECTED'), // Using REJECTED for observation for now
      this.dashboardRepository.countOrdersByStatus(userId, 'SUCCESS'),
      this.dashboardRepository.countOrdersByStatus(userId, 'REJECTED'),
      this.dashboardRepository.calculateSalesAmount(userId, startOfToday),
      this.dashboardRepository.calculateSalesAmount(userId, startOfMonth),
      this.dashboardRepository.calculateCommission(userId, startOfToday),
      this.dashboardRepository.calculateCommission(userId, startOfMonth),
      this.dashboardRepository.countOrdersByServiceSlug(userId, 'new-pan-apply', startOfToday),
      this.dashboardRepository.countOrdersByServiceSlug(userId, 'pan-correction', startOfToday),
    ]);

    return {
      walletBalance: 0, // TODO: Fetch from wallet table when implemented
      totalOrders,
      pendingOrders,
      uploadPendingOrders,
      observationOrders,
      completedOrders,
      rejectedOrders,
      todayPanSale,
      monthlyPanSale,
      todayCommission,
      monthlyCommission,
      todayNewPan,
      todayCsfPan,
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
