import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../core/errors/app.error';
import { AuthenticatedUser } from '../core/types';

/**
 * Authentication Middleware.
 * Extracts Bearer token, validates it, and attaches the payload to req.user.
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access token is missing or invalid'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET!) as AuthenticatedUser;
    
    // Attach user payload to Express request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      userType: decoded.userType,
      status: decoded.status,
    };
    
    next();
  } catch (error) {
    return next(new UnauthorizedError('Access token has expired or is invalid'));
  }
};
