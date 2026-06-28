import { WalletRepository } from './wallet.repository';
import { AppError, NotFoundError, BadRequestError } from '../../core/errors/app.error';
import { maskValue } from '../../core/utils/masking';
import { Prisma, WalletLedgerType, WalletReferenceType, RechargeStatus, RechargeAuditAction, LedgerStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { RECHARGE_CONFIG } from '../../config/recharge.config';
import { firebaseService } from '../firebase/firebase.service';
import crypto from 'crypto';

const walletRepo = new WalletRepository();

export class WalletService {
  /**
   * Get wallet balance for authenticated user.
   * Auto-creates wallet if missing (legacy accounts).
   */
  async getBalance(userId: string): Promise<{ balance: number }> {
    const wallet = await walletRepo.ensureWalletExists(userId);
    return { balance: Number(wallet.balancePaise) / 100 };
  }

  /**
   * Validate wallet has sufficient balance for a debit.
   * Called before starting a transaction.
   */
  async validateSufficientBalance(userId: string, requiredAmount: number): Promise<void> {
    const wallet = await walletRepo.ensureWalletExists(userId);
    const requiredAmountPaise = Math.round(requiredAmount * 100);
    const currentBalancePaise = wallet.balancePaise;

    if (currentBalancePaise < requiredAmountPaise) {
      const currentBalance = currentBalancePaise / 100;
      throw new AppError(
        402,
        `Insufficient wallet balance. Required: ₹${requiredAmount.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}`,
        'INSUFFICIENT_BALANCE'
      );
    }
  }

  /**
   * Debit wallet and record ledger entry inside a transaction.
   * Must be called within prisma.$transaction().
   */
  async debitWithLedgerTx(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    referenceId: string,
    remark: string
  ): Promise<void> {
    const wallet = await walletRepo.findByUserIdTx(tx, userId);

    if (!wallet) {
      throw new NotFoundError('Wallet not found for this user.', 'WALLET_NOT_FOUND');
    }

    const amountPaise = Math.round(amount * 100);
    const balanceBeforePaise = wallet.balancePaise;

    // Guard: ensure balance is still sufficient inside the transaction (race condition protection)
    if (balanceBeforePaise < amountPaise) {
      throw new AppError(402, 'Insufficient wallet balance. Transaction aborted.', 'INSUFFICIENT_BALANCE');
    }

    const updated = await walletRepo.debitTx(tx, wallet.id, amountPaise);

    // Guard: ensure balance never goes negative after debit
    if (updated.balancePaise < 0) {
      throw new AppError(402, 'Wallet debit resulted in negative balance. Transaction aborted.', 'NEGATIVE_BALANCE');
    }

    await walletRepo.createLedgerEntryTx(tx, {
      walletId: wallet.id,
      amountPaise,
      type: WalletLedgerType.DEBIT,
      balanceBeforePaise,
      balanceAfterPaise: updated.balancePaise,
      referenceType: WalletReferenceType.ORDER,
      referenceId,
      remarks: remark,
    });
  }

  /**
   * Get complete wallet transaction history (ledger entries) for the user.
   */
  async getLedger(userId: string) {
    const wallet = await walletRepo.ensureWalletExists(userId);
    
    const ledgers = await prisma.walletLedger.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });

    const orderIds = ledgers
      .filter((l) => l.referenceType === WalletReferenceType.ORDER)
      .map((l) => l.referenceId);

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        orderNumber: true,
        serviceNameSnapshot: true,
        service: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    });

    const orderMap = new Map(orders.map((o) => [o.id, o]));

    return ledgers.map((l) => {
      const order = l.referenceType === WalletReferenceType.ORDER ? orderMap.get(l.referenceId) : null;
      return {
        id: l.id,
        amount: Number(l.amountPaise) / 100,
        type: l.type,
        balanceBefore: Number(l.balanceBeforePaise) / 100,
        balanceAfter: Number(l.balanceAfterPaise) / 100,
        referenceType: l.referenceType,
        referenceId: l.referenceId,
        remark: l.remarks,
        createdAt: l.createdAt,
        orderNumber: order?.orderNumber || l.referenceId,
        serviceName: order?.serviceNameSnapshot || order?.service?.name || (l.referenceType === WalletReferenceType.ORDER ? 'Order Payment' : 'Wallet adjustment'),
        serviceSlug: order?.service?.slug || '',
      };
    });
  }

  /**
   * Credit user wallet (TopUp) and record credit ledger entry inside a database transaction.
   */
  async topup(userId: string, amount: number): Promise<{ newBalance: number; transactionId: string }> {
    if (isNaN(amount) || amount < 100) {
      throw new BadRequestError('Minimum TopUp amount is ₹100.');
    }

    const transactionId = `TXN-${crypto.randomUUID()}`;

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await walletRepo.findByUserIdTx(tx, userId);
      if (!wallet) {
        throw new NotFoundError('Wallet not found for this user.', 'WALLET_NOT_FOUND');
      }

      const amountPaise = Math.round(amount * 100);
      const balanceBeforePaise = wallet.balancePaise;

      const updated = await walletRepo.creditTx(tx, wallet.id, amountPaise);

      await walletRepo.createLedgerEntryTx(tx, {
        walletId: wallet.id,
        amountPaise,
        type: WalletLedgerType.CREDIT,
        balanceBeforePaise,
        balanceAfterPaise: updated.balancePaise,
        referenceType: WalletReferenceType.RECHARGE,
        referenceId: transactionId,
        remarks: `Wallet TopUp of ₹${amount.toFixed(2)} via Secure UPI Gateway.`,
      });

      return { newBalance: Number(updated.balancePaise) / 100 };
    });

    return {
      newBalance: result.newBalance,
      transactionId,
    };
  }

  /**
   * Generate sequential and globally unique recharge number using db sequence
   */
  async generateRechargeNumber(): Promise<string> {
    const year = new Date().getFullYear();
    // 1. Ensure sequence exists
    await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS wallet_recharge_number_seq START WITH 1;`);
    // 2. Get next value from sequence as string
    const result = await prisma.$queryRawUnsafe<{ nextval: string }[]>(
      `SELECT nextval('wallet_recharge_number_seq')::text;`
    );
    const nextVal = Number(result[0].nextval);
    return `HM-RCH-${year}-${String(nextVal).padStart(6, '0')}`;
  }

  /**
   * Create a new recharge request.
   * If there is an active recharge with same amount for the user, return it to prevent spam.
   */
  async createRechargeRequest(
    userId: string,
    amountPaise: number
  ): Promise<{ existingRecharge: boolean; recharge: any }> {
    // 1. Validate amount rules
    if (
      !amountPaise ||
      amountPaise <= 0 ||
      !Number.isSafeInteger(amountPaise) ||
      amountPaise % 100 !== 0
    ) {
      throw new BadRequestError('Amount must be a positive whole rupee integer in paise.');
    }

    if (
      amountPaise < RECHARGE_CONFIG.MIN_TOPUP_AMOUNT_PAISE ||
      amountPaise > RECHARGE_CONFIG.MAX_TOPUP_AMOUNT_PAISE
    ) {
      throw new BadRequestError(
        `Amount must be between ₹${RECHARGE_CONFIG.MIN_TOPUP_AMOUNT_PAISE / 100} and ₹${
          RECHARGE_CONFIG.MAX_TOPUP_AMOUNT_PAISE / 100
        }.`
      );
    }

    // 2. Prevent recharge spam (active controls)
    const existing = await prisma.walletRecharge.findFirst({
      where: {
        userId,
        requestedAmountPaise: amountPaise,
        status: { in: [RechargeStatus.CREATED, RechargeStatus.PAYMENT_INITIATED] },
        paymentExpiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      return { existingRecharge: true, recharge: existing };
    }

    const rechargeNumber = await this.generateRechargeNumber();

    // 3. Store recharge & create audit log in transaction
    const recharge = await prisma.$transaction(async (tx) => {
      const paymentExpiresAt = new Date(Date.now() + RECHARGE_CONFIG.PAYMENT_EXPIRY_MINUTES * 60 * 1000);
      const utrSubmissionDeadline = new Date(
        paymentExpiresAt.getTime() + RECHARGE_CONFIG.UTR_SUBMISSION_GRACE_HOURS * 60 * 60 * 1000
      );

      const r = await tx.walletRecharge.create({
        data: {
          rechargeNumber,
          userId,
          requestedAmountPaise: amountPaise,
          upiAccountId: RECHARGE_CONFIG.UPI_ACCOUNT_ID,
          upiVpaSnapshot: RECHARGE_CONFIG.UPI_VPA,
          payeeNameSnapshot: RECHARGE_CONFIG.UPI_PAYEE_NAME,
          paymentNote: `${RECHARGE_CONFIG.UPI_NOTE_PREFIX}-${rechargeNumber}`,
          status: RechargeStatus.CREATED,
          paymentExpiresAt,
          utrSubmissionDeadline,
        },
      });

      await tx.rechargeAuditLog.create({
        data: {
          rechargeId: r.id,
          action: RechargeAuditAction.RECHARGE_CREATED,
          oldStatus: null,
          newStatus: RechargeStatus.CREATED,
          performedByUserId: userId,
          remarks: 'Wallet recharge request created.',
        },
      });

      return r;
    });

    return { existingRecharge: false, recharge };
  }

  /**
   * List recharges for a user with filters and pagination.
   */
  async listMyRecharges(
    userId: string,
    filters: {
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (filters.status && filters.status !== 'Select') {
      where.status = filters.status as RechargeStatus;
    }

    if (filters.search) {
      where.rechargeNumber = { contains: filters.search, mode: 'insensitive' };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [recharges, total] = await Promise.all([
      prisma.walletRecharge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          rechargeNumber: true,
          requestedAmountPaise: true,
          status: true,
          createdAt: true,
          submittedAt: true,
          resolvedAt: true,
          submissions: {
            orderBy: { submittedAt: 'desc' },
            take: 1,
            select: {
              utr: true,
            },
          },
        },
      }),
      prisma.walletRecharge.count({ where }),
    ]);

    const mapped = recharges.map((r) => {
      const latestSub = r.submissions?.[0];
      let maskedUtr = null;
      if (latestSub) {
        const clean = latestSub.utr;
        maskedUtr = '*'.repeat(Math.max(0, clean.length - 4)) + clean.slice(-4);
      }
      return {
        id: r.id,
        rechargeNumber: r.rechargeNumber,
        requestedAmountPaise: r.requestedAmountPaise,
        status: r.status,
        createdAt: r.createdAt,
        submittedAt: r.submittedAt,
        resolvedAt: r.resolvedAt,
        latestMaskedUtr: maskedUtr,
      };
    });

    return {
      recharges: mapped,
      total,
    };
  }

  /**
   * Get recharge details for a specific user's recharge request.
   */
  async getRechargeDetails(userId: string, rechargeId: string) {
    const recharge = await prisma.walletRecharge.findFirst({
      where: { id: rechargeId, userId },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'asc' },
          include: {
            performedByUser: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        submissions: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!recharge) {
      throw new NotFoundError('Recharge request not found.', 'RECHARGE_NOT_FOUND');
    }

    const maskedSubmissions = recharge.submissions.map((sub) => {
      const clean = sub.utr;
      const masked = '*'.repeat(Math.max(0, clean.length - 4)) + clean.slice(-4);
      return {
        ...sub,
        utr: masked,
      };
    });

    return {
      ...recharge,
      submissions: maskedSubmissions,
      maxResubmissionLimit: RECHARGE_CONFIG.MAX_RESUBMISSION_LIMIT,
    };
  }

  /**
   * Generate payment metadata and canonical UPI URI for an active recharge.
   */
  async generateRechargePaymentData(userId: string, rechargeId: string) {
    const recharge = await this.getRechargeDetails(userId, rechargeId);

    // Block if status is not active (credited, rejected, cancelled) or if it has expired
    const isExpired = recharge.status === RechargeStatus.EXPIRED || 
                      (recharge.paymentExpiresAt && new Date(recharge.paymentExpiresAt) < new Date());
    
    const blockedStatuses: RechargeStatus[] = [
      RechargeStatus.BALANCE_CREDITED,
      RechargeStatus.REJECTED,
      RechargeStatus.EXPIRED,
      RechargeStatus.CANCELLED
    ];

    if (blockedStatuses.includes(recharge.status) || isExpired) {
      throw new BadRequestError('This recharge request is not active or has expired.');
    }

    const amountInRupees = recharge.requestedAmountPaise / 100;
    
    // Canonical UPI URI construction: upi://pay?pa=...
    const encodedPayeeName = encodeURIComponent(recharge.payeeNameSnapshot || 'Helping Mitra');
    const encodedPaymentNote = encodeURIComponent(recharge.paymentNote || 'Wallet Recharge');
    const upiUri = `upi://pay?pa=${recharge.upiVpaSnapshot}&pn=${encodedPayeeName}&tr=${recharge.rechargeNumber}&tn=${encodedPaymentNote}&am=${amountInRupees}&cu=INR`;

    return {
      upiVpa: recharge.upiVpaSnapshot,
      payeeName: recharge.payeeNameSnapshot,
      amountPaise: recharge.requestedAmountPaise,
      rechargeNumber: recharge.rechargeNumber,
      paymentNote: recharge.paymentNote,
      upiUri,
      paymentExpiresAt: recharge.paymentExpiresAt,
    };
  }

  /**
   * Transition recharge status from CREATED to PAYMENT_INITIATED. Idempotent.
   */
  async markPaymentInitiated(userId: string, rechargeId: string) {
    const recharge = await this.getRechargeDetails(userId, rechargeId);

    if (recharge.status === RechargeStatus.PAYMENT_INITIATED) {
      return recharge;
    }

    if (recharge.status !== RechargeStatus.CREATED) {
      throw new BadRequestError(`Cannot initiate payment for recharge in status: ${recharge.status}`);
    }

    const isExpired = recharge.paymentExpiresAt && new Date(recharge.paymentExpiresAt) < new Date();
    if (isExpired) {
      throw new BadRequestError('This recharge request has expired.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.walletRecharge.update({
        where: { id: rechargeId },
        data: { status: RechargeStatus.PAYMENT_INITIATED },
      });

      await tx.rechargeAuditLog.create({
        data: {
          rechargeId,
          action: RechargeAuditAction.PAYMENT_INITIATED,
          oldStatus: RechargeStatus.CREATED,
          newStatus: RechargeStatus.PAYMENT_INITIATED,
          performedByUserId: userId,
          remarks: 'Payment process initiated by user.',
        },
      });

      return u;
    });

    return updated;
  }

  /**
   * Submit payment verification details (UTR and optional screenshot) for a recharge request.
   */
  async submitRechargeVerification(
    userId: string,
    rechargeId: string,
    utr: string,
    proofStoragePath?: string | null
  ) {
    const cleanUtr = utr.trim().replace(/\s+/g, '');

    // 1. Enforce UTR uniqueness
    const existingSubmission = await prisma.rechargeVerificationSubmission.findUnique({
      where: { utr: cleanUtr },
    });

    if (existingSubmission) {
      throw new BadRequestError('This UTR has already been submitted.');
    }

    // 2. Fetch and validate recharge request
    const recharge = await prisma.walletRecharge.findFirst({
      where: { id: rechargeId, userId },
    });

    if (!recharge) {
      throw new NotFoundError('Recharge request not found.', 'RECHARGE_NOT_FOUND');
    }

    // 3. Status eligibility checks
    if (recharge.status !== RechargeStatus.PAYMENT_INITIATED) {
      throw new BadRequestError(`Cannot submit verification for recharge in status: ${recharge.status}`);
    }

    const isDeadlinePassed =
      recharge.utrSubmissionDeadline && new Date() > new Date(recharge.utrSubmissionDeadline);
    if (isDeadlinePassed) {
      throw new BadRequestError('Recharge Expired. Please create a new recharge.');
    }

    // 4. Calculate next submission number
    const count = await prisma.rechargeVerificationSubmission.count({
      where: { rechargeId },
    });
    const submissionNumber = count + 1;

    // 5. Update recharge and log audit in transaction
    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.rechargeVerificationSubmission.create({
        data: {
          rechargeId,
          submissionNumber,
          utr: cleanUtr,
          proofStoragePath: proofStoragePath || null,
          submittedByUserId: userId,
          status: RechargeStatus.VERIFICATION_PENDING,
        },
      });

      const updatedRecharge = await tx.walletRecharge.update({
        where: { id: rechargeId },
        data: {
          status: RechargeStatus.VERIFICATION_PENDING,
          submittedAt: new Date(),
        },
      });

      await tx.rechargeAuditLog.create({
        data: {
          rechargeId,
          action: RechargeAuditAction.VERIFICATION_SUBMITTED,
          oldStatus: recharge.status,
          newStatus: RechargeStatus.VERIFICATION_PENDING,
          performedByUserId: userId,
          remarks: `Payment details submitted with UTR: ${cleanUtr.slice(0, Math.max(0, cleanUtr.length - 4)).replace(/./g, '*')} ${cleanUtr.slice(-4)}.`,
          metadata: { utr: cleanUtr },
        },
      });

      return { submission, recharge: updatedRecharge };
    });

    return result;
  }

  /**
   * Generate secure, temporary signed URL for a submission's proof screenshot.
   */
  async getVerificationProofUrl(userId: string, rechargeId: string, submissionId: string) {
    // 1. Verify recharge belongs to user
    const recharge = await prisma.walletRecharge.findFirst({
      where: { id: rechargeId, userId },
    });

    if (!recharge) {
      throw new NotFoundError('Recharge request not found.', 'RECHARGE_NOT_FOUND');
    }

    // 2. Verify submission belongs to recharge
    const submission = await prisma.rechargeVerificationSubmission.findFirst({
      where: { id: submissionId, rechargeId },
    });

    if (!submission) {
      throw new NotFoundError('Verification submission not found.', 'SUBMISSION_NOT_FOUND');
    }

    // 3. Verify proof path exists
    if (!submission.proofStoragePath) {
      throw new BadRequestError('No proof screenshot uploaded for this submission.');
    }

    // 4. Generate signed URL
    const signedUrl = await firebaseService.getSignedUrl(submission.proofStoragePath);
    return { signedUrl };
  }

  /**
   * List recharge requests for administrative queue with filters and pagination.
   */
  async listAdminRecharges(
    filters: {
      status?: string;
      user?: string;
      rechargeNumber?: string;
      utr?: string;
      dateFrom?: string;
      dateTo?: string;
      amountMinPaise?: number | string;
      amountMaxPaise?: number | string;
    },
    page = 1,
    limit = 10
  ) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.status && filters.status !== 'Select') {
      conditions.push(`r.status = $${params.push(filters.status)}`);
    }

    if (filters.user) {
      const searchPattern = `%${filters.user}%`;
      const searchIndex = params.push(searchPattern);
      conditions.push(`(u.name ILIKE $${searchIndex} OR u.mobile ILIKE $${searchIndex} OR u.email ILIKE $${searchIndex})`);
    }

    if (filters.rechargeNumber) {
      conditions.push(`r."rechargeNumber" ILIKE $${params.push(`%${filters.rechargeNumber}%`)}`);
    }

    if (filters.utr) {
      conditions.push(`EXISTS (
        SELECT 1 FROM "RechargeVerificationSubmission" sub
        WHERE sub."rechargeId" = r.id AND sub.utr ILIKE $${params.push(`%${filters.utr}%`)}
      )`);
    }

    if (filters.dateFrom) {
      conditions.push(`r."createdAt" >= $${params.push(new Date(filters.dateFrom))}`);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(`r."createdAt" <= $${params.push(toDate)}`);
    }

    if (filters.amountMinPaise) {
      conditions.push(`r."requestedAmountPaise" >= $${params.push(Number(filters.amountMinPaise))}`);
    }

    if (filters.amountMaxPaise) {
      conditions.push(`r."requestedAmountPaise" <= $${params.push(Number(filters.amountMaxPaise))}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countQuery = `
      SELECT COUNT(DISTINCT r.id)::int as count
      FROM "WalletRecharge" r
      JOIN "User" u ON r."userId" = u.id
      ${whereClause}
    `;
    const totalResult = await prisma.$queryRawUnsafe<{ count: number }[]>(countQuery, ...params);
    const total = totalResult[0]?.count ?? 0;

    // Sliced and sorted query
    const offset = (page - 1) * limit;
    const limitIndex = params.push(Number(limit));
    const offsetIndex = params.push(Number(offset));

    const selectQuery = `
      SELECT r.id, r."rechargeNumber", r."requestedAmountPaise", r.status, r."createdAt", r."submittedAt",
             u.name AS "userName", u.mobile AS "userMobile", u."userType" AS "userType",
             adm.name AS "reviewerName",
             (
               SELECT s.utr 
               FROM "RechargeVerificationSubmission" s 
               WHERE s."rechargeId" = r.id 
               ORDER BY s."submittedAt" DESC 
               LIMIT 1
             ) AS "latestUtr"
      FROM "WalletRecharge" r
      JOIN "User" u ON r."userId" = u.id
      LEFT JOIN "User" adm ON r."reviewStartedByAdminId" = adm.id
      ${whereClause}
      ORDER BY 
        CASE WHEN r.status = 'VERIFICATION_PENDING' THEN 1 ELSE 2 END ASC,
        r."createdAt" ASC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;
    const recharges = await prisma.$queryRawUnsafe<any[]>(selectQuery, ...params);

    const mapped = recharges.map((r) => {
      let maskedUtr = null;
      if (r.latestUtr) {
        const clean = r.latestUtr;
        maskedUtr = '*'.repeat(Math.max(0, clean.length - 4)) + clean.slice(-4);
      }

      // Calculate Age Of Request
      const ageMs = Date.now() - new Date(r.createdAt).getTime();
      const ageMinutes = Math.floor(ageMs / (1000 * 60));
      let ageString = '';
      if (ageMinutes < 60) {
        ageString = `${ageMinutes}m ago`;
      } else {
        const ageHours = Math.floor(ageMinutes / 60);
        const remainingMinutes = ageMinutes % 60;
        ageString = `${ageHours}h ${remainingMinutes}m ago`;
      }

      return {
        id: r.id,
        rechargeNumber: r.rechargeNumber,
        requestedAmountPaise: r.requestedAmountPaise,
        status: r.status,
        createdAt: r.createdAt,
        submittedAt: r.submittedAt,
        userName: r.userName,
        userMobile: r.userMobile,
        userType: r.userType,
        reviewerName: r.reviewerName,
        maskedUtr,
        ageString,
      };
    });

    // Dashboard metrics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [pendingCount, reviewCount, creditedCount, rejectedCount] = await Promise.all([
      prisma.walletRecharge.count({
        where: { status: RechargeStatus.VERIFICATION_PENDING },
      }),
      prisma.walletRecharge.count({
        where: { status: RechargeStatus.UNDER_REVIEW },
      }),
      prisma.walletRecharge.count({
        where: {
          status: RechargeStatus.BALANCE_CREDITED,
          creditedAt: { gte: startOfToday },
        },
      }),
      prisma.walletRecharge.count({
        where: {
          status: RechargeStatus.REJECTED,
          resolvedAt: { gte: startOfToday },
        },
      }),
    ]);

    return {
      recharges: mapped,
      total,
      summary: {
        pendingCount,
        reviewCount,
        creditedCount,
        rejectedCount,
      },
    };
  }

  /**
   * Fetch complete, unmasked recharge details for admins.
   */
  async getAdminRechargeDetails(rechargeId: string) {
    const recharge = await prisma.walletRecharge.findUnique({
      where: { id: rechargeId },
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
        auditLogs: {
          orderBy: { createdAt: 'asc' },
          include: {
            performedByUser: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        submissions: {
          orderBy: { submittedAt: 'desc' },
          include: {
            submittedByUser: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!recharge) {
      throw new NotFoundError('Recharge request not found.', 'RECHARGE_NOT_FOUND');
    }

    return recharge;
  }

  /**
   * Transition request status to UNDER_REVIEW and assign reviewer details.
   */
  async startRechargeReview(adminId: string, rechargeId: string) {
    const recharge = await prisma.walletRecharge.findUnique({
      where: { id: rechargeId },
    });

    if (!recharge) {
      throw new NotFoundError('Recharge request not found.', 'RECHARGE_NOT_FOUND');
    }

    const allowed: RechargeStatus[] = [RechargeStatus.VERIFICATION_PENDING, RechargeStatus.UNDER_REVIEW];
    if (!allowed.includes(recharge.status)) {
      throw new BadRequestError(
        `Cannot start review. Current status is ${recharge.status}, but VERIFICATION_PENDING is required (or UNDER_REVIEW for reassignment).`
      );
    }

    // Idempotency: if already claimed by the same admin, return early
    if (recharge.status === RechargeStatus.UNDER_REVIEW && recharge.reviewStartedByAdminId === adminId) {
      return recharge;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.walletRecharge.update({
        where: { id: rechargeId },
        data: {
          status: RechargeStatus.UNDER_REVIEW,
          reviewStartedByAdminId: adminId,
          reviewStartedAt: new Date(),
        },
      });

      const oldReviewer = recharge.reviewStartedByAdminId ? `from admin ID ${recharge.reviewStartedByAdminId}` : '';
      const remarks = oldReviewer 
        ? `Admin claimed review and reassigned ownership ${oldReviewer}.` 
        : 'Admin started payment review and claimed ownership.';

      await tx.rechargeAuditLog.create({
        data: {
          rechargeId,
          action: RechargeAuditAction.REVIEW_STARTED,
          oldStatus: recharge.status,
          newStatus: RechargeStatus.UNDER_REVIEW,
          performedByAdminId: adminId,
          remarks,
        },
      });

      return u;
    });

    return updated;
  }

  /**
   * Generate secure signed URL for administrative proof viewing.
   */
  async getAdminVerificationProofUrl(rechargeId: string, submissionId: string) {
    const submission = await prisma.rechargeVerificationSubmission.findFirst({
      where: { id: submissionId, rechargeId },
    });

    if (!submission) {
      throw new NotFoundError('Verification submission not found.', 'SUBMISSION_NOT_FOUND');
    }

    if (!submission.proofStoragePath) {
      throw new BadRequestError('No proof screenshot uploaded for this submission.');
    }

    const signedUrl = await firebaseService.getSignedUrl(submission.proofStoragePath);
    return { signedUrl };
  }

  /**
   * Safe transaction-based wallet credit upon administrative top-up approval.
   */
  async approveRechargeRequest(
    adminId: string,
    rechargeId: string,
    payload: {
      verifiedAmountPaise: number;
      paymentDate: string;
      receivingAccountId: string;
      adminRemarks?: string | null;
    }
  ) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock the Recharge request row for updates
      await tx.$executeRawUnsafe('SELECT 1 FROM "WalletRecharge" WHERE id = $1 FOR UPDATE', rechargeId);

      const recharge = await tx.walletRecharge.findUnique({
        where: { id: rechargeId },
      });

      if (!recharge) {
        throw new NotFoundError('Recharge request not found.', 'RECHARGE_NOT_FOUND');
      }

      // 2. Idempotency Check: if already credited, return success
      if (recharge.status === RechargeStatus.BALANCE_CREDITED) {
        if (recharge.verifiedAmountPaise !== payload.verifiedAmountPaise) {
          throw new BadRequestError('This recharge request has already been credited with a different amount.');
        }
        return { recharge, alreadyCredited: true };
      }

      // FR-4.23 Step 4: Explicit creditedAt IS NULL guard
      // Prevents approval if creditedAt was somehow set without status change.
      if (recharge.creditedAt !== null) {
        throw new BadRequestError(
          'This recharge has already been credited (creditedAt is not null). Approval blocked to prevent duplicate credit.',
          'ALREADY_CREDITED'
        );
      }

      // 3. Status eligibility checks
      const allowed: RechargeStatus[] = [RechargeStatus.VERIFICATION_PENDING, RechargeStatus.UNDER_REVIEW];
      if (!allowed.includes(recharge.status)) {
        throw new BadRequestError(`Cannot approve recharge request in status: ${recharge.status}`);
      }

      // 4. Verify verification submissions exist and fetch the latest submission
      const latestSubmission = await tx.rechargeVerificationSubmission.findFirst({
        where: { rechargeId },
        orderBy: { submittedAt: 'desc' },
      });
      if (!latestSubmission) {
        throw new BadRequestError('No verification submission exists for this recharge request.');
      }

      // FR-4.23 Step 6: UTR uniqueness re-verification at approval time
      // Ensures the UTR has not been credited in ANY other recharge.
      const duplicateUtrCredit = await tx.rechargeVerificationSubmission.findFirst({
        where: {
          utr: latestSubmission.utr,
          rechargeId: { not: rechargeId }, // exclude current recharge
          recharge: {
            status: RechargeStatus.BALANCE_CREDITED,
          },
        },
        include: { recharge: { select: { rechargeNumber: true } } },
      });
      if (duplicateUtrCredit) {
        throw new BadRequestError(
          `UTR has already been credited in a different recharge: ${
            duplicateUtrCredit.recharge?.rechargeNumber ?? 'unknown'
          }. Approval blocked to prevent double-credit fraud.`
        );
      }

      // 5. Amount match checks
      if (payload.verifiedAmountPaise !== recharge.requestedAmountPaise) {
        throw new BadRequestError('Verified amount must match the requested top-up amount exactly.');
      }

      // 6. Double credit check (duplicate prevention)
      const existingLedger = await tx.walletLedger.findUnique({
        where: {
          referenceType_referenceId_type: {
            referenceType: WalletReferenceType.RECHARGE,
            referenceId: rechargeId,
            type: WalletLedgerType.CREDIT,
          },
        },
      });

      if (existingLedger) {
        throw new BadRequestError('A credit ledger entry already exists for this recharge.');
      }

      // 7. Get and lock user wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: recharge.userId },
      });

      if (!wallet) {
        throw new NotFoundError('Wallet not found for the user.', 'WALLET_NOT_FOUND');
      }

      await tx.$executeRawUnsafe('SELECT 1 FROM "Wallet" WHERE id = $1 FOR UPDATE', wallet.id);

      const lockedWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      if (!lockedWallet) {
        throw new NotFoundError('Wallet row locking failed.', 'WALLET_LOCK_FAILED');
      }

      const balanceBeforePaise = lockedWallet.balancePaise;

      // 8. Update Wallet Balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balancePaise: {
            increment: payload.verifiedAmountPaise,
          },
        },
      });

      // 9. Create Wallet Ledger entry
      const ledger = await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          amountPaise: payload.verifiedAmountPaise,
          type: WalletLedgerType.CREDIT,
          balanceBeforePaise,
          balanceAfterPaise: updatedWallet.balancePaise,
          referenceType: WalletReferenceType.RECHARGE,
          referenceId: rechargeId,
          status: LedgerStatus.COMPLETED,
          remarks: payload.adminRemarks || 'Wallet top-up through verified UPI payment',
        },
      });

      // 10. Update Recharge status and verified details
      const updatedRecharge = await tx.walletRecharge.update({
        where: { id: rechargeId },
        data: {
          status: RechargeStatus.BALANCE_CREDITED,
          verifiedAmountPaise: payload.verifiedAmountPaise,
          paymentDate: new Date(payload.paymentDate),
          receivingAccountId: payload.receivingAccountId,
          adminRemarks: payload.adminRemarks,
          resolvedByAdminId: adminId,
          resolvedAt: new Date(),
          creditedAt: new Date(),
        },
      });

      // 11. Create Audit Log
      await tx.rechargeAuditLog.create({
        data: {
          rechargeId,
          action: RechargeAuditAction.APPROVED,
          oldStatus: recharge.status,
          newStatus: RechargeStatus.BALANCE_CREDITED,
          performedByAdminId: adminId,
          remarks: `Payment approved and wallet credited with ₹${(payload.verifiedAmountPaise / 100).toFixed(2)}.`,
          metadata: {
            verifiedAmount: payload.verifiedAmountPaise / 100,
            paymentDate: payload.paymentDate,
            receivingAccountId: payload.receivingAccountId,
            adminRemarks: payload.adminRemarks,
          },
        },
      });

      return { recharge: updatedRecharge, ledger };
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    return result;
  }

  /**
   * Reject payment verification request.
   */
  async rejectRechargeRequest(adminId: string, rechargeId: string, rejectionReason: string) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock recharge request row
      await tx.$executeRawUnsafe('SELECT 1 FROM "WalletRecharge" WHERE id = $1 FOR UPDATE', rechargeId);

      const recharge = await tx.walletRecharge.findUnique({
        where: { id: rechargeId },
      });

      if (!recharge) {
        throw new NotFoundError('Recharge request not found.', 'RECHARGE_NOT_FOUND');
      }

      // 2. Idempotency Check
      if (recharge.status === RechargeStatus.REJECTED) {
        return { recharge, alreadyRejected: true };
      }

      // 3. Status eligibility checks
      const allowed: RechargeStatus[] = [RechargeStatus.VERIFICATION_PENDING, RechargeStatus.UNDER_REVIEW];
      if (!allowed.includes(recharge.status)) {
        throw new BadRequestError(`Cannot reject recharge request in status: ${recharge.status}`);
      }

      // 4. Update status to REJECTED, write rejection reasons
      const updatedRecharge = await tx.walletRecharge.update({
        where: { id: rechargeId },
        data: {
          status: RechargeStatus.REJECTED,
          rejectionReason,
          resolvedByAdminId: adminId,
          resolvedAt: new Date(),
        },
      });

      // 5. Create Audit Log
      await tx.rechargeAuditLog.create({
        data: {
          rechargeId,
          action: RechargeAuditAction.REJECTED,
          oldStatus: recharge.status,
          newStatus: RechargeStatus.REJECTED,
          performedByAdminId: adminId,
          remarks: `Payment rejected: ${rejectionReason}`,
          metadata: { rejectionReason },
        },
      });

      return { recharge: updatedRecharge };
    });

    return result;
  }

  /**
   * Resubmit payment verification details after a recharge request is rejected.
   */
  async resubmitRechargeVerification(
    userId: string,
    rechargeId: string,
    payload: {
      utr?: string | null;
      proofStoragePath?: string | null;
    }
  ) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock recharge request row
      await tx.$executeRawUnsafe('SELECT 1 FROM "WalletRecharge" WHERE id = $1 FOR UPDATE', rechargeId);

      const recharge = await tx.walletRecharge.findUnique({
        where: { id: rechargeId },
        include: {
          submissions: {
            orderBy: { submissionNumber: 'desc' },
            take: 1,
          },
        },
      });

      if (!recharge) {
        throw new NotFoundError('Recharge request not found.', 'RECHARGE_NOT_FOUND');
      }

      // Safeguard ownership
      if (recharge.userId !== userId) {
        throw new BadRequestError('You do not have permission to resubmit this recharge request.');
      }

      // Safeguard immutability of credited requests
      if (recharge.status === RechargeStatus.BALANCE_CREDITED) {
        throw new BadRequestError('Cannot resubmit verification for an already credited recharge request.');
      }

      // 2. Status check: must be REJECTED
      if (recharge.status !== RechargeStatus.REJECTED) {
        throw new BadRequestError(`Resubmission is only allowed for REJECTED recharges. Current status: ${recharge.status}`);
      }

      // 3. Resubmission limit check
      if (recharge.resubmissionCount >= RECHARGE_CONFIG.MAX_RESUBMISSION_LIMIT) {
        throw new BadRequestError('Maximum verification attempts reached. Please contact support.');
      }

      const submissionsCount = await tx.rechargeVerificationSubmission.count({
        where: { rechargeId },
      });
      const nextSubmissionNumber = submissionsCount + 1;
      const lastSubmission = recharge.submissions?.[0];

      let finalUtr = '';
      if (payload.utr && payload.utr.trim()) {
        const cleanUtr = payload.utr.trim().replace(/\s+/g, '');
        // Validate UTR uniqueness globally
        const existing = await tx.rechargeVerificationSubmission.findUnique({
          where: { utr: cleanUtr },
        });
        if (existing) {
          throw new BadRequestError('This UTR has already been submitted.');
        }
        finalUtr = cleanUtr;
      } else {
        // No new UTR provided: reuse old UTR but suffix to bypass database unique index
        if (!lastSubmission) {
          throw new BadRequestError('No previous verification submission found to resubmit.');
        }
        // If the old UTR already had a suffix, extract the base UTR first
        const baseUtr = lastSubmission.utr.split('R')[0];
        finalUtr = `${baseUtr}R${nextSubmissionNumber}`;
      }

      const proofPath = payload.proofStoragePath !== undefined ? payload.proofStoragePath : lastSubmission?.proofStoragePath;

      // 4. Create new submission record
      const submission = await tx.rechargeVerificationSubmission.create({
        data: {
          rechargeId,
          submissionNumber: nextSubmissionNumber,
          utr: finalUtr,
          proofStoragePath: proofPath || null,
          submittedByUserId: userId,
          status: RechargeStatus.VERIFICATION_PENDING,
        },
      });

      // 5. Update recharge request status and increment resubmission count
      const updatedRecharge = await tx.walletRecharge.update({
        where: { id: rechargeId },
        data: {
          status: RechargeStatus.VERIFICATION_PENDING,
          resubmissionCount: {
            increment: 1,
          },
          submittedAt: new Date(),
        },
      });

      // 6. Create Audit Log
      await tx.rechargeAuditLog.create({
        data: {
          rechargeId,
          action: RechargeAuditAction.RESUBMITTED,
          oldStatus: RechargeStatus.REJECTED,
          newStatus: RechargeStatus.VERIFICATION_PENDING,
          performedByUserId: userId,
          remarks: `Verification resubmitted. Attempt #${nextSubmissionNumber}.`,
          metadata: { utr: finalUtr },
        },
      });

      return { submission, recharge: updatedRecharge };
    });

    return result;
  }

  /**
   * Cancel an unused recharge request.
   */
  async cancelRechargeRequest(userId: string, rechargeId: string) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock row
      await tx.$executeRawUnsafe('SELECT 1 FROM "WalletRecharge" WHERE id = $1 FOR UPDATE', rechargeId);

      const recharge = await tx.walletRecharge.findFirst({
        where: { id: rechargeId, userId },
      });

      if (!recharge) {
        throw new NotFoundError('Recharge request not found.', 'RECHARGE_NOT_FOUND');
      }

      // Safeguard immutability of credited requests
      if (recharge.status === RechargeStatus.BALANCE_CREDITED) {
        throw new BadRequestError('Cannot cancel an already credited recharge request.');
      }

      // 2. Idempotency Check
      if (recharge.status === RechargeStatus.CANCELLED) {
        return { recharge, alreadyCancelled: true };
      }

      // 3. Status eligibility checks
      const allowed: RechargeStatus[] = [RechargeStatus.CREATED, RechargeStatus.PAYMENT_INITIATED];
      if (!allowed.includes(recharge.status)) {
        throw new BadRequestError(`Cannot cancel recharge request in status: ${recharge.status}`);
      }

      // 4. Update status to CANCELLED
      const updated = await tx.walletRecharge.update({
        where: { id: rechargeId },
        data: { status: RechargeStatus.CANCELLED },
      });

      // 5. Create Audit Log
      await tx.rechargeAuditLog.create({
        data: {
          rechargeId,
          action: RechargeAuditAction.CANCELLED,
          oldStatus: recharge.status,
          newStatus: RechargeStatus.CANCELLED,
          performedByUserId: userId,
          remarks: 'Recharge request cancelled by user.',
        },
      });

      return { recharge: updated };
    });

    return result;
  }

  /**
   * Auto-expire recharge requests that have passed their expiration thresholds.
   */
  async expireStaleRecharges(): Promise<number> {
    const now = new Date();
    const createdExpiryLimit = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    const paymentInitiatedExpiryLimit = new Date(now.getTime() - RECHARGE_CONFIG.UTR_SUBMISSION_GRACE_HOURS * 60 * 60 * 1000); // e.g. 24 hours ago

    // Find all recharges that are stale
    const staleRecharges = await prisma.walletRecharge.findMany({
      where: {
        OR: [
          { status: RechargeStatus.CREATED, createdAt: { lt: createdExpiryLimit } },
          { status: RechargeStatus.PAYMENT_INITIATED, createdAt: { lt: paymentInitiatedExpiryLimit } },
        ],
      },
      select: { id: true, status: true },
    });

    if (staleRecharges.length === 0) return 0;

    let expiredCount = 0;
    for (const recharge of staleRecharges) {
      try {
        await prisma.$transaction(async (tx) => {
          // Double check status before updating (locking)
          const current = await tx.walletRecharge.findUnique({
            where: { id: recharge.id },
            select: { id: true, status: true },
          });
          
          if (
            current &&
            (current.status === RechargeStatus.CREATED || current.status === RechargeStatus.PAYMENT_INITIATED)
          ) {
            await tx.walletRecharge.update({
              where: { id: recharge.id },
              data: { status: RechargeStatus.EXPIRED },
            });
            
            await tx.rechargeAuditLog.create({
              data: {
                rechargeId: recharge.id,
                action: RechargeAuditAction.EXPIRED,
                oldStatus: current.status,
                newStatus: RechargeStatus.EXPIRED,
                remarks: `Recharge request auto-expired. Status was ${current.status}.`,
              },
            });
            expiredCount++;
          }
        });
      } catch (err) {
        console.error(`Failed to auto-expire recharge ${recharge.id}:`, err);
      }
    }

    return expiredCount;
  }

  /**
   * Adjust a user's wallet balance manually (Admin correction workflow).
   */
  async adjustWalletBalance(
    adminId: string,
    payload: {
      userId: string;
      amountPaise: number; // positive for credit, negative for debit
      remarks: string;
    }
  ) {
    if (!payload.remarks || payload.remarks.trim().length < 10) {
      throw new BadRequestError('A detailed reason (at least 10 characters) is required for wallet adjustments.');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch and lock user wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: payload.userId },
      });

      if (!wallet) {
        throw new NotFoundError('Wallet not found for the user.', 'WALLET_NOT_FOUND');
      }

      await tx.$executeRawUnsafe('SELECT 1 FROM "Wallet" WHERE id = $1 FOR UPDATE', wallet.id);

      const lockedWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      if (!lockedWallet) {
        throw new NotFoundError('Wallet row locking failed.', 'WALLET_LOCK_FAILED');
      }

      const balanceBeforePaise = lockedWallet.balancePaise;
      const balanceAfterPaise = balanceBeforePaise + payload.amountPaise;

      if (balanceAfterPaise < 0) {
        throw new BadRequestError('Wallet balance cannot become negative after adjustment.');
      }

      // 2. Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balancePaise: balanceAfterPaise,
        },
      });

      // 3. Create Wallet Ledger entry of type ADJUSTMENT
      const ledger = await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          amountPaise: Math.abs(payload.amountPaise),
          type: WalletLedgerType.ADJUSTMENT,
          balanceBeforePaise,
          balanceAfterPaise,
          referenceType: WalletReferenceType.ADJUSTMENT,
          referenceId: `adj_${Date.now()}`,
          status: LedgerStatus.COMPLETED,
          remarks: `Manual Admin Adjustment: ${payload.remarks}`,
        },
      });

      return { wallet: updatedWallet, ledger };
    });

    return result;
  }

  async listAdminLedger(
    filters: {
      status?: string;
      type?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;
    const whereClause: Prisma.WalletLedgerWhereInput = {};

    if (filters.status) {
      whereClause.status = filters.status as any;
    }
    if (filters.type) {
      whereClause.type = filters.type as any;
    }
    if (filters.search) {
      whereClause.OR = [
        { referenceId: { contains: filters.search, mode: 'insensitive' } },
        { remarks: { contains: filters.search, mode: 'insensitive' } },
        {
          wallet: {
            user: {
              OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { mobile: { contains: filters.search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) {
        whereClause.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    const [ledgers, total] = await Promise.all([
      prisma.walletLedger.findMany({
        where: whereClause,
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  mobile: true,
                  userType: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletLedger.count({ where: whereClause }),
    ]);

    const mapped = ledgers.map((l) => {
      const user = l.wallet?.user;
      return {
        id: l.id,
        walletId: l.walletId,
        amount: Number(l.amountPaise) / 100, // convert paise to rupees
        amountPaise: l.amountPaise,
        type: l.type,
        balanceBefore: Number(l.balanceBeforePaise) / 100,
        balanceBeforePaise: l.balanceBeforePaise,
        balanceAfter: Number(l.balanceAfterPaise) / 100,
        balanceAfterPaise: l.balanceAfterPaise,
        referenceType: l.referenceType,
        referenceId: l.referenceId,
        status: l.status,
        remark: l.remarks, // align with front-end using "remark" instead of "remarks" if preferred, let's return both to be safe
        remarks: l.remarks,
        createdAt: l.createdAt,
        userName: user?.name ?? 'System/Unknown',
        userEmail: user?.email ?? '-',
        userMobile: user?.mobile ?? '-',
        userType: user?.userType ?? null,
      };
    });

    return {
      ledgers: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const walletService = new WalletService();
