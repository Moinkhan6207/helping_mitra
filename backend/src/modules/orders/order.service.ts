import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../core/errors/app.error';
import { walletService } from '../wallet/wallet.service';
import { orderRepository } from './order.repository';
import { validateDynamicForm } from '../services/service.form-validator';
import { validateServiceDocuments } from '../services/service.upload-validator';

export interface CreateOrderPayload {
  idempotencyKey: string;
  serviceId: string;
  amount: number;
  consentGiven: boolean;
  consentText: string;
  fieldValues: { fieldKey: string; fieldLabel: string; value: string }[];
  documents: {
    documentKey: string;
    documentName: string;
    fileName: string;
    storagePath: string;
    fileSize: number;
    fileType: string;
  }[];
}

export function maskValue(key: string, value: string): string {
  const cleanKey = key.toLowerCase();
  if (cleanKey.includes('aadhaar')) {
    if (value.length >= 4) {
      return '********' + value.slice(-4);
    }
    return '********';
  }
  if (cleanKey.includes('mobile') || cleanKey.includes('phone')) {
    if (value.length >= 4) {
      return '******' + value.slice(-4);
    }
    return '******';
  }
  if (cleanKey.includes('pan')) {
    if (value.length >= 10) {
      return value.slice(0, 3) + '****' + value.slice(-3);
    }
    return value.slice(0, 2) + '****' + value.slice(-2);
  }
  if (cleanKey.includes('email')) {
    const parts = value.split('@');
    if (parts.length === 2) {
      const local = parts[0];
      const domain = parts[1];
      if (local.length > 2) {
        return local[0] + '***' + local[local.length - 1] + '@' + domain;
      }
      return '***@' + domain;
    }
    return '***';
  }
  return value;
}

export class OrderService {
  /**
   * Create an order atomically.
   */
  async createOrder(userId: string, payload: CreateOrderPayload): Promise<{ orderId: string }> {
    const {
      idempotencyKey,
      serviceId,
      amount,
      consentGiven,
      consentText,
      fieldValues,
      documents,
    } = payload;

    // --- Guard: Consent required ---
    if (!consentGiven) {
      throw new BadRequestError('Consent is required to submit this application.', 'CONSENT_REQUIRED');
    }

    // --- Guard: Valid amount ---
    if (!amount || amount <= 0) {
      throw new BadRequestError('Invalid service amount.', 'INVALID_AMOUNT');
    }

    // --- Fast fail: Idempotency check ---
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    });
    if (existingOrder) {
      return { orderId: existingOrder.id };
    }

    // --- Fetch Service & Category snapshots ---
    const serviceDef = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { category: true },
    });

    // NFR-3.1: Verify service and category status on backend
    if (!serviceDef || serviceDef.status !== 'ACTIVE' || (serviceDef.category && serviceDef.category.status !== 'ACTIVE')) {
      throw new NotFoundError('Service not found or inactive.', 'SERVICE_NOT_FOUND');
    }

    // NFR-3.1: Never trust frontend MRP
    if (amount !== Number(serviceDef.mrp)) {
      throw new BadRequestError('Payment amount mismatch. The submitted price must match the service MRP.', 'INVALID_AMOUNT');
    }

    // NFR-3.1: Validate every submitted field on backend
    const serviceFields = await prisma.serviceField.findMany({
      where: { serviceId },
    });
    const fieldPayload: Record<string, any> = {};
    fieldValues.forEach((fv) => {
      fieldPayload[fv.fieldKey] = fv.value;
    });
    const validationResult = validateDynamicForm(serviceFields, fieldPayload);
    if (!validationResult.success) {
      const msg = validationResult.error.errors.map((e) => e.message).join(', ');
      throw new BadRequestError(`Fields validation failed: ${msg}`, 'VALIDATION_FAILED');
    }

    // NFR-3.1: Validate file metadata and storage path ownership on backend
    const uploadsMap: Record<string, any> = {};
    documents.forEach((d) => {
      uploadsMap[d.documentKey] = {
        documentKey: d.documentKey,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.fileType,
        storagePath: d.storagePath,
      };
    });
    const docValidation = await validateServiceDocuments(serviceId, userId, uploadsMap);
    if (!docValidation.isValid) {
      const msg = docValidation.errors.map((e) => e.message).join(', ');
      throw new BadRequestError(`Documents validation failed: ${msg}`, 'VALIDATION_FAILED');
    }

    const serviceNameSnapshot = serviceDef.name;
    const categoryNameSnapshot = serviceDef.category?.name ?? 'General Services';

    // --- Fast fail: Pre-validate wallet balance before opening transaction ---
    await walletService.validateSufficientBalance(userId, amount);

    // --- Atomic transaction ---
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create the order record first (we need the ID for ledger reference)
        const order = await orderRepository.createOrderTx(tx, {
          userId,
          serviceId,
          serviceNameSnapshot,
          categoryNameSnapshot,
          orderAmount: new Prisma.Decimal(amount),
          consentAccepted: consentGiven,
          consentAcceptedAt: new Date(),
          idempotencyKey,
        });

        // 2. Debit wallet + create ledger entry (uses order.id as reference)
        await walletService.debitWithLedgerTx(
          tx,
          userId,
          amount,
          order.id,
          `Service payment for ${serviceNameSnapshot}`
        );

        // 3. Save dynamic field values (including the exact consent text accepted)
        const allFieldValues = [
          ...fieldValues,
          { fieldKey: '_consent_text', fieldLabel: 'Consent Text', value: consentText },
        ];
        await orderRepository.saveFieldValuesTx(tx, order.id, allFieldValues);

        // 4. Save uploaded document metadata
        await orderRepository.saveDocumentsTx(tx, order.id, documents);

        return order;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      }
    );

    return { orderId: result.id };
  }

  /**
   * Get a single order detail for a user.
   */
  async getOrderDetail(orderId: string, userId?: string) {
    const order = await orderRepository.findByIdForUser(orderId, userId);
    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    // Map fieldValues to include maskedValue helper
    const mappedFieldValues = order.fieldValues.map((fv) => ({
      ...fv,
      maskedValue: fv.isSensitive ? maskValue(fv.fieldKey, fv.fieldValue) : fv.fieldValue,
    }));

    return {
      ...order,
      fieldValues: mappedFieldValues,
    };
  }

  /**
   * List orders for a user with pagination and filters.
   */
  async listUserOrders(
    userId: string,
    filters: {
      orderStatus?: string;
      serviceId?: string;
      categoryName?: string;
      search?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;
    const { orders, total } = await orderRepository.findAllForUser(userId, filters, skip, limit);

    // NFR-3.1: Mask sensitive data in list and summary APIs
    const mappedOrders = orders.map((order: any) => {
      if (!order.fieldValues) return order;
      const mappedFieldValues = order.fieldValues.map((fv: any) => ({
        ...fv,
        fieldValue: fv.isSensitive ? maskValue(fv.fieldKey, fv.fieldValue) : fv.fieldValue,
        maskedValue: fv.isSensitive ? maskValue(fv.fieldKey, fv.fieldValue) : fv.fieldValue,
      }));
      return {
        ...order,
        fieldValues: mappedFieldValues,
      };
    });

    return {
      orders: mappedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const orderService = new OrderService();

