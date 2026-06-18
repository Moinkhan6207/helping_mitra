import rateLimit from 'express-rate-limit';
import { sendError } from '../core/responses/api.response';
import { env } from '../config/env';

/**
 * Authentication Rate Limiter.
 * Prevents brute-force login requests, limiting to 30 attempts in production
 * and 100 attempts in development/testing per 15-minute window per IP.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 30 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const limit = env.NODE_ENV === 'production' ? 30 : 100;
    return sendError(
      res,
      'Too many login attempts from this IP, please try again after 15 minutes.',
      'TOO_MANY_REQUESTS',
      {
        windowMs: 15 * 60 * 1000,
        limit,
      },
      429
    );
  },
});

