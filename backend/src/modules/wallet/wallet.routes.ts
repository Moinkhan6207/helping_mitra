import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { activeUserMiddleware } from '../../middlewares/activeUser.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { sendSuccess } from '../../core/responses/api.response';
import { catchAsync } from '../../core/errors/catchAsync';
import { walletService } from './wallet.service';
import { submitVerificationSchema, resubmitVerificationSchema } from './wallet.validation';
import { approveRechargeSchema, rejectRechargeSchema, adjustWalletSchema } from './wallet.admin-validation';
import { ZodTypeAny } from 'zod';

const validateBody = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

const router = Router();

/**
 * GET /api/wallet/balance
 *
 * Returns the real wallet balance for the authenticated active USER.
 * Auto-creates wallet if it doesn't exist (legacy accounts).
 */
router.get(
  '/balance',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { balance } = await walletService.getBalance(req.user!.id);
    sendSuccess(res, 'Wallet balance retrieved successfully', { balance }, 200);
  })
);

/**
 * GET /api/wallet/ledger
 *
 * Returns the full transaction history / ledger entries for the authenticated active user.
 */
router.get(
  '/ledger',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const ledger = await walletService.getLedger(req.user!.id);
    sendSuccess(res, 'Wallet ledger retrieved successfully', ledger, 200);
  })
);

/**
 * POST /api/wallet/topup
 *
 * Credits/Adds money to the authenticated user's wallet.
 */
router.post(
  '/topup',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { amount } = req.body;
    const result = await walletService.topup(req.user!.id, Number(amount));
    sendSuccess(res, 'Wallet topped up successfully', result, 200);
  })
);

import { RECHARGE_CONFIG } from '../../config/recharge.config';

/**
 * GET /api/wallet/recharges/config
 *
 * Returns limits and configurations for wallet top-ups.
 */
router.get(
  '/recharges/config',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, 'Recharge configuration retrieved successfully', {
      minAmountPaise: RECHARGE_CONFIG.MIN_TOPUP_AMOUNT_PAISE,
      maxAmountPaise: RECHARGE_CONFIG.MAX_TOPUP_AMOUNT_PAISE,
      paymentExpiryMinutes: RECHARGE_CONFIG.PAYMENT_EXPIRY_MINUTES,
      utrSubmissionGraceHours: RECHARGE_CONFIG.UTR_SUBMISSION_GRACE_HOURS,
    }, 200);
  })
);

/**
 * POST /api/wallet/recharges
 *
 * Creates a recharge request or returns an existing active one.
 */
router.post(
  '/recharges',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { amountPaise } = req.body;
    const result = await walletService.createRechargeRequest(req.user!.id, Number(amountPaise));
    sendSuccess(res, 'Recharge request processed successfully', result, 201);
  })
);

/**
 * GET /api/wallet/recharges
 *
 * Lists the authenticated user's recharge requests.
 */
router.get(
  '/recharges',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { status, search, dateFrom, dateTo, page, limit } = req.query;
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const limitNum = limit ? Math.max(1, Number(limit)) : 10;

    const result = await walletService.listMyRecharges(
      req.user!.id,
      {
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
        dateFrom: dateFrom ? String(dateFrom) : undefined,
        dateTo: dateTo ? String(dateTo) : undefined,
      },
      pageNum,
      limitNum
    );

    sendSuccess(res, 'Recharges retrieved successfully', result, 200);
  })
);

/**
 * GET /api/wallet/recharges/:rechargeId
 *
 * Gets detailed information of a single recharge request.
 */
router.get(
  '/recharges/:rechargeId',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId } = req.params;
    const recharge = await walletService.getRechargeDetails(req.user!.id, rechargeId);
    sendSuccess(res, 'Recharge details retrieved successfully', recharge, 200);
  })
);

/**
 * GET /api/wallet/recharges/:rechargeId/payment-data
 *
 * Gets UPI payment data and intent link for a recharge request.
 */
router.get(
  '/recharges/:rechargeId/payment-data',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId } = req.params;
    const paymentData = await walletService.generateRechargePaymentData(req.user!.id, rechargeId);
    sendSuccess(res, 'Payment data generated successfully', paymentData, 200);
  })
);

/**
 * PATCH /api/wallet/recharges/:rechargeId/payment-initiated
 *
 * Marks a recharge request status as PAYMENT_INITIATED.
 */
router.patch(
  '/recharges/:rechargeId/payment-initiated',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId } = req.params;
    const recharge = await walletService.markPaymentInitiated(req.user!.id, rechargeId);
    sendSuccess(res, 'Payment status marked as initiated successfully', recharge, 200);
  })
);

/**
 * POST /api/wallet/recharges/:rechargeId/verifications
 *
 * Submits payment verification details (UTR and optional screenshot path).
 */
router.post(
  '/recharges/:rechargeId/verifications',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  validateBody(submitVerificationSchema),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId } = req.params;
    const { utr, proofStoragePath } = req.body;
    const result = await walletService.submitRechargeVerification(
      req.user!.id,
      rechargeId,
      utr,
      proofStoragePath
    );
    sendSuccess(res, 'Recharge verification details submitted successfully', result, 201);
  })
);

/**
 * POST /api/wallet/recharges/:rechargeId/verifications/resubmit
 *
 * Resubmits payment verification details after a recharge request is rejected.
 */
router.post(
  '/recharges/:rechargeId/verifications/resubmit',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  validateBody(resubmitVerificationSchema),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId } = req.params;
    const result = await walletService.resubmitRechargeVerification(
      req.user!.id,
      rechargeId,
      req.body
    );
    sendSuccess(res, 'Recharge verification details resubmitted successfully', result, 200);
  })
);

