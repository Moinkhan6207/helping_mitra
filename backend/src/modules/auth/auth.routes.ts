import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from './auth.controller';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';
import { ZodTypeAny } from 'zod';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { activeUserMiddleware } from '../../middlewares/activeUser.middleware';
import { loginRateLimiter } from '../../middlewares/authRateLimit.middleware';

const router = Router();
const controller = new AuthController();

/**
 * Local request validation middleware.
 * Triggers standard Zod validation throws which are formatted by the global error handler.
 */
const validateBody = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

router.post('/register', validateBody(registerSchema), controller.register);
router.post('/login', loginRateLimiter, validateBody(loginSchema), controller.login);
router.post('/refresh-token', validateBody(refreshTokenSchema), controller.refreshToken);
router.post('/logout', validateBody(refreshTokenSchema), controller.logout);
router.get('/me', authMiddleware, activeUserMiddleware, controller.me);

router.get('/profile', authMiddleware, activeUserMiddleware, controller.getProfile);
router.put('/profile', authMiddleware, activeUserMiddleware, controller.updateProfile);
router.post('/change-password', authMiddleware, activeUserMiddleware, controller.changePassword);

export default router;
