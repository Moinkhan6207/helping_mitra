import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

function checkIsSensitive(key: string, label: string): boolean {
  const testStr = `${key} ${label}`.toLowerCase();
  return (
    testStr.includes('aadhaar') ||
    testStr.includes('pan') ||
    testStr.includes('mobile') ||
    testStr.includes('email') ||
    testStr.includes('phone')
  );
}

export class OrderRepository {
  /**
   * Create order inside a Prisma transaction.
   */
  async createOrderTx(
    tx: Prisma.TransactionClient,
    data: {
      userId: string;
      serviceId: string;
      serviceNameSnapshot: string;
      categoryNameSnapshot: string;
      orderAmount: Prisma.Decimal;
      consentAccepted: boolean;
      consentAcceptedAt: Date;
      idempotencyKey: string;
    }
  ) {
    // 1. Get the last order number to compute the next sequential number
    const lastOrder = await tx.order.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    const currentYear = new Date().getFullYear();
    let nextSequence = 1;

    if (lastOrder && lastOrder.orderNumber) {
      const parts = lastOrder.orderNumber.split('-');
      if (parts.length === 3) {
        const orderYear = parseInt(parts[1], 10);
        const orderSeq = parseInt(parts[2], 10);
        if (orderYear === currentYear) {
          nextSequence = orderSeq + 1;
        }
      }
    }

    const orderNumber = `HM-${currentYear}-${String(nextSequence).padStart(6, '0')}`;

    return tx.order.create({
      data: {
        orderNumber,
        userId: data.userId,
        serviceId: data.serviceId,
        serviceNameSnapshot: data.serviceNameSnapshot,
        categoryNameSnapshot: data.categoryNameSnapshot,
        orderAmount: data.orderAmount,
        consentAccepted: data.consentAccepted,
        consentAcceptedAt: data.consentAcceptedAt,
        idempotencyKey: data.idempotencyKey,
        paymentMode: 'WALLET',
        paymentStatus: 'PAID',
        orderStatus: 'PENDING',
      },
    });
  }

  /**
   * Save all dynamic field values for an order inside a transaction.
   */
  async saveFieldValuesTx(
    tx: Prisma.TransactionClient,
    orderId: string,
    fields: { fieldKey: string; fieldLabel: string; value: string }[]
  ) {
    if (!fields.length) return;
    await tx.orderFieldValue.createMany({
      data: fields.map((f) => {
        const isSensitive = checkIsSensitive(f.fieldKey, f.fieldLabel);
        return {
          orderId,
          fieldKey: f.fieldKey,
          fieldLabel: f.fieldLabel,
          fieldValue: f.value,
          isSensitive,
        };
      }),
    });
  }

  /**
   * Save all document metadata for an order inside a transaction.
   */
  async saveDocumentsTx(
    tx: Prisma.TransactionClient,
    orderId: string,
    documents: {
      documentKey: string;
      documentName: string;
      fileName: string;
      storagePath: string;
      fileSize: number;
      fileType: string;
    }[]
  ) {
    if (!documents.length) return;
    await tx.orderDocument.createMany({
      data: documents.map((d) => ({
        orderId,
        documentKey: d.documentKey,
        documentName: d.documentName,
        fileName: d.fileName,
        fileType: d.fileType,
        fileSize: d.fileSize,
        storagePath: d.storagePath,
      })),
    });
  }

  /**
   * Find a single order by ID, including field values and documents.
   * Only returns the order if it belongs to the given userId (if provided).
   */
  async findByIdForUser(orderId: string, userId?: string) {
    const whereClause: Prisma.OrderWhereInput = { id: orderId };
    if (userId) {
      whereClause.userId = userId;
    }
    return prisma.order.findFirst({
      where: whereClause,
      include: {
        fieldValues: true,
        documents: {
          select: {
            id: true,
            documentKey: true,
            documentName: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            storagePath: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * List all orders for a user, newest first, with filtering.
   */
  async findAllForUser(
    userId: string,
    filters: {
      orderStatus?: string;
      serviceId?: string;
      categoryName?: string;
      search?: string;
      startDate?: Date;
      endDate?: Date;
    },
    skip = 0,
    take = 20
  ) {
    const whereClause: Prisma.OrderWhereInput = { userId };

    if (filters.orderStatus) {
      whereClause.orderStatus = filters.orderStatus as any;
    }
    if (filters.serviceId) {
      whereClause.serviceId = filters.serviceId;
    }
    if (filters.categoryName) {
      whereClause.categoryNameSnapshot = {
        equals: filters.categoryName,
        mode: 'insensitive',
      };
    }
    if (filters.search) {
      whereClause.orderNumber = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          fieldValues: true,
          documents: true,
        },
        skip,
        take,
      }),
      prisma.order.count({ where: whereClause }),
    ]);
    return { orders, total };
  }
}

export const orderRepository = new OrderRepository();

