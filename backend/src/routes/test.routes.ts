import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { activeUserMiddleware } from '../middlewares/activeUser.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { sendSuccess } from '../core/responses/api.response';

const router = Router();

// 1. Protected Route: accessible by any authenticated active user (USER or ADMIN)
router.get('/protected', authMiddleware, activeUserMiddleware, (req, res) => {
  return sendSuccess(res, 'Access granted to protected route', { user: req.user });
});

// 2. User Route: accessible by USER role only
router.get('/user', authMiddleware, activeUserMiddleware, requireRole('USER'), (req, res) => {
  return sendSuccess(res, 'Access granted to user route', { user: req.user });
});

// 3. Admin Route: accessible by ADMIN role only
router.get('/admin', authMiddleware, activeUserMiddleware, requireRole('ADMIN'), (req, res) => {
  return sendSuccess(res, 'Access granted to admin route', { user: req.user });
});

export default router;