/**
 * PATCH /api/wallet/recharges/:rechargeId/cancel
 *
 * Cancels an unused recharge request.
 */
router.patch(
  '/recharges/:rechargeId/cancel',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId } = req.params;
    const result = await walletService.cancelRechargeRequest(req.user!.id, rechargeId);
    sendSuccess(res, 'Recharge request cancelled successfully', result, 200);
  })
);

/**
 * GET /api/wallet/recharges/:rechargeId/verifications/:submissionId/proof-url
 *
 * Generates a temporary signed URL to view a verification proof screenshot.
 */
router.get(
  '/recharges/:rechargeId/verifications/:submissionId/proof-url',
  authMiddleware,
  activeUserMiddleware,
  requireRole('USER'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId, submissionId } = req.params;
    const result = await walletService.getVerificationProofUrl(
      req.user!.id,
      rechargeId,
      submissionId
    );
    sendSuccess(res, 'Proof signed URL generated successfully', result, 200);
  })
);

/**
 * GET /api/wallet/admin/recharges
 *
 * Lists all recharge requests in the system with filters and pagination for Admins.
 */
router.get(
  '/admin/recharges',
  authMiddleware,
  activeUserMiddleware,
  requireRole('ADMIN'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const {
      status,
      user,
      rechargeNumber,
      utr,
      dateFrom,
      dateTo,
      amountMinPaise,
      amountMaxPaise,
      page,
      limit,
    } = req.query;

    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const limitNum = limit ? Math.max(1, Number(limit)) : 10;

    const result = await walletService.listAdminRecharges(
      {
        status: status ? String(status) : undefined,
        user: user ? String(user) : undefined,
        rechargeNumber: rechargeNumber ? String(rechargeNumber) : undefined,
        utr: utr ? String(utr) : undefined,
        dateFrom: dateFrom ? String(dateFrom) : undefined,
        dateTo: dateTo ? String(dateTo) : undefined,
        amountMinPaise: amountMinPaise ? Number(amountMinPaise) : undefined,
        amountMaxPaise: amountMaxPaise ? Number(amountMaxPaise) : undefined,
      },
      pageNum,
      limitNum
    );

    sendSuccess(res, 'Admin recharge queue retrieved successfully', result, 200);
  })
);

/**
 * GET /api/wallet/admin/recharges/:rechargeId
 *
 * Fetch detailed information for a single recharge request (Admin view, raw UTR).
 */
router.get(
  '/admin/recharges/:rechargeId',
  authMiddleware,
  activeUserMiddleware,
  requireRole('ADMIN'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId } = req.params;
    const result = await walletService.getAdminRechargeDetails(rechargeId);
    sendSuccess(res, 'Admin recharge details retrieved successfully', result, 200);
  })
);

/**
 * PATCH /api/wallet/admin/recharges/:rechargeId/review
 *
 * Starts a review session and claims review ownership for the admin.
 */
router.patch(
  '/admin/recharges/:rechargeId/review',
  authMiddleware,
  activeUserMiddleware,
  requireRole('ADMIN'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId } = req.params;
    const result = await walletService.startRechargeReview(req.user!.id, rechargeId);
    sendSuccess(res, 'Recharge review started successfully', result, 200);
  })
);

/**
 * GET /api/wallet/admin/recharges/:rechargeId/verifications/:submissionId/proof-url
 *
 * Generates a signed temporary URL for admin to view payment proof.
 */
router.get(
  '/admin/recharges/:rechargeId/verifications/:submissionId/proof-url',
  authMiddleware,
  activeUserMiddleware,
  requireRole('ADMIN'),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId, submissionId } = req.params;
    const result = await walletService.getAdminVerificationProofUrl(rechargeId, submissionId);
    sendSuccess(res, 'Proof signed URL generated successfully', result, 200);
  })
);

/**
 * POST /api/wallet/admin/recharges/:rechargeId/approve
 *
 * Approves a recharge request and credits the user's wallet.
 */
router.post(
  '/admin/recharges/:rechargeId/approve',
  authMiddleware,
  activeUserMiddleware,
  requireRole('ADMIN'),
  validateBody(approveRechargeSchema),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId } = req.params;
    const result = await walletService.approveRechargeRequest(req.user!.id, rechargeId, req.body);
    sendSuccess(res, 'Recharge request approved and wallet credited successfully', result, 200);
  })
);

/**
 * POST /api/wallet/admin/recharges/:rechargeId/reject
 *
 * Rejects a recharge request.
 */
router.post(
  '/admin/recharges/:rechargeId/reject',
  authMiddleware,
  activeUserMiddleware,
  requireRole('ADMIN'),
  validateBody(rejectRechargeSchema),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { rechargeId } = req.params;
    const { rejectionReason } = req.body;
    const result = await walletService.rejectRechargeRequest(req.user!.id, rechargeId, rejectionReason);
    sendSuccess(res, 'Recharge request rejected successfully', result, 200);
  })
);

/**
 * POST /api/wallet/admin/adjust
 *
 * Performs manual adjustment on user's wallet balance (Admin correction workflow).
 */
router.post(
  '/admin/adjust',
  authMiddleware,
  activeUserMiddleware,
  requireRole('ADMIN'),
  validateBody(adjustWalletSchema),
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await walletService.adjustWalletBalance(req.user!.id, req.body);
    sendSuccess(res, 'Wallet balance adjusted successfully', result, 200);
  })
);

export default router;
