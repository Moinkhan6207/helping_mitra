import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../core/errors/app.error';

/**
 * Catches any unmatched route requests and delegates a NotFoundError
 * to the global error handling middleware.
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};
