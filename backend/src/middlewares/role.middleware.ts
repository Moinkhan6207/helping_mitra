import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../core/errors/app.error';

/**
 * Role-Based Access Control Middleware Creator.
 * Restricts access to users holding one of the allowed roles.
 */
export const requireRole = (...roles: ('USER' | 'ADMIN')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Unauthorized access'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Forbidden access: Insufficient permissions'));
    }

    next();
  };
};
