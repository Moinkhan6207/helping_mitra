import { Router } from 'express';
import { orderController } from './order.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { activeUserMiddleware } from '../../middlewares/activeUser.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { catchAsync } from '../../core/errors/catchAsync';

const router = Router();

// All order routes require authenticated + active user
router.use(authMiddleware, activeUserMiddleware);

/**
 * POST /api/orders
 * Create a new order atomically. Restricted to USER role.
 */
router.post(
  '/',
  requireRole('USER'),
  catchAsync(orderController.createOrder.bind(orderController))
);

/**
 * GET /api/orders
 * List orders for authenticated user or admin.
 */
router.get(
  '/',
  requireRole('USER', 'ADMIN'),
  catchAsync(orderController.listOrders.bind(orderController))
);

/**
 * GET /api/orders/:orderId
 * Get single order detail for authenticated user or admin.
 */
router.get(
  '/:orderId',
  requireRole('USER', 'ADMIN'),
  catchAsync(orderController.getOrderDetail.bind(orderController))
);

export default router;

