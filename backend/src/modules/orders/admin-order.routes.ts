import { Router } from 'express';
import multer from 'multer';
import { orderController } from './order.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { activeUserMiddleware } from '../../middlewares/activeUser.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { catchAsync } from '../../core/errors/catchAsync';

const router = Router();

// Multer: in-memory storage, 20 MB file size limit, single file upload with field name "file"
const resultUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
}).single('file');

// All administrative order routes require authentication, active status, and ADMIN role
router.use(authMiddleware, activeUserMiddleware, requireRole('ADMIN'));

/**
 * GET /api/admin/orders
 * List orders with search, filters, pagination, and sorting.
 */
router.get(
  '/',
  catchAsync(orderController.getAdminOrders.bind(orderController))
);

/**
 * GET /api/admin/orders/stats
 * Get summary stats for the administrative dashboard.
 */
router.get(
  '/stats',
  catchAsync(orderController.getAdminOrderStats.bind(orderController))
);

/**
 * GET /api/admin/orders/admins
 * Get the list of all admin users to populate the assignee filter.
 */
router.get(
  '/admins',
  catchAsync(orderController.getAdminsList.bind(orderController))
);

/**
 * GET /api/admin/orders/:orderId
 * Get complete details of an order.
 */
router.get(
  '/:orderId',
  catchAsync(orderController.getAdminOrderDetail.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/reveal
 * Reveal sensitive field value and log reveal audit.
 */
router.post(
  '/:orderId/reveal',
  catchAsync(orderController.revealAdminOrderDetailField.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/files/:fileId/access
 * Get temporary signed URL for a document and log access audit.
 */
router.post(
  '/:orderId/files/:fileId/access',
  catchAsync(orderController.getAdminOrderFileAccess.bind(orderController))
);

/**
 * GET /api/admin/orders/:orderId/documents/:documentId/url
 * Generate short-lived secure URL for user document and log access.
 */
router.get(
  '/:orderId/documents/:documentId/url',
  catchAsync(orderController.getAdminOrderDocumentUrl.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/assign
 * Assign order to another administrator.
 */
router.post(
  '/:orderId/assign',
  catchAsync(orderController.assignOrder.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/claim
 * Claim order for self (current administrator).
 */
router.post(
  '/:orderId/claim',
  catchAsync(orderController.claimOrder.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/reassign
 * Reassign order to another administrator.
 */
router.post(
  '/:orderId/reassign',
  catchAsync(orderController.reassignOrder.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/start-processing
 * Transition order status from PENDING to PROCESSING.
 */
router.post(
  '/:orderId/start-processing',
  catchAsync(orderController.startProcessingOrder.bind(orderController))
);

/**
 * PATCH /api/admin/orders/:orderId/start-processing
 * Transition order status from PENDING to PROCESSING.
 */
router.patch(
  '/:orderId/start-processing',
  catchAsync(orderController.startProcessingOrder.bind(orderController))
);

/**
 * GET /api/admin/orders/:orderId/notes
 * Get paginated, searchable, and filterable internal notes for an order.
 */
router.get(
  '/:orderId/notes',
  catchAsync(orderController.getInternalNotes.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/notes
 * Add a new permanent internal note to an order.
 */
router.post(
  '/:orderId/notes',
  catchAsync(orderController.createInternalNote.bind(orderController))
);

/**
 * GET /api/admin/orders/:orderId/result
 * Get the current result draft.
 */
router.get(
  '/:orderId/result',
  catchAsync(orderController.getResultDraft.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/result/draft
 * Save a result draft.
 */
router.post(
  '/:orderId/result/draft',
  catchAsync(orderController.saveResultDraft.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/result/validate
 * Validate the result draft readiness.
 */
router.post(
  '/:orderId/result/validate',
  catchAsync(orderController.validateResult.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/result/upload
 * Upload (or replace) the result file. Accepts multipart/form-data field "file".
 */
router.post(
  '/:orderId/result/upload',
  catchAsync(orderController.uploadResultFile.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/result/access
 * Generate a temporary 5-minute signed URL for the uploaded result file.
 */
router.post(
  '/:orderId/result/access',
  catchAsync(orderController.getResultFileAccess.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/complete
 * Finalize order result and transition status to SUCCESS.
 */
router.post(
  '/:orderId/complete',
  catchAsync(orderController.completeOrder.bind(orderController))
);

/**
 * GET /api/admin/orders/:orderId/completion-summary
 * Returns completion metadata for a completed order.
 */
router.get(
  '/:orderId/completion-summary',
  catchAsync(orderController.getCompletionSummary.bind(orderController))
);

/**
 * POST /api/admin/orders/:orderId/reject
 * Reject the order and trigger optional refund to customer wallet.
 */
router.post(
  '/:orderId/reject',
  catchAsync(orderController.rejectOrder.bind(orderController))
);

export default router;
