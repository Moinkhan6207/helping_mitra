import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { activeUserMiddleware } from '../../middlewares/activeUser.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { sendSuccess } from '../../core/responses/api.response';
import { catchAsync } from '../../core/errors/catchAsync';
import { walletService } from './wallet.service';

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

export default router;
