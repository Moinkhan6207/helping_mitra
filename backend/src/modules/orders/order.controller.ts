import { Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from './order.service';
import { sendSuccess } from '../../core/responses/api.response';
import { BadRequestError } from '../../core/errors/app.error';

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
  limit: z.coerce.number().min(1).max(100).default(20),
  orderStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']).optional(),
  serviceId: z.string().optional(),
  categoryName: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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
}

export const orderController = new OrderController();

