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

/**
 * GET /api/orders/:orderId/result
 * Get user-safe result information for completed orders.
 */
router.get(
  '/:orderId/result',
  requireRole('USER'),
  catchAsync(orderController.getUserOrderResult.bind(orderController))
);

/**
 * POST /api/orders/:orderId/result/access
 * Generate temporary signed URL for result file download.
 */
router.post(
  '/:orderId/result/access',
  requireRole('USER'),
  catchAsync(orderController.getUserResultFileAccess.bind(orderController))
);

/**
 * GET /api/orders/my/:orderId/result/url
 * Generate temporary signed URL for result file download (FR-5.29).
 */
router.get(
  '/my/:orderId/result/url',
  requireRole('USER'),
  catchAsync(orderController.getUserResultFileUrl.bind(orderController))
);

export default router;

