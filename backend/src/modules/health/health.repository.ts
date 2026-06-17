import { prisma } from '../../config/database';

export class HealthRepository {
  /**
   * Standard repository pattern handler checking Neon database connectivity.
   */
  public async pingDatabase(): Promise<boolean> {
    try {
      // Execute a lightweight query to assert connection
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database ping failed in HealthRepository:', error);
      return false;
    }
  }
}

export const healthRepository = new HealthRepository();
