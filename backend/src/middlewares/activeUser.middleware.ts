import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../core/errors/app.error';

/**
 * Active User Middleware.
 * Asserts the current user has an ACTIVE status, otherwise rejects request with 403 Forbidden.
 */
export const activeUserMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Unauthorized access'));
  }

  if (req.user.status !== 'ACTIVE') {
    return next(new ForbiddenError('Account is inactive.'));
  }

  next();
};
