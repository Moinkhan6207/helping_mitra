import { Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from './order.service';
import { sendSuccess } from '../../core/responses/api.response';
import { BadRequestError, ForbiddenError } from '../../core/errors/app.error';

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

const FieldValueSchema = z.object({
  fieldKey: z.string().min(1),
  fieldLabel: z.string().min(1),
  value: z.string(),
});

const DocumentMetaSchema = z.object({
  documentKey: z.string().min(1),
  documentName: z.string().min(1),
  fileName: z.string().min(1),
  storagePath: z.string().min(1),
  fileSize: z.number().positive(),
  fileType: z.string().min(1),
});

const CreateOrderSchema = z.object({
  idempotencyKey: z
    .string()
    .uuid('idempotencyKey must be a valid UUID v4'),
  serviceId: z.string().min(1, 'serviceId is required'),
  amount: z.number().positive('amount must be a positive number'),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the consent declaration to proceed.' }),
  }),
  consentText: z.string().min(1, 'consentText is required'),
  fieldValues: z.array(FieldValueSchema).default([]),
  documents: z.array(DocumentMetaSchema).default([]),
});

const ListOrdersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
  orderStatus: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z
      .enum([
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
        'PROCESSING',
        'SUCCESS',
      ])
      .optional()
  ),
  serviceId: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  categoryName: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  startDate: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  endDate: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
});

const AdminListOrdersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  orderStatus: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'REJECTED']).optional()
  ),
  serviceId: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  assignedAdminId: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  startDate: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  endDate: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  minAmount: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(0).optional()
  ),
  maxAmount: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(0).optional()
  ),
  sortBy: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['createdAt', 'orderAmountPaise', 'orderStatus']).default('orderStatus')
  ),
  sortOrder: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['asc', 'desc']).default('asc')
  ),
});

const RevealFieldSchema = z.object({
  fieldKey: z.string().min(1, 'fieldKey is required'),
  reason: z.string().min(1, 'Reason for reveal is required'),
});

const FileAccessSchema = z.object({
  action: z.enum(['VIEW', 'DOWNLOAD']),
});

const AssignOrderSchema = z.object({
  assignedAdminId: z.string().min(1, 'assignedAdminId is required'),
  version: z.number().int().min(0, 'version must be a non-negative integer'),
});

const ClaimOrderSchema = z.object({
  version: z.number().int().min(0, 'version must be a non-negative integer'),
});

const ReassignOrderSchema = z.object({
  assignedAdminId: z.string().min(1, 'assignedAdminId is required'),
  version: z.number().int().min(0, 'version must be a non-negative integer'),
  reason: z.string().trim().min(1, 'Reassignment reason is required'),
});

const StartProcessingSchema = z.object({
  version: z.number().int().min(0, 'version must be a non-negative integer'),
});

const UploadResultFileSchema = z.object({
  storagePath: z.string().min(1, 'storagePath is required'),
  fileName: z.string().min(1, 'fileName is required'),
  fileType: z.string().min(1, 'fileType is required'),
  fileSize: z.number().int().positive('fileSize must be a positive integer'),
});

const CreateInternalNoteSchema = z.object({
  note: z.string()
    .transform(val => val.trim())
    .refine(val => val.length > 0, { message: 'Note content cannot be empty' })
    .refine(val => val.length <= 5000, { message: 'Note content cannot exceed 5000 characters' }),
  noteType: z.enum(['GENERAL', 'VERIFICATION', 'DOCUMENT', 'FOLLOW_UP', 'ESCALATION']).optional(),
});

const ListInternalNotesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  noteType: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['GENERAL', 'VERIFICATION', 'DOCUMENT', 'FOLLOW_UP', 'ESCALATION']).optional()
  ),
  authorId: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  startDate: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  endDate: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
});

