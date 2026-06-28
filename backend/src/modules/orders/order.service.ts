import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/app.error';
import { maskValue } from '../../core/utils/masking';
import { decrypt } from '../../core/utils/encryption';
import { walletService } from '../wallet/wallet.service';
import { orderRepository } from './order.repository';
import { validateDynamicForm } from '../services/service.form-validator';
import { validateServiceDocuments } from '../services/service.upload-validator';
import { firebaseService } from '../firebase/firebase.service';
import { env } from '../../config/env';

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
          resultTypeSnapshot: serviceDef.resultType,
          resultLabelSnapshot: serviceDef.resultLabel,
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

    const orderObj: any = {
      ...order,
      fieldValues: mappedFieldValues,
    };

    if (userId) {
      // Hide internal administration details from customer views
      delete orderObj.assignedAdminId;
      delete orderObj.assignedAt;
      delete orderObj.assignedByAdminId;
      delete orderObj.processingStartedAt;
      delete orderObj.processingStartedByAdminId;
      delete orderObj.completedByAdminId;
      delete orderObj.rejectedByAdminId;
      delete orderObj.internalRejectionReason;
      delete orderObj.internalCompletionNote;
    }

    return orderObj;
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
      // Hide internal administration details from customer views
      delete order.assignedAdminId;
      delete order.assignedAt;
      delete order.assignedByAdminId;
      delete order.processingStartedAt;
      delete order.processingStartedByAdminId;
      delete order.completedByAdminId;
      delete order.rejectedByAdminId;
      delete order.internalRejectionReason;
      delete order.internalCompletionNote;

      const mappedFieldValues = order.fieldValues
        ? order.fieldValues.map((fv: any) => ({
            ...fv,
            fieldValue: fv.isSensitive ? maskValue(fv.fieldKey, fv.fieldValue) : fv.fieldValue,
            maskedValue: fv.isSensitive ? maskValue(fv.fieldKey, fv.fieldValue) : fv.fieldValue,
          }))
        : [];

      let sanitizedResult = null;
      if (order.result) {
        sanitizedResult = {
          ...order.result,
          textValue: (order.resultTypeSnapshot === 'TEXT_RESULT' && order.result.textValue)
            ? maskValue(order.resultLabelSnapshot || 'Result', order.result.textValue)
            : order.result.textValue,
        };
      }

      return {
        ...order,
        fieldValues: mappedFieldValues,
        result: sanitizedResult,
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

  async listAdminOrders(
    filters: {
      search?: string;
      orderStatus?: string;
      serviceId?: string;
      assignedAdminId?: string;
      startDate?: Date;
      endDate?: Date;
      minAmount?: number;
      maxAmount?: number;
    },
    page = 1,
    limit = 20,
    sortBy = 'orderStatus',
    sortOrder: 'asc' | 'desc' = 'asc'
  ) {
    const skip = (page - 1) * limit;

    const orders = await orderRepository.findAllForAdmin(filters, skip, limit, sortBy, sortOrder);
    const total = await orderRepository.countAllForAdmin(filters);

    // Fetch all admins to map assignedAdminId to name
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true },
    });

    const adminMap = new Map<string, string>();
    admins.forEach((admin) => adminMap.set(admin.id, admin.name));

    const mappedOrders = orders.map((order: any) => {
      const assignedAdminName = order.assignedAdminId
        ? adminMap.get(order.assignedAdminId) || 'Unknown Admin'
        : 'Unassigned';

      let sanitizedResult = null;
      if (order.result) {
        sanitizedResult = {
          ...order.result,
          textValue: (order.resultTypeSnapshot === 'TEXT_RESULT' && order.result.textValue)
            ? maskValue(order.resultLabelSnapshot || 'Result', order.result.textValue)
            : order.result.textValue,
        };
      }

      return {
        ...order,
        assignedAdminName,
        user: {
          ...order.user,
          mobile: order.user.mobile,
        },
        result: sanitizedResult,
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

  async getAdminOrderStats(filters: { startDate?: Date; endDate?: Date } = {}) {
    const counts = await orderRepository.getStatsForAdmin(filters);
    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      rejected: 0,
    };

    counts.forEach((item) => {
      const count = item._count;
      stats.total += count;
      if (item.orderStatus === 'PENDING') stats.pending = count;
      else if (item.orderStatus === 'PROCESSING') stats.processing = count;
      else if (item.orderStatus === 'SUCCESS') stats.completed = count;
      else if (item.orderStatus === 'REJECTED') stats.rejected = count;
    });

    return stats;
  }

  async getAdmins() {
    return prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get complete order details with masked field values and chronological timeline for admin view.
   */
  async getAdminOrderDetail(orderId: string) {
    const order = await orderRepository.findOrderDetailForAdmin(orderId);
    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    // Map fieldValues to include maskedValue helper and default fieldValue to masked
    const mappedFieldValues = order.fieldValues.map((fv) => ({
      ...fv,
      maskedValue: fv.isSensitive ? maskValue(fv.fieldKey, fv.fieldValue) : fv.fieldValue,
      fieldValue: fv.isSensitive ? maskValue(fv.fieldKey, fv.fieldValue) : fv.fieldValue,
    }));

    // Build timeline summary from auditLogs, and gather unique user IDs to load actor names in one query
    const actorIdsSet = new Set<string>();
    order.auditLogs.forEach((log) => {
      if (log.performedByUserId) actorIdsSet.add(log.performedByUserId);
      if (log.performedByAdminId) actorIdsSet.add(log.performedByAdminId);
    });

    if (order.assignedAdminId) actorIdsSet.add(order.assignedAdminId);
    if (order.assignedByAdminId) actorIdsSet.add(order.assignedByAdminId);
    if (order.processingStartedByAdminId) actorIdsSet.add(order.processingStartedByAdminId);
    if (order.completedByAdminId) actorIdsSet.add(order.completedByAdminId);
    if (order.rejectedByAdminId) actorIdsSet.add(order.rejectedByAdminId);

    const actorMap: Record<string, string> = {};
    if (actorIdsSet.size > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: Array.from(actorIdsSet) } },
        select: { id: true, name: true },
      });
      users.forEach((u) => {
        actorMap[u.id] = u.name;
      });
    }

    const timeline = order.auditLogs.map((log) => {
      const actorId = log.performedByAdminId || log.performedByUserId || '';
      const actorName = actorMap[actorId] || 'System';
      return {
        id: log.id,
        action: log.action,
        actorName,
        createdAt: log.createdAt,
        remarks: log.remarks,
        metadata: log.metadata,
      };
    });

    // Also include a timeline entry for order creation if there isn't one
    const orderCreatedAction = timeline.some((t) => t.action === 'ORDER_CREATED');
    if (!orderCreatedAction) {
      timeline.push({
        id: 'create-event',
        action: 'ORDER_CREATED',
        actorName: order.user?.name || 'System',
        createdAt: order.createdAt,
        remarks: 'Order submitted and payment completed.',
        metadata: null,
      });
    }

    // Sort timeline newest first
    timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let sanitizedResult = null;
    if (order.result) {
      sanitizedResult = {
        ...order.result,
        textValue: (order.resultTypeSnapshot === 'TEXT_RESULT' && order.result.textValue)
          ? maskValue(order.resultLabelSnapshot || 'Result', order.result.textValue)
          : order.result.textValue,
      };
    }

    return {
      ...order,
      result: sanitizedResult,
      fieldValues: mappedFieldValues,
      timeline,
      assignedAdminName: order.assignedAdminId ? actorMap[order.assignedAdminId] || 'Unknown Admin' : 'Unassigned',
      assignedByAdminName: order.assignedByAdminId ? actorMap[order.assignedByAdminId] || 'System' : null,
      processingStartedByAdminName: order.processingStartedByAdminId ? actorMap[order.processingStartedByAdminId] || 'System' : null,
      completedByAdminName: order.completedByAdminId ? actorMap[order.completedByAdminId] || 'System' : null,
      rejectedByAdminName: order.rejectedByAdminId ? actorMap[order.rejectedByAdminId] || 'System' : null,
    };
  }

  /**
   * Retrieve the original value of a sensitive field, logging a reveal audit.
   */
  async revealSensitiveField(
    orderId: string,
    fieldKey: string,
    reason: string,
    adminId: string,
    ipAddress: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderStatus: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    const fieldValue = await prisma.orderFieldValue.findUnique({
      where: {
        orderId_fieldKey: {
          orderId,
          fieldKey,
        },
      },
    });

    if (!fieldValue) {
      throw new NotFoundError('Field not found in order.', 'FIELD_NOT_FOUND');
    }

    // Record reveal audit log entry
    await prisma.orderAuditLog.create({
      data: {
        orderId,
        action: 'SENSITIVE_DATA_REVEAL',
        oldStatus: null,
        newStatus: order.orderStatus,
        performedByAdminId: adminId,
        remarks: reason || 'Sensitive field revealed.',
        metadata: {
          fieldKey,
          fieldLabel: fieldValue.fieldLabel,
          ipAddress,
        },
      },
    });

    const decryptedValue = fieldValue.isSensitive && fieldValue.encryptedValue
      ? decrypt(fieldValue.encryptedValue)
      : fieldValue.fieldValue;

    return {
      fieldKey,
      fieldValue: decryptedValue,
    };
  }

  /**
   * Generate temporary 5-minute signed URL for document and record access audit log.
   */
  async getAdminOrderFileAccess(
    orderId: string,
    fileId: string,
    action: 'VIEW' | 'DOWNLOAD',
    adminId: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderStatus: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    const document = await prisma.orderDocument.findFirst({
      where: {
        id: fileId,
        orderId,
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found in order.', 'DOCUMENT_NOT_FOUND');
    }

    // Record file access audit log entry
    await prisma.orderAuditLog.create({
      data: {
        orderId,
        action: action === 'VIEW' ? 'DOCUMENT_VIEW' : 'DOCUMENT_DOWNLOAD',
        oldStatus: null,
        newStatus: order.orderStatus,
        performedByAdminId: adminId,
        remarks: `${action === 'VIEW' ? 'Viewed' : 'Downloaded'} file: ${document.fileName}`,
        metadata: {
          fileId,
          documentKey: document.documentKey,
          fileName: document.fileName,
        },
      },
    });

    // Generate signed URL valid for 5 minutes
    const signedUrl = await firebaseService.getSignedUrl(document.storagePath, 5);

    return {
      signedUrl,
    };
  }

  /**
   * Assign order to another administrator, protected by version locking and idempotency.
   */
  async assignOrder(
    orderId: string,
    assignedAdminId: string,
    expectedVersion: number,
    performedByAdminId: string,
    idempotencyKey?: string
  ) {
    return resolveIdempotentAction(
      performedByAdminId,
      orderId,
      'ASSIGN',
      idempotencyKey,
      async () => {
        const assignee = await prisma.user.findUnique({
          where: { id: assignedAdminId, role: 'ADMIN' },
          select: { name: true },
        });
        if (!assignee) {
          throw new NotFoundError('Assignee administrator not found.', 'ASSIGNEE_NOT_FOUND');
        }

        return prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: orderId },
          });

          if (!order) {
            throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
          }

          if (order.orderStatus === 'SUCCESS' || order.orderStatus === 'REJECTED') {
            throw new BadRequestError('Order cannot be assigned.', 'INVALID_STATUS');
          }
          if (order.orderStatus !== 'PENDING') {
            throw new BadRequestError('Order can only be assigned in PENDING state.', 'INVALID_STATUS');
          }

          if (order.version !== expectedVersion) {
            throw new BadRequestError(
              'Order has been updated. Please refresh and try again.',
              'VERSION_MISMATCH'
            );
          }

          const updateCount = await tx.order.updateMany({
            where: {
              id: orderId,
              version: expectedVersion,
            },
            data: {
              assignedAdminId,
              assignedAt: new Date(),
              assignedByAdminId: performedByAdminId,
              version: { increment: 1 },
            },
          });

          if (updateCount.count === 0) {
            throw new BadRequestError(
              'Order has been updated. Please refresh and try again.',
              'VERSION_MISMATCH'
            );
          }

          await tx.orderAuditLog.create({
            data: {
              orderId,
              action: 'ORDER_ASSIGNED',
              oldStatus: null,
              newStatus: order.orderStatus,
              performedByAdminId,
              remarks: `Order assigned to ${assignee.name}.`,
              metadata: {
                assignedAdminId,
                versionBefore: expectedVersion,
                versionAfter: expectedVersion + 1,
              },
            },
          });

          return {
            orderId,
            assignedAdminId,
            version: expectedVersion + 1,
          };
        });
      }
    );
  }

  /**
   * Claim order for self, protected by version locking and idempotency.
   */
  async claimOrder(
    orderId: string,
    expectedVersion: number,
    performedByAdminId: string,
    idempotencyKey?: string
  ) {
    return resolveIdempotentAction(
      performedByAdminId,
      orderId,
      'CLAIM',
      idempotencyKey,
      async () => {
        const claimant = await prisma.user.findUnique({
          where: { id: performedByAdminId, role: 'ADMIN' },
          select: { name: true },
        });
        if (!claimant) {
          throw new NotFoundError('Current administrator not found.', 'ADMIN_NOT_FOUND');
        }

        return prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: orderId },
          });

          if (!order) {
            throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
          }

          if (order.orderStatus === 'SUCCESS' || order.orderStatus === 'REJECTED') {
            throw new BadRequestError('Order cannot be claimed.', 'INVALID_STATUS');
          }
          if (order.orderStatus !== 'PENDING') {
            throw new BadRequestError('Order can only be claimed in PENDING state.', 'INVALID_STATUS');
          }

          if (order.version !== expectedVersion) {
            throw new BadRequestError(
              'Order has been updated. Please refresh and try again.',
              'VERSION_MISMATCH'
            );
          }

          const updateCount = await tx.order.updateMany({
            where: {
              id: orderId,
              version: expectedVersion,
            },
            data: {
              assignedAdminId: performedByAdminId,
              assignedAt: new Date(),
              assignedByAdminId: performedByAdminId,
              version: { increment: 1 },
            },
          });

          if (updateCount.count === 0) {
            throw new BadRequestError(
              'Order has been updated. Please refresh and try again.',
              'VERSION_MISMATCH'
            );
          }

          await tx.orderAuditLog.create({
            data: {
              orderId,
              action: 'ORDER_CLAIMED',
              oldStatus: null,
              newStatus: order.orderStatus,
              performedByAdminId,
              remarks: `Order claimed by ${claimant.name}.`,
              metadata: {
                assignedAdminId: performedByAdminId,
                versionBefore: expectedVersion,
                versionAfter: expectedVersion + 1,
              },
            },
          });

          return {
            orderId,
            assignedAdminId: performedByAdminId,
            version: expectedVersion + 1,
          };
        });
      }
    );
  }

  /**
   * Reassign order to another administrator, protected by version locking and idempotency.
   */
  async reassignOrder(
    orderId: string,
    assignedAdminId: string,
    expectedVersion: number,
    performedByAdminId: string,
    reason: string,
    idempotencyKey?: string
  ) {
    return resolveIdempotentAction(
      performedByAdminId,
      orderId,
      'REASSIGN',
      idempotencyKey,
      async () => {
        const assignee = await prisma.user.findUnique({
          where: { id: assignedAdminId, role: 'ADMIN' },
          select: { name: true },
        });
        if (!assignee) {
          throw new NotFoundError('Assignee administrator not found.', 'ASSIGNEE_NOT_FOUND');
        }

        return prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: orderId },
          });

          if (!order) {
            throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
          }

          if (order.orderStatus === 'SUCCESS' || order.orderStatus === 'REJECTED') {
            throw new BadRequestError('Order cannot be reassigned.', 'INVALID_STATUS');
          }

          if (order.version !== expectedVersion) {
            throw new BadRequestError(
              'Order has been updated. Please refresh and try again.',
              'VERSION_MISMATCH'
            );
          }

          const updateCount = await tx.order.updateMany({
            where: {
              id: orderId,
              version: expectedVersion,
            },
            data: {
              assignedAdminId,
              assignedAt: new Date(),
              assignedByAdminId: performedByAdminId,
              version: { increment: 1 },
            },
          });

          if (updateCount.count === 0) {
            throw new BadRequestError(
              'Order has been updated. Please refresh and try again.',
              'VERSION_MISMATCH'
            );
          }

          await tx.orderAuditLog.create({
            data: {
              orderId,
              action: 'ORDER_REASSIGNED',
              oldStatus: null,
              newStatus: order.orderStatus,
              performedByAdminId,
              remarks: `Order reassigned to ${assignee.name}. Reason: ${reason}`,
              metadata: {
                assignedAdminId,
                versionBefore: expectedVersion,
                versionAfter: expectedVersion + 1,
                reason,
              },
            },
          });

          return {
            orderId,
            assignedAdminId,
            version: expectedVersion + 1,
          };
        });
      }
    );
  }

  /**
   * Start processing order, protected by status, ownership, version locking, and idempotency.
   */
  async startProcessingOrder(
    orderId: string,
    expectedVersion: number,
    performedByAdminId: string,
    idempotencyKey?: string
  ) {
    return resolveIdempotentAction(
      performedByAdminId,
      orderId,
      'START_PROCESSING',
      idempotencyKey,
      async () => {
        const adminUser = await prisma.user.findUnique({
          where: { id: performedByAdminId },
          select: { email: true },
        });

        return prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: orderId },
          });

          if (!order) {
            throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
          }

          const isUnassigned = order.assignedAdminId === null;
          const isAssignedToMe = order.assignedAdminId === performedByAdminId;
          if (!isUnassigned && !isAssignedToMe) {
            throw new BadRequestError('This order is currently being processed by another administrator.', 'OWNERSHIP_MISMATCH');
          }

          if (order.orderStatus !== 'PENDING') {
            throw new BadRequestError('Order can only start processing in PENDING status.', 'INVALID_STATUS');
          }

          if (order.version !== expectedVersion) {
            throw new BadRequestError(
              'Order has been updated. Please refresh and try again.',
              'VERSION_MISMATCH'
            );
          }

          const now = new Date();
          const updateCount = await tx.order.updateMany({
            where: {
              id: orderId,
              version: expectedVersion,
            },
            data: {
              orderStatus: 'PROCESSING',
              assignedAdminId: performedByAdminId,
              assignedAt: order.assignedAt || now,
              processingStartedAt: now,
              processingStartedByAdminId: performedByAdminId,
              version: { increment: 1 },
            },
          });

          if (updateCount.count === 0) {
            throw new BadRequestError(
              'Order has been updated. Please refresh and try again.',
              'VERSION_MISMATCH'
            );
          }

          await tx.orderAuditLog.create({
            data: {
              orderId,
              action: 'PROCESSING_STARTED',
              oldStatus: 'PENDING',
              newStatus: 'PROCESSING',
              performedByAdminId,
              remarks: 'Order processing started.',
              metadata: {
                versionBefore: expectedVersion,
                versionAfter: expectedVersion + 1,
              },
            },
          });

          return {
            orderId,
            orderStatus: 'PROCESSING',
            version: expectedVersion + 1,
          };
        });
      }
    );
  }

  async createInternalNote(
    orderId: string,
    noteText: string,
    noteType: any,
    createdByAdminId: string
  ) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    const note = noteText.trim();
    if (note.length === 0) {
      throw new BadRequestError('Note content cannot be empty.', 'VALIDATION_FAILED');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create Internal Note
      const newNote = await tx.orderInternalNote.create({
        data: {
          orderId,
          note,
          noteType,
          createdByAdminId,
        },
        include: {
          createdByAdmin: {
            select: {
              name: true,
              role: true,
            }
          }
        }
      });

      // 2. Create Audit Log
      await tx.orderAuditLog.create({
        data: {
          orderId,
          action: 'NOTE_ADDED',
          oldStatus: null,
          newStatus: order.orderStatus,
          performedByAdminId: createdByAdminId,
          remarks: `Internal note added by admin.`,
          metadata: {
            noteId: newNote.id,
            noteType: noteType || 'GENERAL',
          }
        }
      });

      return newNote;
    }, {
      timeout: 15000,
    });
  }

  async listInternalNotes(
    orderId: string,
    filters: {
      search?: string;
      noteType?: any;
      authorId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page = 1,
    limit = 20
  ) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      orderRepository.findInternalNotes(orderId, filters, skip, limit),
      orderRepository.countInternalNotes(orderId, filters),
    ]);

    return {
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async getResultDraft(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { result: true }
    });

    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    if (order.orderStatus !== 'PROCESSING') {
      throw new BadRequestError('Order is not in PROCESSING status.', 'INVALID_STATUS');
    }

    return {
      resultTypeSnapshot: order.resultTypeSnapshot,
      resultLabelSnapshot: order.resultLabelSnapshot,
      draft: order.result ? {
        id: order.result.id,
        textValue: order.result.textValue,
        fileName: order.result.fileName,
        fileType: order.result.fileType,
        fileSize: order.result.fileSize,
        storagePath: order.result.storagePath,
        internalCompletionNote: order.internalCompletionNote,
        userVisibleCompletionNote: order.userVisibleCompletionNote,
        createdByAdminId: order.result.createdByAdminId,
        updatedAt: order.result.updatedAt
      } : null
    };
  }

  async saveResultDraft(
    orderId: string,
    payload: {
      textValue?: string | null;
      fileName?: string | null;
      fileType?: string | null;
      fileSize?: number | null;
      storagePath?: string | null;
      internalCompletionNote?: string | null;
      userVisibleCompletionNote?: string | null;
    },
    adminId: string
  ) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    if (order.orderStatus === 'SUCCESS' || order.orderStatus === 'REJECTED') {
      throw new BadRequestError(
        'Result draft cannot be modified after the order is finalized.',
        'ORDER_IMMUTABLE'
      );
    }

    if (order.orderStatus !== 'PROCESSING') {
      throw new BadRequestError('Result draft can only be saved for orders in PROCESSING status.', 'INVALID_STATUS');
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { email: true }
    });
    const isSuperAdmin = adminUser?.email === env.ADMIN_EMAIL || adminUser?.email === 'admin@helpingmitra.com';
    const isAssignedToMe = order.assignedAdminId === adminId;
    if (!isAssignedToMe && !isSuperAdmin) {
      throw new ForbiddenError('Only the assigned administrator or a super administrator can save result drafts.', 'OWNERSHIP_MISMATCH');
    }

    if (!order.resultTypeSnapshot) {
      throw new BadRequestError('Order result type snapshot is not configured.', 'INVALID_RESULT_TYPE');
    }

    if (order.resultTypeSnapshot === 'TEXT_RESULT' && payload.textValue !== undefined && payload.textValue !== null) {
      this.validateTextResultValue(order.resultLabelSnapshot || 'Result', payload.textValue);
    }

    const existingResult = await orderRepository.findOrderResultByOrderId(orderId);
    const isCreate = !existingResult;

    return prisma.$transaction(async (tx) => {
      const draft = await orderRepository.saveResultDraftTx(
        tx,
        orderId,
        payload,
        adminId,
        order.resultTypeSnapshot!,
        order.resultLabelSnapshot || 'Result'
      );

      // Create audit log for draft event
      await tx.orderAuditLog.create({
        data: {
          orderId,
          action: isCreate ? 'RESULT_DRAFT_CREATED' : 'RESULT_DRAFT_UPDATED',
          oldStatus: null,
          newStatus: order.orderStatus,
          performedByAdminId: adminId,
          remarks: isCreate ? 'Result draft created.' : 'Result draft updated.',
          metadata: {
            resultType: order.resultTypeSnapshot,
            resultLabel: order.resultLabelSnapshot
          }
        }
      });

      return draft;
    }, {
      timeout: 15000
    });
  }

  async validateResult(orderId: string, adminId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { result: true }
    });

    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    if (order.orderStatus !== 'PROCESSING') {
      throw new BadRequestError('Result validation can only be triggered for orders in PROCESSING status.', 'INVALID_STATUS');
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { email: true }
    });
    const isSuperAdmin = adminUser?.email === env.ADMIN_EMAIL || adminUser?.email === 'admin@helpingmitra.com';
    const isAssignedToMe = order.assignedAdminId === adminId;
    if (!isAssignedToMe && !isSuperAdmin) {
      throw new ForbiddenError('Only the assigned administrator or a super administrator can validate results.', 'OWNERSHIP_MISMATCH');
    }

    if (!order.resultTypeSnapshot) {
      throw new BadRequestError('Order result type snapshot is not configured.', 'INVALID_RESULT_TYPE');
    }

    const errors: string[] = [];

    // All types require userVisibleCompletionNote
    const userNote = (order.userVisibleCompletionNote || '').trim();
    if (userNote.length === 0) {
      errors.push('User visible completion note is required');
    }

    if (order.resultTypeSnapshot === 'FILE_UPLOAD') {
      if (!order.result || !order.result.fileName || !order.result.storagePath) {
        errors.push('Result file is required');
      }
    } else if (order.resultTypeSnapshot === 'TEXT_RESULT') {
      const textVal = (order.result?.textValue || '').trim();
      if (textVal.length === 0) {
        errors.push('Result text is required');
      } else {
        try {
          this.validateTextResultValue(order.resultLabelSnapshot || 'Result', textVal);
        } catch (err: any) {
          errors.push(err.message);
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestError(`Validation failed: ${errors.join(', ')}`, 'VALIDATION_FAILED');
    }

    return prisma.$transaction(async (tx) => {
      await tx.orderAuditLog.create({
        data: {
          orderId,
          action: 'RESULT_VALIDATED',
          oldStatus: null,
          newStatus: order.orderStatus,
          performedByAdminId: adminId,
          remarks: 'Result validated successfully and is ready for completion.',
          metadata: {
            resultType: order.resultTypeSnapshot,
            resultLabel: order.resultLabelSnapshot
          }
        }
      });

      return { success: true, message: 'Result validated successfully.' };
    }, {
      timeout: 15000
    });
  }

  // ─── Result File Upload Helpers ───────────────────────────────────────────────

  /**
   * Validates service-specific text results based on result label snapshot.
   */
  validateTextResultValue(label: string, value: string): void {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      throw new BadRequestError('Result value is required.', 'VALIDATION_FAILED');
    }
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('aadhaar') || lowerLabel.includes('aadhar')) {
      if (!/^\d{12}$/.test(trimmed)) {
        throw new BadRequestError('Invalid Aadhaar card number. Must be exactly 12 digits.', 'VALIDATION_FAILED');
      }
    } else if (lowerLabel.includes('pan')) {
      if (!/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(trimmed)) {
        throw new BadRequestError('Invalid PAN format. Must be a valid 10-character alphanumeric PAN.', 'VALIDATION_FAILED');
      }
    } else if (lowerLabel.includes('mobile') || lowerLabel.includes('phone') || lowerLabel.includes('contact')) {
      if (!/^\d{10}$/.test(trimmed)) {
        throw new BadRequestError('Invalid Mobile number. Must be exactly 10 digits.', 'VALIDATION_FAILED');
      }
    }
  }

  /**
   * Validates result file metadata before upload:
   * size ≤ 20 MB, allowed extension, allowed MIME type, safe filename.
   */
  private validateResultFileMetadata(
    originalName: string,
    mimeType: string,
    sizeBytes: number
  ): void {
    const MAX_SIZE = 5 * 1024; // 5 KB
    const ALLOWED_RESULT_MIME_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

    if (sizeBytes <= 0) {
      throw new BadRequestError('File is empty or corrupted.', 'INVALID_FILE');
    }

    if (sizeBytes > MAX_SIZE) {
      throw new BadRequestError(
        `File size ${(sizeBytes / 1024).toFixed(2)} KB exceeds the 5 KB limit.`,
        'FILE_TOO_LARGE'
      );
    }

    const ext = originalName.split('.').pop()?.toLowerCase() ?? '';

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestError(
        `File extension "${ext}" is not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.`,
        'INVALID_EXTENSION'
      );
    }

    if (!ALLOWED_RESULT_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestError(
        `MIME type "${mimeType}" is not allowed for result uploads.`,
        'INVALID_MIME_TYPE'
      );
    }

    // Guard against path traversal in filename
    const unsafeParts = /[\\/:\*?"<>|]/;
    if (unsafeParts.test(originalName)) {
      throw new BadRequestError(
        'Filename contains illegal characters.',
        'INVALID_FILENAME'
      );
    }
  }

  /**
   * Sanitises an uploaded filename into a safe deterministic format:
   * result_{orderNumber}_{YYYYMMDD}.{ext}
   */
  private sanitizeResultFileName(originalName: string, orderNumber: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() ?? 'bin';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const safeOrderNumber = orderNumber.replace(/[^a-zA-Z0-9_-]/g, '');
    return `result_${safeOrderNumber}_${dateStr}.${ext}`;
  }

  /**
   * Placeholder virus scan hook — extend with ClamAV/VirusTotal integration in production.
   */
  private async scanFileForViruses(_fileBuffer: Buffer): Promise<void> {
    // TODO: integrate ClamAV or cloud-based AV scanner here
    return;
  }

  // ─── Result File Upload Service Methods ──────────────────────────────────────

  /**
   * Upload (or replace) result file for an order in PROCESSING status.
   * Only the assigned admin or a SUPER_ADMIN may upload.
   * Rolls back storage write on database failure.
   */
  async uploadResultFile(
    orderId: string,
    metadata: { storagePath: string; fileName: string; fileType: string; fileSize: number },
    adminId: string
  ) {
    const { storagePath, fileName, fileType, fileSize } = metadata;

    // 1. Load order + current result draft
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { result: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    if (order.orderStatus === 'SUCCESS' || order.orderStatus === 'REJECTED') {
      throw new BadRequestError(
        'Result files cannot be uploaded after the order is finalized.',
        'ORDER_IMMUTABLE'
      );
    }

    if (order.orderStatus !== 'PROCESSING') {
      throw new BadRequestError(
        'Result file can only be uploaded for orders in PROCESSING status.',
        'INVALID_STATUS'
      );
    }

    if (order.resultTypeSnapshot !== 'FILE_UPLOAD') {
      throw new BadRequestError(
        `Order result type is "${order.resultTypeSnapshot}". File upload is only allowed for FILE_UPLOAD result type.`,
        'INVALID_RESULT_TYPE'
      );
    }

    // 2. Ownership guard
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { email: true },
    });
    const isSuperAdmin =
      adminUser?.email === env.ADMIN_EMAIL ||
      adminUser?.email === 'admin@helpingmitra.com';
    const isAssigned = order.assignedAdminId === adminId;

    if (!isAssigned && !isSuperAdmin) {
      throw new ForbiddenError(
        'Only the assigned administrator or a SUPER_ADMIN can upload result files.',
        'OWNERSHIP_MISMATCH'
      );
    }

    // 3. Path structure & ownership validation
    const parts = storagePath.split('/');
    if (parts.length !== 7 || parts[1] !== 'admin' || parts[2] !== adminId || parts[3] !== 'temp' || parts[4] !== 'order-results') {
      throw new BadRequestError('Invalid temporary upload path structure or access denied.', 'INVALID_STORAGE_PATH');
    }
    const uploadSessionId = parts[5];
    const tempFileName = parts[6];
    if (!uploadSessionId || !tempFileName) {
      throw new BadRequestError('Invalid temporary upload path structure.', 'INVALID_STORAGE_PATH');
    }

    // 4. File metadata validation (size, extension, MIME)
    this.validateResultFileMetadata(fileName, fileType, fileSize);

    // 5. Magic bytes signature validation
    try {
      const sigBuffer = await firebaseService.getFileSignature(storagePath);
      const hex = sigBuffer.toString('hex').toUpperCase();
      const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

      if (fileType === 'application/pdf' || ext === 'pdf') {
        if (!hex.startsWith('25504446')) {
          throw new BadRequestError('File signature does not match PDF format.', 'INVALID_FILE_SIGNATURE');
        }
      } else if (fileType === 'image/png' || ext === 'png') {
        if (!hex.startsWith('89504E47')) {
          throw new BadRequestError('File signature does not match PNG format.', 'INVALID_FILE_SIGNATURE');
        }
      } else if (fileType === 'image/jpeg' || fileType === 'image/jpg' || ext === 'jpg' || ext === 'jpeg') {
        if (!hex.startsWith('FFD8FF')) {
          throw new BadRequestError('File signature does not match JPEG format.', 'INVALID_FILE_SIGNATURE');
        }
      } else {
        throw new BadRequestError('Unsupported file type signature.', 'INVALID_FILE_SIGNATURE');
      }
    } catch (sigErr: any) {
      if (sigErr instanceof BadRequestError) throw sigErr;
      throw new BadRequestError('Failed to verify upload file signature.', 'INVALID_FILE_SIGNATURE');
    }

    // 6. Sanitise filename
    const sanitizedFileName = this.sanitizeResultFileName(fileName, order.orderNumber);

    // 7. Generate deterministic result ID and destination path
    const resultId = order.result?.id || require('crypto').randomUUID();
    const finalStoragePath = `/helping-mitra/orders/${orderId}/results/${resultId}/${sanitizedFileName}`;

    // 8. Track old storage path for cleanup after a successful replacement
    const oldStoragePath = order.result?.storagePath ?? null;
    const isReplacement = !!oldStoragePath;

    // 9. Move file from GCS temp to final permanent path
    try {
      await firebaseService.moveResultFile(storagePath, finalStoragePath);
    } catch (moveErr) {
      throw new BadRequestError(
        'Failed to finalize result file storage location. Please try again.',
        'UPLOAD_FAILED'
      );
    }

    // 10. Transactionally persist metadata + audit log
    try {
      await prisma.$transaction(
        async (tx) => {
          if (order.result) {
            // Update existing OrderResult record
            await tx.orderResult.update({
              where: { orderId },
              data: {
                fileName: sanitizedFileName,
                fileType: fileType,
                fileSize: fileSize,
                storagePath: finalStoragePath,
                updatedAt: new Date(),
              },
            });
          } else {
            // Create first OrderResult record
            await tx.orderResult.create({
              data: {
                id: resultId,
                orderId,
                resultType: order.resultTypeSnapshot as any,
                resultLabel: order.resultLabelSnapshot || 'Result',
                fileName: sanitizedFileName,
                fileType: fileType,
                fileSize: fileSize,
                storagePath: finalStoragePath,
                createdByAdminId: adminId,
              },
            });
          }

          await tx.orderAuditLog.create({
            data: {
              orderId,
              action: isReplacement ? 'RESULT_FILE_REPLACED' : 'RESULT_FILE_UPLOADED',
              oldStatus: null,
              newStatus: order.orderStatus,
              performedByAdminId: adminId,
              remarks: isReplacement
                ? `Result file replaced: ${sanitizedFileName}`
                : `Result file uploaded: ${sanitizedFileName}`,
              metadata: {
                fileName: sanitizedFileName,
                fileType: fileType,
                fileSize: fileSize,
                storagePath: finalStoragePath,
                isReplacement,
              },
            },
          });
        },
        { timeout: 15000 }
      );
    } catch (dbErr) {
      // Rollback: delete the newly moved file from final location if DB write failed
      try {
        await firebaseService.deleteFile(finalStoragePath);
      } catch (cleanupErr) {
        console.error('uploadResultFile: rollback storage deletion failed', cleanupErr);
      }
      throw dbErr;
    }

    // 11. After successful DB write, delete the old file (orphan cleanup)
    if (oldStoragePath) {
      try {
        await firebaseService.deleteFile(oldStoragePath);
      } catch (cleanupErr) {
        console.error('uploadResultFile: old file deletion failed (non-fatal)', cleanupErr);
      }
    }

    return {
      fileName: sanitizedFileName,
      fileType: fileType,
      fileSize: fileSize,
      storagePath: finalStoragePath,
      isReplacement,
    };
  }

  /**
   * Generate a 5-minute signed URL for the current result file and log the access.
   * action: 'VIEW' — audit as RESULT_FILE_VIEWED
   * action: 'DOWNLOAD' — audit as RESULT_FILE_DOWNLOADED
   */
  async getResultFileAccess(
    orderId: string,
    action: 'VIEW' | 'DOWNLOAD',
    adminId: string
  ) {
    // 1. Verify order + result
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { result: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    if (!order.result || !order.result.storagePath) {
      throw new NotFoundError(
        'No result file has been uploaded for this order yet.',
        'RESULT_FILE_NOT_FOUND'
      );
    }

    // 2. Role check: admin or super admin
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { email: true },
    });
    const isSuperAdmin =
      adminUser?.email === env.ADMIN_EMAIL ||
      adminUser?.email === 'admin@helpingmitra.com';
    const isAssigned = order.assignedAdminId === adminId;

    if (!isAssigned && !isSuperAdmin) {
      throw new ForbiddenError(
        'Only the assigned administrator or a SUPER_ADMIN can access result files.',
        'OWNERSHIP_MISMATCH'
      );
    }

    // 3. Generate 5-minute signed URL
    const signedUrl = await firebaseService.getSignedUrl(order.result.storagePath, 5);

    // 4. Audit log
    await prisma.orderAuditLog.create({
      data: {
        orderId,
        action: action === 'VIEW' ? 'RESULT_FILE_VIEWED' : 'RESULT_FILE_DOWNLOADED',
        oldStatus: null,
        newStatus: order.orderStatus,
        performedByAdminId: adminId,
        remarks: `Result file ${action === 'VIEW' ? 'previewed' : 'downloaded'}: ${order.result.fileName}`,
        metadata: {
          fileName: order.result.fileName,
          fileType: order.result.fileType,
          action,
          expiresMinutes: 5,
        },
      },
    });

    return { signedUrl, fileName: order.result.fileName, fileType: order.result.fileType };
  }

  // ─── Order Completion ─────────────────────────────────────────────────────────

  /**
   * Complete an order: transition PROCESSING → SUCCESS with result finalization.
   * Protected by idempotency, ownership, version locking, and result validation.
   */
  async completeOrder(
    orderId: string,
    adminId: string,
    expectedVersion: number,
    payload: {
      result?: {
        textValue?: string | null;
        fileName?: string | null;
        fileType?: string | null;
        fileSize?: number | null;
        storagePath?: string | null;
      } | null;
      userVisibleCompletionNote?: string;
      internalCompletionNote?: string | null;
    },
    idempotencyKey?: string
  ) {
    return resolveIdempotentAction(
      adminId,
      orderId,
      'COMPLETE',
      idempotencyKey,
      async () => {
        // 1. Load order with result
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { result: true },
        });

        if (!order) {
          throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
        }

        // 2. Status guard
        if (order.orderStatus === 'SUCCESS') {
          throw new BadRequestError('Order is already completed.', 'ALREADY_COMPLETED');
        }
        if (order.orderStatus === 'REJECTED') {
          throw new BadRequestError('A rejected order cannot be completed.', 'INVALID_STATUS');
        }
        if (order.orderStatus !== 'PROCESSING') {
          throw new BadRequestError(
            'Order can only be completed from PROCESSING status.',
            'INVALID_STATUS'
          );
        }

        // 3. Ownership guard
        const adminUser = await prisma.user.findUnique({
          where: { id: adminId },
          select: { email: true, name: true },
        });
        const isSuperAdmin =
          adminUser?.email === env.ADMIN_EMAIL ||
          adminUser?.email === 'admin@helpingmitra.com';
        const isAssigned = order.assignedAdminId === adminId;

        if (!isAssigned && !isSuperAdmin) {
          throw new ForbiddenError(
            'Only the assigned administrator or a super administrator can complete this order.',
            'OWNERSHIP_MISMATCH'
          );
        }

        // 4. Optimistic locking
        if (order.version !== expectedVersion) {
          throw new BadRequestError(
            'Order has been updated by another session. Please refresh and try again.',
            'VERSION_MISMATCH'
          );
        }

        if (!order.resultTypeSnapshot) {
          throw new BadRequestError('Order result type snapshot is not configured.', 'INVALID_RESULT_TYPE');
        }

        // Validate notes
        let userNote = payload.userVisibleCompletionNote;
        if (userNote === undefined) {
          userNote = order.userVisibleCompletionNote || '';
        }
        userNote = (userNote || '').trim();
        if (userNote.length === 0) {
          throw new BadRequestError('User visible completion note is required.', 'VALIDATION_FAILED');
        }

        let textValue = payload.result?.textValue ?? null;
        let fileName = payload.result?.fileName ?? null;
        let fileType = payload.result?.fileType ?? null;
        let fileSize = payload.result?.fileSize ?? null;
        let storagePath = payload.result?.storagePath ?? null;

        // If not provided in payload, fall back to existing draft/result in DB
        if (order.result) {
          if (!textValue) textValue = order.result.textValue;
          if (!fileName) fileName = order.result.fileName;
          if (!fileType) fileType = order.result.fileType;
          if (!fileSize) fileSize = order.result.fileSize;
          if (!storagePath) storagePath = order.result.storagePath;
        }

        // 5. Result validation based on type snapshot
        if (order.resultTypeSnapshot === 'FILE_UPLOAD') {
          if (!fileName || !storagePath) {
            throw new BadRequestError('A result file must be uploaded before completing this order.', 'VALIDATION_FAILED');
          }
          
          // If the storage path is still a temp path, validate it and move it to final location
          const isTempPath = storagePath.includes('/temp/order-results/');
          if (isTempPath) {
            // Validate temp file structure & ownership
            const parts = storagePath.split('/');
            if (parts.length !== 7 || parts[1] !== 'admin' || parts[2] !== adminId || parts[3] !== 'temp' || parts[4] !== 'order-results') {
              throw new BadRequestError('Invalid temporary upload path structure or access denied.', 'INVALID_STORAGE_PATH');
            }
            // Validate size, extension, mime
            this.validateResultFileMetadata(fileName, fileType || 'application/octet-stream', fileSize || 0);
            // Verify magic bytes signature
            try {
              const sigBuffer = await firebaseService.getFileSignature(storagePath);
              const hex = sigBuffer.toString('hex').toUpperCase();
              const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
              if (fileType === 'application/pdf' || ext === 'pdf') {
                if (!hex.startsWith('25504446')) throw new BadRequestError('File signature does not match PDF format.', 'INVALID_FILE_SIGNATURE');
              } else if (fileType === 'image/png' || ext === 'png') {
                if (!hex.startsWith('89504E47')) throw new BadRequestError('File signature does not match PNG format.', 'INVALID_FILE_SIGNATURE');
              } else if (fileType === 'image/jpeg' || fileType === 'image/jpg' || ext === 'jpg' || ext === 'jpeg') {
                if (!hex.startsWith('FFD8FF')) throw new BadRequestError('File signature does not match JPEG format.', 'INVALID_FILE_SIGNATURE');
              } else {
                throw new BadRequestError('Unsupported file type signature.', 'INVALID_FILE_SIGNATURE');
              }
            } catch (err: any) {
              if (err instanceof BadRequestError) throw err;
              throw new BadRequestError('Failed to verify upload file signature.', 'INVALID_FILE_SIGNATURE');
            }

            // Move temp file to final location
            const sanitizedFileName = this.sanitizeResultFileName(fileName, order.orderNumber);
            const resultId = order.result?.id || require('crypto').randomUUID();
            const finalStoragePath = `/orders/${orderId}/results/${resultId}/${sanitizedFileName}`;

            try {
              await firebaseService.moveResultFile(storagePath, finalStoragePath);
              storagePath = finalStoragePath;
              fileName = sanitizedFileName;
            } catch (moveErr) {
              throw new BadRequestError('Failed to finalize result file storage location.', 'UPLOAD_FAILED');
            }
          }
        } else if (order.resultTypeSnapshot === 'TEXT_RESULT') {
          if (!textValue || !textValue.trim()) {
            throw new BadRequestError('A text result must be entered before completing this order.', 'VALIDATION_FAILED');
          }
          // Validate format
          this.validateTextResultValue(order.resultLabelSnapshot || 'Result', textValue);
        }

        const now = new Date();

        try {
          // 6. Atomic transaction with optimistic locking
          await prisma.$transaction(
            async (tx) => {
              // Optimistic lock via updateMany
              const updated = await tx.order.updateMany({
                where: { id: orderId, version: expectedVersion },
                data: {
                  orderStatus: 'SUCCESS',
                  completedAt: now,
                  completedByAdminId: adminId,
                  userVisibleCompletionNote: userNote,
                  internalCompletionNote: payload.internalCompletionNote ?? order.internalCompletionNote,
                  version: { increment: 1 },
                },
              });

              if (updated.count === 0) {
                throw new BadRequestError(
                  'Order was modified by another session. Please refresh and try again.',
                  'VERSION_MISMATCH'
                );
              }

              // Create or update result
              const existingResult = await tx.orderResult.findUnique({ where: { orderId } });
              if (existingResult) {
                await tx.orderResult.update({
                  where: { orderId },
                  data: {
                    textValue,
                    fileName,
                    fileType,
                    fileSize,
                    storagePath,
                    updatedAt: now,
                  },
                });
              } else {
                await tx.orderResult.create({
                  data: {
                    orderId,
                    resultType: order.resultTypeSnapshot as any,
                    resultLabel: order.resultLabelSnapshot || 'Result',
                    textValue,
                    fileName,
                    fileType,
                    fileSize,
                    storagePath,
                    createdByAdminId: adminId,
                  },
                });
              }

              // Audit log
              await tx.orderAuditLog.create({
                data: {
                  orderId,
                  action: 'ORDER_COMPLETED',
                  oldStatus: 'PROCESSING',
                  newStatus: 'SUCCESS',
                  performedByAdminId: adminId,
                  remarks: `Order completed by ${adminUser?.name || 'Admin'}.`,
                  metadata: {
                    resultType: order.resultTypeSnapshot,
                    resultLabel: order.resultLabelSnapshot,
                    completedAt: now.toISOString(),
                    versionBefore: expectedVersion,
                    versionAfter: expectedVersion + 1,
                  },
                },
              });
            },
            {
              isolationLevel: 'Serializable',
              timeout: 15000,
            }
          );
        } catch (txErr) {
          // Cleanup GCS Moved File if completion never succeeds (FR-5.19)
          if (order.resultTypeSnapshot === 'FILE_UPLOAD' && storagePath && !storagePath.includes('/temp/')) {
            try {
              await firebaseService.deleteFile(storagePath);
            } catch (cleanupErr) {
              console.error('completeOrder rollback: storage deletion failed', cleanupErr);
            }
          }
          throw txErr;
        }

        return {
          orderId,
          orderNumber: order.orderNumber,
          orderStatus: 'SUCCESS',
          completedAt: now.toISOString(),
          completedByAdminId: adminId,
          completedByAdminName: adminUser?.name || 'Admin',
          version: expectedVersion + 1,
        };
      }
    );
  }

  /**
   * Get completion summary for a successfully completed order.
   */
  async getCompletionSummary(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        result: true,
        user: { select: { id: true, name: true } },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    if (order.orderStatus !== 'SUCCESS') {
      return {
        completed: false,
        completedAt: null,
        completedBy: null,
        completedByAdminId: null,
        resultType: order.resultTypeSnapshot,
        resultLabel: order.resultLabelSnapshot,
        userVisibleCompletionNote: order.userVisibleCompletionNote,
      };
    }

    // Load the completing admin's name
    let completedByName: string | null = null;
    if (order.completedByAdminId) {
      const admin = await prisma.user.findUnique({
        where: { id: order.completedByAdminId },
        select: { name: true },
      });
      completedByName = admin?.name ?? null;
    }

    return {
      completed: true,
      completedAt: order.completedAt?.toISOString() ?? null,
      completedBy: completedByName,
      completedByAdminId: order.completedByAdminId,
      resultType: order.resultTypeSnapshot,
      resultLabel: order.resultLabelSnapshot,
      userVisibleCompletionNote: order.userVisibleCompletionNote,
      result: order.result ? {
        id: order.result.id,
        resultType: order.result.resultType,
        resultLabel: order.result.resultLabel,
        textValue: (order.resultTypeSnapshot === 'TEXT_RESULT' && order.result.textValue)
          ? maskValue(order.resultLabelSnapshot || 'Result', order.result.textValue)
          : order.result.textValue,
        fileName: order.result.fileName,
        fileType: order.result.fileType,
        fileSize: order.result.fileSize,
        storagePath: order.result.storagePath,
      } : null,
    };
  }

  /**
   * Reject an order: transition PENDING/PROCESSING → REJECTED with optional wallet refund.
   * Protected by idempotency, ownership, version locking, and wallet ledger integrity.
   */
  async rejectOrder(
    orderId: string,
    adminId: string,
    expectedVersion: number,
    payload: {
      refundOption: 'FULL_REFUND' | 'NO_REFUND';
      internalRejectionReason: string;
      userVisibleRejectionReason: string;
      noRefundReason?: string;
    },
    idempotencyKey?: string
  ) {
    return resolveIdempotentAction(
      adminId,
      orderId,
      'REJECT',
      idempotencyKey,
      async () => {
        // 1. Load order
        const order = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!order) {
          throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
        }

        // 2. Status guard
        if (order.orderStatus === 'SUCCESS' || order.orderStatus === 'REJECTED') {
          throw new BadRequestError('Order cannot be rejected.', 'INVALID_STATUS');
        }
        if (order.orderStatus !== 'PENDING' && order.orderStatus !== 'PROCESSING') {
          throw new BadRequestError('Order cannot be rejected.', 'INVALID_STATUS');
        }
        if (order.paymentStatus === 'REFUNDED' || order.refundStatus === 'COMPLETED') {
          throw new BadRequestError('Order has already been refunded.', 'ALREADY_REFUNDED');
        }

        // 3. Ownership guard
        const adminUser = await prisma.user.findUnique({
          where: { id: adminId },
          select: { email: true, name: true },
        });
        const isSuperAdmin =
          adminUser?.email === env.ADMIN_EMAIL ||
          adminUser?.email === 'admin@helpingmitra.com';
        const isAssigned = order.assignedAdminId === adminId;

        if (!isAssigned && !isSuperAdmin) {
          throw new ForbiddenError(
            'Only the assigned administrator or a super administrator can reject this order.',
            'OWNERSHIP_MISMATCH'
          );
        }

        // 4. Optimistic locking check
        if (order.version !== expectedVersion) {
          throw new BadRequestError(
            'Order has been updated by another session. Please refresh and try again.',
            'VERSION_MISMATCH'
          );
        }

        const internalRejectionReason = payload.internalRejectionReason.trim();
        const userVisibleRejectionReason = payload.userVisibleRejectionReason.trim();

        if (internalRejectionReason.length === 0) {
          throw new BadRequestError('Internal rejection reason is required.', 'VALIDATION_FAILED');
        }
        if (userVisibleRejectionReason.length === 0) {
          throw new BadRequestError('User visible rejection reason is required.', 'VALIDATION_FAILED');
        }
        if (payload.refundOption === 'NO_REFUND' && (!payload.noRefundReason || payload.noRefundReason.trim().length === 0)) {
          throw new BadRequestError('No refund reason is required when NO_REFUND is selected.', 'VALIDATION_FAILED');
        }

        const now = new Date();

        // 5. Serializable transaction execution
        const result = await prisma.$transaction(
          async (tx) => {
            // Lock the order row
            await tx.$executeRawUnsafe('SELECT 1 FROM "Order" WHERE id = $1 FOR UPDATE', orderId);

            // Check for concurrent updates
            const freshOrder = await tx.order.findUnique({
              where: { id: orderId },
            });
            if (!freshOrder || freshOrder.version !== expectedVersion) {
              throw new BadRequestError(
                'Order was modified by another session. Please refresh and try again.',
                'VERSION_MISMATCH'
              );
            }
            if (freshOrder.orderStatus === 'SUCCESS' || freshOrder.orderStatus === 'REJECTED') {
              throw new BadRequestError('Order cannot be rejected.', 'INVALID_STATUS');
            }
            if (freshOrder.paymentStatus === 'REFUNDED' || freshOrder.refundStatus === 'COMPLETED') {
              throw new BadRequestError('Order has already been refunded.', 'ALREADY_REFUNDED');
            }

            let balanceBeforePaise: number | null = null;
            let balanceAfterPaise: number | null = null;

            if (payload.refundOption === 'FULL_REFUND') {
              // Load user's wallet
              const wallet = await tx.wallet.findUnique({
                where: { userId: order.userId },
              });
              if (!wallet) {
                throw new BadRequestError('User wallet not found.', 'WALLET_MISSING');
              }

              // Lock the wallet row
              await tx.$executeRawUnsafe('SELECT 1 FROM "Wallet" WHERE id = $1 FOR UPDATE', wallet.id);

              // Verify unique constraint to prevent duplicate refunds
              const existingRefundLedger = await tx.walletLedger.findUnique({
                where: {
                  referenceType_referenceId_type: {
                    referenceType: 'ORDER',
                    referenceId: orderId,
                    type: 'REFUND',
                  },
                },
              });
              if (existingRefundLedger) {
                throw new BadRequestError(
                  'Refund has already been processed for this order.',
                  'DUPLICATE_REFUND'
                );
              }

              balanceBeforePaise = wallet.balancePaise;
              balanceAfterPaise = balanceBeforePaise + order.orderAmountPaise;

              // Credit user wallet
              await tx.wallet.update({
                where: { id: wallet.id },
                data: { balancePaise: balanceAfterPaise },
              });

              // Create Ledger Entry
              await tx.walletLedger.create({
                data: {
                  walletId: wallet.id,
                  amountPaise: order.orderAmountPaise,
                  type: 'REFUND',
                  balanceBeforePaise,
                  balanceAfterPaise,
                  referenceType: 'ORDER',
                  referenceId: orderId,
                  status: 'COMPLETED',
                  remarks: `Refund for rejected order ${order.orderNumber}`,
                },
              });

              // Write WALLET_REFUNDED audit log
              await tx.orderAuditLog.create({
                data: {
                  orderId,
                  action: 'WALLET_REFUNDED',
                  oldStatus: order.orderStatus,
                  newStatus: 'REJECTED',
                  performedByAdminId: adminId,
                  remarks: `Refund of ₹${(order.orderAmountPaise / 100).toFixed(2)} completed to wallet.`,
                  metadata: {
                    walletId: wallet.id,
                    refundAmountPaise: order.orderAmountPaise,
                    balanceBeforePaise,
                    balanceAfterPaise,
                  },
                },
              });
            }

            // Update Order Rejection details
            const updated = await tx.order.updateMany({
              where: { id: orderId, version: expectedVersion },
              data: {
                orderStatus: 'REJECTED',
                rejectedAt: now,
                rejectedByAdminId: adminId,
                internalRejectionReason,
                userVisibleRejectionReason,
                paymentStatus: payload.refundOption === 'FULL_REFUND' ? 'REFUNDED' : 'PAID',
                refundStatus: payload.refundOption === 'FULL_REFUND' ? 'COMPLETED' : 'NOT_REQUIRED',
                refundAmountPaise: payload.refundOption === 'FULL_REFUND' ? order.orderAmountPaise : null,
                version: { increment: 1 },
              },
            });

            if (updated.count === 0) {
              throw new BadRequestError(
                'Order was modified by another session. Please refresh and try again.',
                'VERSION_MISMATCH'
              );
            }

            // Create ORDER_REJECTED audit log
            await tx.orderAuditLog.create({
              data: {
                orderId,
                action: 'ORDER_REJECTED',
                oldStatus: order.orderStatus,
                newStatus: 'REJECTED',
                performedByAdminId: adminId,
                remarks: `Order rejected by ${adminUser?.name || 'Admin'}. Reason: ${userVisibleRejectionReason}${payload.refundOption === 'NO_REFUND' ? `. No-refund reason: ${payload.noRefundReason}` : ''}`,
                metadata: {
                  refundOption: payload.refundOption,
                  internalRejectionReason,
                  userVisibleRejectionReason,
                  noRefundReason: payload.refundOption === 'NO_REFUND' ? payload.noRefundReason : undefined,
                  versionBefore: expectedVersion,
                  versionAfter: expectedVersion + 1,
                },
              },
            });

            return {
              orderId,
              orderStatus: 'REJECTED',
              rejectedAt: now.toISOString(),
              rejectedByAdminId: adminId,
              rejectedByAdminName: adminUser?.name || 'Admin',
              refundStatus: payload.refundOption === 'FULL_REFUND' ? 'COMPLETED' : 'NOT_REQUIRED',
              refundAmountPaise: payload.refundOption === 'FULL_REFUND' ? order.orderAmountPaise : null,
              version: expectedVersion + 1,
            };
          },
          {
            isolationLevel: 'Serializable',
            timeout: 15000,
          }
        );

        return result;
      }
    );
  }

  /**
   * Get user-safe result information for a completed order.
   * Only returns data for orders owned by the authenticated user.
   * Sanitizes internal data and only exposes user-visible information.
   */
  async getUserOrderResult(orderId: string, userId: string) {
    // Verify order ownership
    const order = await orderRepository.findByIdForUser(orderId, userId);
    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    // Only return result if order is completed
    if (order.orderStatus !== 'SUCCESS') {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        resultAvailable: false,
        message: 'Result not available yet.',
      };
    }

    // Fetch result if exists
    const result = await prisma.orderResult.findUnique({
      where: { orderId },
    });

    if (!result) {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        resultAvailable: false,
        message: 'Result not available yet.',
      };
    }

    // Return sanitized result data
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      resultAvailable: true,
      resultType: order.resultTypeSnapshot,
      resultLabel: order.resultLabelSnapshot,
      completedAt: order.completedAt?.toISOString() || null,
      userVisibleCompletionNote: order.userVisibleCompletionNote,
      textValue: (order.resultTypeSnapshot === 'TEXT_RESULT' && result.textValue)
        ? maskValue(order.resultLabelSnapshot || 'Result', result.textValue)
        : result.textValue || null,
      fileName: result.fileName || null,
      fileType: result.fileType || null,
      fileSize: result.fileSize || null,
    };
  }

  /**
   * Generate a temporary signed URL for result file download.
   * Only accessible by the order owner.
   * Creates audit log for download tracking.
   */
  async getUserResultFileAccess(orderId: string, userId: string, action: 'VIEW' | 'DOWNLOAD') {
    // Verify order ownership
    const order = await orderRepository.findByIdForUser(orderId, userId);
    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    // Only allow access if order is completed
    if (order.orderStatus !== 'SUCCESS') {
      throw new BadRequestError('Result not available yet.', 'RESULT_NOT_AVAILABLE');
    }

    // Fetch result
    const result = await prisma.orderResult.findUnique({
      where: { orderId },
    });

    if (!result || !result.storagePath) {
      throw new NotFoundError('Result file not found.', 'RESULT_FILE_NOT_FOUND');
    }

    // Generate signed URL with 5-minute expiry
    const signedUrl = await firebaseService.getSignedUrl(result.storagePath);

    // Create audit log (FR-5.30)
    await prisma.orderAuditLog.create({
      data: {
        orderId,
        action: action === 'VIEW' ? 'RESULT_FILE_VIEWED' : 'RESULT_DOWNLOADED',
        oldStatus: order.orderStatus,
        newStatus: order.orderStatus,
        performedByUserId: userId,
        remarks: `User ${action === 'VIEW' ? 'viewed' : 'downloaded'} result file for order ${order.orderNumber}`,
        metadata: {
          resultId: result.id,
          fileName: result.fileName,
          fileType: result.fileType,
          action,
        },
      },
    });

    return {
      signedUrl,
      fileName: result.fileName,
      fileType: result.fileType,
      fileSize: result.fileSize,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }
}

/**
 * Shared Helper: Resolve an action idempotently by checking ActionIdempotency table and returning snapshots.
 */
async function resolveIdempotentAction(
  adminId: string,
  orderId: string,
  action: string,
  idempotencyKey: string | undefined,
  executeAction: () => Promise<any>
) {
  if (!idempotencyKey) {
    return executeAction();
  }

  try {
    const existing = await prisma.actionIdempotency.findUnique({
      where: {
        adminId_orderId_action_idempotencyKey: {
          adminId,
          orderId,
          action,
          idempotencyKey,
        },
      },
    });
    if (existing) {
      return existing.responseSnapshot;
    }

    const result = await executeAction();

    await prisma.actionIdempotency.create({
      data: {
        adminId,
        orderId,
        action,
        idempotencyKey,
        responseSnapshot: result as any,
      },
    });

    return result;
  } catch (err: any) {
    if (err.code === 'P2002') {
      const existing = await prisma.actionIdempotency.findUnique({
        where: {
          adminId_orderId_action_idempotencyKey: {
            adminId,
            orderId,
            action,
            idempotencyKey,
          },
        },
      });
      if (existing) {
        return existing.responseSnapshot;
      }
    }
    throw err;
  }
}

export const orderService = new OrderService();

