import { prisma } from '../../config/database';

export class DashboardRepository {
  /**
   * Counts the number of users in the database by role.
   */
  async countUsersByRole(role: 'USER' | 'ADMIN'): Promise<number> {
    return prisma.user.count({
      where: { role },
    });
  }

  /**
   * Counts the number of users in the database by user type.
   */
  async countUsersByUserType(
    userType: 'RETAILER' | 'DISTRIBUTOR' | 'MASTER_DISTRIBUTOR'
  ): Promise<number> {
    return prisma.user.count({
      where: { userType },
    });
  }
}