const SaveResultDraftSchema = z.object({
  textValue: z.preprocess((val) => (val === '' ? null : val), z.string().max(10000, 'textValue must not exceed 10000 characters').nullable().optional()),
  fileName: z.preprocess((val) => (val === '' ? null : val), z.string().nullable().optional()),
  fileType: z.preprocess((val) => (val === '' ? null : val), z.string().nullable().optional()),
  fileSize: z.number().int().nonnegative('fileSize must be non-negative').nullable().optional(),
  storagePath: z.preprocess((val) => (val === '' ? null : val), z.string().nullable().optional()),
  internalCompletionNote: z.preprocess((val) => (val === '' ? null : val), z.string().nullable().optional()),
  userVisibleCompletionNote: z.preprocess((val) => (val === '' ? null : val), z.string().nullable().optional()),
});

const ResultFileAccessSchema = z.object({
  action: z.enum(['VIEW', 'DOWNLOAD']),
});

const CompleteOrderSchema = z.object({
  version: z.number().int('version must be an integer').nonnegative('version must be >= 0'),
  idempotencyKey: z.string().max(128).optional(),
  result: z
    .object({
      textValue: z.string().nullable().optional(),
      fileName: z.string().nullable().optional(),
      fileType: z.string().nullable().optional(),
      fileSize: z.number().int().nonnegative().nullable().optional(),
      storagePath: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  userVisibleCompletionNote: z.string().optional(),
  internalCompletionNote: z.string().nullable().optional(),
});

const RejectOrderSchema = z.object({
  refundOption: z.enum(['FULL_REFUND', 'NO_REFUND'], {
    errorMap: () => ({ message: 'refundOption must be FULL_REFUND or NO_REFUND' }),
  }),
  internalRejectionReason: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Internal rejection reason is required.' })
    .refine((val) => val.length <= 5000, { message: 'Internal rejection reason cannot exceed 5000 characters.' }),
  userVisibleRejectionReason: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'User visible rejection reason is required.' })
    .refine((val) => val.length <= 5000, { message: 'User visible rejection reason cannot exceed 5000 characters.' }),
  noRefundReason: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  version: z.number().int('version must be an integer').nonnegative('version must be >= 0'),
  idempotencyKey: z.string().uuid('idempotencyKey must be a valid UUID v4'),
}).refine((data) => {
  if (data.refundOption === 'NO_REFUND') {
    return typeof data.noRefundReason === 'string' && data.noRefundReason.length > 0;
  }
  return true;
}, {
  message: 'No refund reason is required when NO_REFUND is selected.',
  path: ['noRefundReason'],
});


const UserResultAccessSchema = z.object({
  action: z.enum(['VIEW', 'DOWNLOAD']),
});

// ─── Controller ────────────────────────────────────────────────────────────────

