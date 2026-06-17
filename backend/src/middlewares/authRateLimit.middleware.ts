import rateLimit from 'express-rate-limit';
import { sendError } from '../core/responses/api.response';

/**
 * Authentication Rate Limiter.
 * Prevents brute-force login requests, limiting to 5 attempts per 15-minute window per IP.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many login attempts from this IP, please try again after 15 minutes.',
      'TOO_MANY_REQUESTS',
      {
        windowMs: 15 * 60 * 1000,
        limit: 5,
      },
      429
    );
  },
});
