import { healthRepository } from './health.repository';
import { AppError } from '../../core/errors/app.error';

export class HealthService {
  /**
   * Evaluates the application running status.
   */
  public async getAppHealth(): Promise<{ status: string }> {
    return { status: 'OK' };
  }

  /**
   * Asserts the validity of database connections.
   * Throws an operational connection error if check fails.
   */
  public async getDatabaseHealth(): Promise<{ database: string }> {
    const isConnected = await healthRepository.pingDatabase();
    
    if (!isConnected) {
      throw new AppError(
        503,
        'Database connection is unavailable',
        'DATABASE_CONNECTION_ERROR',
        null,
        true
      );
    }
    
    return { database: 'connected' };
  }
}

// Export a single instance to be used across routes
export const healthService = new HealthService();
