import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { sendError } from '../core/responses/api.response';

/**
 * Standard API Rate Limiter middleware to guard against brute-force/DDoS attacks.
 * Configured dynamically using properties validated from the environment.
 */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    return sendError(
      res,
      'Too many requests from this IP, please try again later.',
      'TOO_MANY_REQUESTS',
      {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX,
      },
      429
    );
  },
});