export class OrderController {
  /**
   * POST /api/orders
   * Create order atomically.
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;

    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    const { orderId } = await orderService.createOrder(userId, parsed.data);

    sendSuccess(res, 'Order created successfully.', { orderId }, 201);
  }

  /**
   * GET /api/orders
   * List authenticated user's orders with pagination and filtering.
   */
  async listOrders(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;

    const parsedQuery = ListOrdersQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: parsedQuery.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { page, limit, orderStatus, serviceId, categoryName, search, startDate, endDate } = parsedQuery.data;

    const filters = {
      orderStatus,
      serviceId,
      categoryName,
      search,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const result = await orderService.listUserOrders(userId, filters, page, limit);
    sendSuccess(res, 'Orders retrieved successfully.', result, 200);
  }

  /**
   * GET /api/orders/:orderId
   * Get detail of a single order. Restricted to owner or admin.
   */
  async getOrderDetail(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { orderId } = req.params;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    // Admins bypass the owner check
    const restrictToUserId = userRole === 'ADMIN' ? undefined : userId;
    const order = await orderService.getOrderDetail(orderId, restrictToUserId);

    sendSuccess(res, 'Order retrieved successfully.', { order }, 200);
  }

  /**
   * GET /api/orders/:orderId/result
   * Get user-safe result information for a completed order.
   * Only returns data for orders owned by the authenticated user.
   */
  async getUserOrderResult(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { orderId } = req.params;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const result = await orderService.getUserOrderResult(orderId, userId);
    sendSuccess(res, 'Result retrieved successfully.', result, 200);
  }

  /**
   * POST /api/orders/:orderId/result/access
   * Generate a temporary signed URL for result file download.
   * Only accessible by the order owner.
   */
  async getUserResultFileAccess(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { orderId } = req.params;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsed = UserResultAccessSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { action } = parsed.data;
    const result = await orderService.getUserResultFileAccess(orderId, userId, action);
    sendSuccess(res, 'Result file access granted.', result, 200);
  }

  /**
   * GET /api/orders/my/:orderId/result/url
   * Generate a temporary signed URL for result file download (FR-5.29).
   * Only accessible by the order owner.
   * Conditions: User authenticated, order belongs to user, order status is SUCCESS, result exists, result is file-based.
   */
  async getUserResultFileUrl(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { orderId } = req.params;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const result = await orderService.getUserResultFileAccess(orderId, userId, 'DOWNLOAD');
    sendSuccess(res, 'Result file URL generated successfully.', result, 200);
  }

  /**
   * GET /api/admin/orders
   * List all orders for admins with advanced filtering.
   */
  async getAdminOrders(req: Request, res: Response): Promise<void> {
    const parsedQuery = AdminListOrdersQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: parsedQuery.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const {
      page,
      limit,
      search,
      orderStatus,
      serviceId,
      assignedAdminId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy,
      sortOrder,
    } = parsedQuery.data;

    const filters = {
      search,
      orderStatus,
      serviceId,
      assignedAdminId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minAmount: minAmount !== undefined ? minAmount * 100 : undefined, // Convert to Paise
      maxAmount: maxAmount !== undefined ? maxAmount * 100 : undefined, // Convert to Paise
    };

    const result = await orderService.listAdminOrders(
      filters,
      page,
      limit,
      sortBy,
      sortOrder
    );

    sendSuccess(res, 'Admin orders retrieved successfully.', result, 200);
  }

  /**
   * GET /api/admin/orders/stats
   * Get stats for administrative dashboard.
   */
  async getAdminOrderStats(req: Request, res: Response): Promise<void> {
    const StatsQuerySchema = z.object({
      startDate: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
      endDate: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
    });

    const parsedQuery = StatsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: parsedQuery.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { startDate, endDate } = parsedQuery.data;
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const stats = await orderService.getAdminOrderStats(filters);
    sendSuccess(res, 'Admin order stats retrieved successfully.', stats, 200);
  }

  /**
   * GET /api/admin/orders/admins
   * Get list of admin users for filtering.
   */
  async getAdminsList(req: Request, res: Response): Promise<void> {
    const admins = await orderService.getAdmins();
    sendSuccess(res, 'Admin users retrieved successfully.', admins, 200);
  }

  /**
   * GET /api/admin/orders/:orderId
   * Get complete details of an order for administrative inspection.
   */
  async getAdminOrderDetail(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }
    const order = await orderService.getAdminOrderDetail(orderId);
    sendSuccess(res, 'Admin order details retrieved successfully.', order, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/reveal
   * Reveal a masked sensitive field value and log the audit entry.
   */
  async revealAdminOrderDetailField(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;
    const ipAddress = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown') as string;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsed = RevealFieldSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { fieldKey, reason } = parsed.data;

    // Enforce SENSITIVE_DATA_VIEW permission check
    const userPermissions = req.user!.role === 'ADMIN' ? ['SENSITIVE_DATA_VIEW'] : [];
    if (!userPermissions.includes('SENSITIVE_DATA_VIEW')) {
      throw new ForbiddenError('Access Denied: Requires SENSITIVE_DATA_VIEW permission.', 'FORBIDDEN');
    }

    const result = await orderService.revealSensitiveField(orderId, fieldKey, reason, adminId, ipAddress);

    sendSuccess(res, 'Sensitive field revealed successfully.', result, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/files/:fileId/access
   * Generate signed URL for order documents and log access audit.
   */
  async getAdminOrderFileAccess(req: Request, res: Response): Promise<void> {
    const { orderId, fileId } = req.params;
    const adminId = req.user!.id;

    if (!orderId || !fileId) {
      throw new BadRequestError('orderId and fileId params are required.', 'MISSING_PARAMS');
    }

    const parsed = FileAccessSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { action } = parsed.data;
    const result = await orderService.getAdminOrderFileAccess(orderId, fileId, action, adminId);

    sendSuccess(res, 'File access granted.', result, 200);
  }

  /**
   * GET /api/admin/orders/:orderId/documents/:documentId/url
   * Generate temporary secure signed URL for order documents and log access audit.
   */
  async getAdminOrderDocumentUrl(req: Request, res: Response): Promise<void> {
    const { orderId, documentId } = req.params;
    const adminId = req.user!.id;

    if (!orderId || !documentId) {
      throw new BadRequestError('orderId and documentId params are required.', 'MISSING_PARAMS');
    }

    const action = (req.query.action === 'DOWNLOAD' ? 'DOWNLOAD' : 'VIEW') as 'VIEW' | 'DOWNLOAD';
    const result = await orderService.getAdminOrderFileAccess(orderId, documentId, action, adminId);

    sendSuccess(res, 'Secure document URL generated successfully.', result, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/assign
   * Assign order to another administrator.
   */
  async assignOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;
    const idempotencyKey = (req.body.idempotencyKey || req.headers['x-idempotency-key']) as string | undefined;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsed = AssignOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { assignedAdminId, version } = parsed.data;
    const result = await orderService.assignOrder(
      orderId,
      assignedAdminId,
      version,
      adminId,
      idempotencyKey
    );

    sendSuccess(res, 'Order assigned successfully.', result, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/claim
   * Claim order for self.
   */
  async claimOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;
    const idempotencyKey = (req.body.idempotencyKey || req.headers['x-idempotency-key']) as string | undefined;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsed = ClaimOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { version } = parsed.data;
    const result = await orderService.claimOrder(
      orderId,
      version,
      adminId,
      idempotencyKey
    );

    sendSuccess(res, 'Order claimed successfully.', result, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/reassign
   * Reassign order to another administrator.
   */
  async reassignOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;
    const idempotencyKey = (req.body.idempotencyKey || req.headers['x-idempotency-key']) as string | undefined;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    // Enforce ORDER_REASSIGN permission check
    const userPermissions = req.user!.role === 'ADMIN' ? ['ORDER_PROCESS', 'SENSITIVE_DATA_VIEW', 'ORDER_REASSIGN'] : [];
    if (!userPermissions.includes('ORDER_REASSIGN')) {
      throw new ForbiddenError('Access Denied: Requires ORDER_REASSIGN permission.', 'FORBIDDEN');
    }

    const parsed = ReassignOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { assignedAdminId, version, reason } = parsed.data;
    const result = await orderService.reassignOrder(
      orderId,
      assignedAdminId,
      version,
      adminId,
      reason,
      idempotencyKey
    );

    sendSuccess(res, 'Order reassigned successfully.', result, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/start-processing
   * Start processing order.
   */
  async startProcessingOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;
    const idempotencyKey = (req.body.idempotencyKey || req.headers['x-idempotency-key']) as string | undefined;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsed = StartProcessingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { version } = parsed.data;

    // Enforce ORDER_PROCESS permission check
    const userPermissions = req.user!.role === 'ADMIN' ? ['ORDER_PROCESS', 'SENSITIVE_DATA_VIEW'] : [];
    if (!userPermissions.includes('ORDER_PROCESS')) {
      throw new ForbiddenError('Access Denied: Requires ORDER_PROCESS permission.', 'FORBIDDEN');
    }

    const result = await orderService.startProcessingOrder(
      orderId,
      version,
      adminId,
      idempotencyKey
    );

    sendSuccess(res, 'Order processing started successfully.', result, 200);
  }

  /**
   * GET /api/admin/orders/:orderId/notes
   * Get paginated, searchable, and filterable internal notes for an order.
   */
  async getInternalNotes(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsedQuery = ListInternalNotesQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: parsedQuery.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { page, limit, search, noteType, authorId, startDate, endDate } = parsedQuery.data;

    const filters = {
      search,
      noteType,
      authorId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const result = await orderService.listInternalNotes(
      orderId,
      filters,
      page,
      limit
    );

    sendSuccess(res, 'Internal notes retrieved successfully.', result, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/notes
   * Add a new permanent internal note to an order.
   */
  async createInternalNote(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsed = CreateInternalNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { note, noteType } = parsed.data;
    const result = await orderService.createInternalNote(
      orderId,
      note,
      noteType,
      adminId
    );

    sendSuccess(res, 'Internal note added successfully.', result, 201);
  }

  /**
   * GET /api/admin/orders/:orderId/result
   * Get the current result draft.
   */
  async getResultDraft(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const result = await orderService.getResultDraft(orderId);
    sendSuccess(res, 'Result draft fetched successfully.', result, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/result/draft
   * Save result draft.
   */
  async saveResultDraft(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsed = SaveResultDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const result = await orderService.saveResultDraft(orderId, parsed.data, adminId);
    sendSuccess(res, 'Result draft saved successfully.', result, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/result/validate
   * Validate result preparation readiness.
   */
  async validateResult(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const validation = await orderService.validateResult(orderId, adminId);
    sendSuccess(res, 'Result validated successfully.', validation, 200);
  }

  async uploadResultFile(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsed = UploadResultFileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const result = await orderService.uploadResultFile(orderId, parsed.data, adminId);
    sendSuccess(res, result.isReplacement ? 'Result file replaced successfully.' : 'Result file uploaded successfully.', result, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/result/access
   * Generate a temporary 5-minute signed URL for the uploaded result file.
   */
  async getResultFileAccess(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsed = ResultFileAccessSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { action } = parsed.data;
    const result = await orderService.getResultFileAccess(orderId, action, adminId);
    sendSuccess(res, 'Result file access granted.', result, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/complete
   * Finalize the order result and transition to SUCCESS.
   */
  async completeOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    // Enforce ORDER_COMPLETE permission check
    const userPermissions = req.user!.role === 'ADMIN' ? ['ORDER_PROCESS', 'SENSITIVE_DATA_VIEW', 'ORDER_REASSIGN', 'ORDER_COMPLETE'] : [];
    if (!userPermissions.includes('ORDER_COMPLETE')) {
      throw new ForbiddenError('Access Denied: Requires ORDER_COMPLETE permission.', 'FORBIDDEN');
    }

    const parsed = CompleteOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { version, idempotencyKey, result: resultPayload, userVisibleCompletionNote, internalCompletionNote } = parsed.data;
    const result = await orderService.completeOrder(
      orderId,
      adminId,
      version,
      {
        result: resultPayload,
        userVisibleCompletionNote,
        internalCompletionNote,
      },
      idempotencyKey
    );
    sendSuccess(res, 'Order completed successfully.', result, 200);
  }

  /**
   * GET /api/admin/orders/:orderId/completion-summary
   * Returns completion metadata for a completed order.
   */
  async getCompletionSummary(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const summary = await orderService.getCompletionSummary(orderId);
    sendSuccess(res, 'Completion summary retrieved.', summary, 200);
  }

  /**
   * POST /api/admin/orders/:orderId/reject
   * Reject the order and trigger optional refund to customer wallet.
   */
  async rejectOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const adminId = req.user!.id;

    if (!orderId) {
      throw new BadRequestError('orderId param is required.', 'MISSING_ORDER_ID');
    }

    const parsed = RejectOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { refundOption, internalRejectionReason, userVisibleRejectionReason, noRefundReason, version, idempotencyKey } = parsed.data;

    // Enforce ORDER_NO_REFUND permission check
    if (refundOption === 'NO_REFUND') {
      const userPermissions = req.user!.role === 'ADMIN' ? ['ORDER_PROCESS', 'SENSITIVE_DATA_VIEW', 'ORDER_REASSIGN', 'ORDER_COMPLETE', 'ORDER_NO_REFUND'] : [];
      if (!userPermissions.includes('ORDER_NO_REFUND')) {
        throw new ForbiddenError('Access Denied: Requires ORDER_NO_REFUND permission.', 'FORBIDDEN');
      }
    }

    const result = await orderService.rejectOrder(
      orderId,
      adminId,
      version,
      { refundOption, internalRejectionReason, userVisibleRejectionReason, noRefundReason },
      idempotencyKey
    );
    sendSuccess(res, 'Order rejected successfully.', result, 200);
  }
}

export const orderController = new OrderController();

