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

  /**
   * Counts orders by status for a specific user.
   */
  async countOrdersByStatus(userId: string, status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'REJECTED'): Promise<number> {
    return prisma.order.count({
      where: { userId, orderStatus: status },
    });
  }

  /**
   * Counts total orders for a specific user.
   */
  async countTotalOrders(userId: string): Promise<number> {
    return prisma.order.count({
      where: { userId },
    });
  }

  /**
   * Calculates total sales amount for a user within a date range.
   */
  async calculateSalesAmount(userId: string, startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = { userId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    
    const result = await prisma.order.aggregate({
      where,
      _sum: {
        orderAmountPaise: true,
      },
    });
    return (result._sum.orderAmountPaise || 0) / 100; // Convert paise to rupees
  }

  /**
   * Counts orders by service slug for a user within a date range.
   */
  async countOrdersByServiceSlug(userId: string, serviceSlug: string, startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = { userId, service: { slug: serviceSlug } };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    
    return prisma.order.count({ where });
  }

  /**
   * Calculates commission earned for a user within a date range.
   * Note: Commission calculation is not yet implemented in the schema.
   * Returns 0 for now.
   */
  async calculateCommission(userId: string, startDate?: Date, endDate?: Date): Promise<number> {
    // TODO: Implement commission calculation when commissionPaise field is added to Order model
    return 0;
  }
}
