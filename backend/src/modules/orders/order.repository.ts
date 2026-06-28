import { prisma } from '../../config/database';
import { Prisma, ResultType } from '@prisma/client';
import { encrypt } from '../../core/utils/encryption';
import { maskValue } from '../../core/utils/masking';

function checkIsSensitive(key: string, label: string): boolean {
  const testStr = `${key} ${label}`.toLowerCase();
  return (
    testStr.includes('aadhaar') ||
    testStr.includes('pan') ||
    testStr.includes('mobile') ||
    testStr.includes('email') ||
    testStr.includes('phone') ||
    testStr.includes('bank') ||
    testStr.includes('account') ||
    testStr.includes('ifsc') ||
    testStr.includes('passport') ||
    testStr.includes('license')
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
      resultTypeSnapshot?: any;
      resultLabelSnapshot?: string | null;
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
        orderAmountPaise: Math.round(Number(data.orderAmount) * 100),
        consentAccepted: data.consentAccepted,
        consentAcceptedAt: data.consentAcceptedAt,
        idempotencyKey: data.idempotencyKey,
        paymentMode: 'WALLET',
        paymentStatus: 'PAID',
        orderStatus: 'PENDING',
        resultTypeSnapshot: data.resultTypeSnapshot,
        resultLabelSnapshot: data.resultLabelSnapshot,
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
        const encryptedValue = isSensitive ? encrypt(f.value) : null;
        const maskedVal = isSensitive ? maskValue(f.fieldKey, f.value) : f.value;
        return {
          orderId,
          fieldKey: f.fieldKey,
          fieldLabel: f.fieldLabel,
          fieldValue: maskedVal,
          isSensitive,
          encryptedValue,
          maskedValue: isSensitive ? maskedVal : null,
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
   * Find a single order by ID with complete relationships for admin inspection.
   */
  async findOrderDetailForAdmin(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
            userType: true,
            createdAt: true,
          },
        },
        fieldValues: {
          orderBy: { createdAt: 'asc' },
        },
        documents: {
          orderBy: { createdAt: 'asc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
        result: true,
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
      let mappedStatus = filters.orderStatus;
      if (mappedStatus === 'IN_PROGRESS') {
        mappedStatus = 'PROCESSING';
      } else if (mappedStatus === 'COMPLETED') {
        mappedStatus = 'SUCCESS';
      } else if (mappedStatus === 'CANCELLED') {
        mappedStatus = 'REJECTED';
      }
      whereClause.orderStatus = mappedStatus as any;
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

  async findAllForAdmin(
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
    skip = 0,
    take = 20,
    sortBy = 'orderStatus',
    sortOrder: 'asc' | 'desc' = 'asc'
  ) {
    const whereClause: Prisma.OrderWhereInput = {};

    // Filters
    if (filters.orderStatus) {
      whereClause.orderStatus = filters.orderStatus as any;
    }
    if (filters.serviceId) {
      whereClause.serviceId = filters.serviceId;
    }
    if (filters.assignedAdminId) {
      if (filters.assignedAdminId === 'unassigned') {
        whereClause.assignedAdminId = null;
      } else if (filters.assignedAdminId === 'assigned') {
        whereClause.assignedAdminId = { not: null };
      } else {
        whereClause.assignedAdminId = filters.assignedAdminId;
      }
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
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      whereClause.orderAmountPaise = {};
      if (filters.minAmount !== undefined) {
        whereClause.orderAmountPaise.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        whereClause.orderAmountPaise.lte = filters.maxAmount;
      }
    }

    // Search: orderNumber, user.name, user.mobile
    if (filters.search) {
      whereClause.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { mobile: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Sorting
    const orderBy: any[] = [];
    if (sortBy === 'orderStatus') {
      orderBy.push({ orderStatus: sortOrder });
      orderBy.push({ createdAt: 'asc' }); // oldest pending first for default
    } else if (sortBy === 'createdAt') {
      orderBy.push({ createdAt: sortOrder });
    } else if (sortBy === 'orderAmountPaise') {
      orderBy.push({ orderAmountPaise: sortOrder });
    } else {
      orderBy.push({ createdAt: 'desc' });
    }

    return prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        serviceNameSnapshot: true,
        categoryNameSnapshot: true,
        orderAmount: true,
        orderAmountPaise: true,
        orderStatus: true,
        paymentStatus: true,
        refundStatus: true,
        createdAt: true,
        updatedAt: true,
        assignedAdminId: true,
        processingStartedAt: true,
        user: {
          select: {
            name: true,
            mobile: true,
            userType: true,
          },
        },
      },
      orderBy,
      skip,
      take,
    });
  }

  async countAllForAdmin(filters: {
    search?: string;
    orderStatus?: string;
    serviceId?: string;
    assignedAdminId?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
  }) {
    const whereClause: Prisma.OrderWhereInput = {};

    if (filters.orderStatus) {
      whereClause.orderStatus = filters.orderStatus as any;
    }
    if (filters.serviceId) {
      whereClause.serviceId = filters.serviceId;
    }
    if (filters.assignedAdminId) {
      if (filters.assignedAdminId === 'unassigned') {
        whereClause.assignedAdminId = null;
      } else if (filters.assignedAdminId === 'assigned') {
        whereClause.assignedAdminId = { not: null };
      } else {
        whereClause.assignedAdminId = filters.assignedAdminId;
      }
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
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      whereClause.orderAmountPaise = {};
      if (filters.minAmount !== undefined) {
        whereClause.orderAmountPaise.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        whereClause.orderAmountPaise.lte = filters.maxAmount;
      }
    }
    if (filters.search) {
      whereClause.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { mobile: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return prisma.order.count({
      where: whereClause,
    });
  }

  async getStatsForAdmin(filters: { startDate?: Date; endDate?: Date } = {}) {
    const where: Prisma.OrderWhereInput = {};
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }
    return prisma.order.groupBy({
      where,
      by: ['orderStatus'],
      _count: true,
    });
  }

  async findOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId }
    });
  }

  async createInternalNote(
    orderId: string,
    note: string,
    noteType: any,
    createdByAdminId: string
  ) {
    return prisma.orderInternalNote.create({
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
  }

  async findInternalNotes(
    orderId: string,
    filters: {
      search?: string;
      noteType?: any;
      authorId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    skip = 0,
    take = 20
  ) {
    const whereClause: any = { orderId };

    if (filters.noteType) {
      whereClause.noteType = filters.noteType;
    }
    if (filters.authorId) {
      whereClause.createdByAdminId = filters.authorId;
    }
    if (filters.search) {
      whereClause.note = {
        contains: filters.search,
        mode: 'insensitive'
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

    return prisma.orderInternalNote.findMany({
      where: whereClause,
      include: {
        createdByAdmin: {
          select: {
            name: true,
            role: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    });
  }

  async countInternalNotes(
    orderId: string,
    filters: {
      search?: string;
      noteType?: any;
      authorId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const whereClause: any = { orderId };

    if (filters.noteType) {
      whereClause.noteType = filters.noteType;
    }
    if (filters.authorId) {
      whereClause.createdByAdminId = filters.authorId;
    }
    if (filters.search) {
      whereClause.note = {
        contains: filters.search,
        mode: 'insensitive'
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

    return prisma.orderInternalNote.count({
      where: whereClause
    });
  }

  async findOrderResultByOrderId(orderId: string) {
    return prisma.orderResult.findUnique({
      where: { orderId }
    });
  }

  async saveResultDraftTx(
    tx: Prisma.TransactionClient,
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
    createdByAdminId: string,
    resultType: ResultType,
    resultLabel: string
  ) {
    const orderResultData: any = {
      textValue: payload.textValue !== undefined ? payload.textValue : undefined,
      fileName: payload.fileName !== undefined ? payload.fileName : undefined,
      fileType: payload.fileType !== undefined ? payload.fileType : undefined,
      fileSize: payload.fileSize !== undefined ? payload.fileSize : undefined,
      storagePath: payload.storagePath !== undefined ? payload.storagePath : undefined,
      createdByAdminId,
    };

    const draft = await tx.orderResult.upsert({
      where: { orderId },
      create: {
        orderId,
        resultType,
        resultLabel,
        ...orderResultData
      },
      update: {
        ...orderResultData
      }
    });

    const orderUpdateData: any = {};
    if (payload.internalCompletionNote !== undefined) {
      orderUpdateData.internalCompletionNote = payload.internalCompletionNote;
    }
    if (payload.userVisibleCompletionNote !== undefined) {
      orderUpdateData.userVisibleCompletionNote = payload.userVisibleCompletionNote;
    }

    if (Object.keys(orderUpdateData).length > 0) {
      await tx.order.update({
        where: { id: orderId },
        data: orderUpdateData
      });
    }

    return draft;
  }
}

export const orderRepository = new OrderRepository();

