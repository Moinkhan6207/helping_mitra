import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { activeUserMiddleware } from '../../middlewares/activeUser.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();
const controller = new DashboardController();

// 1. User dashboard summary: accessible by USER role only
router.get(
  '/user-summary',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  controller.getUserSummary
);

// 2. Admin dashboard summary: accessible by ADMIN role only
router.get(
  '/admin-summary',
  authMiddleware,
  activeUserMiddleware,
  requireRole('ADMIN'),
  controller.getAdminSummary
);

export default router;
