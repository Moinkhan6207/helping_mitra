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

  /**
   * Counts all service categories.
   */
  async countCategories(): Promise<number> {
    return prisma.serviceCategory.count();
  }

  /**
   * Counts all services.
   */
  async countServices(): Promise<number> {
    return prisma.service.count();
  }

  /**
   * Counts services by status.
   */
  async countServicesByStatus(status: 'ACTIVE' | 'INACTIVE'): Promise<number> {
    return prisma.service.count({
      where: { status },
    });
  }

  /**
   * Fetches the most recently updated services.
   */
  async findRecentServices(limit: number = 5) {
    return prisma.service.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        mrp: true,
        status: true,
        updatedAt: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}
