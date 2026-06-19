import { WalletRepository } from './wallet.repository';
import { AppError, NotFoundError, BadRequestError } from '../../core/errors/app.error';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import crypto from 'crypto';

const walletRepo = new WalletRepository();

export class WalletService {
  /**
   * Get wallet balance for authenticated user.
   * Auto-creates wallet if missing (legacy accounts).
   */
  async getBalance(userId: string): Promise<{ balance: number }> {
    const wallet = await walletRepo.ensureWalletExists(userId);
    return { balance: Number(wallet.balance) };
  }

  /**
   * Validate wallet has sufficient balance for a debit.
   * Called before starting a transaction.
   */
  async validateSufficientBalance(userId: string, requiredAmount: number): Promise<void> {
    const wallet = await walletRepo.ensureWalletExists(userId);
    const currentBalance = Number(wallet.balance);

    if (currentBalance < requiredAmount) {
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

    const amountDecimal = new Prisma.Decimal(amount);
    const balanceBefore = wallet.balance;

    // Guard: ensure balance is still sufficient inside the transaction (race condition protection)
    if (Number(balanceBefore) < amount) {
      throw new AppError(402, 'Insufficient wallet balance. Transaction aborted.', 'INSUFFICIENT_BALANCE');
    }

    const updated = await walletRepo.debitTx(tx, wallet.id, amountDecimal);

    // Guard: ensure balance never goes negative after debit
    if (Number(updated.balance) < 0) {
      throw new AppError(402, 'Wallet debit resulted in negative balance. Transaction aborted.', 'NEGATIVE_BALANCE');
    }

    await walletRepo.createLedgerEntryTx(tx, {
      walletId: wallet.id,
      amount: amountDecimal,
      type: 'DEBIT',
      balanceBefore,
      balanceAfter: updated.balance,
      referenceType: 'ORDER',
      referenceId,
      remark,
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
      .filter((l) => l.referenceType === 'ORDER')
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
      const order = l.referenceType === 'ORDER' ? orderMap.get(l.referenceId) : null;
      return {
        id: l.id,
        amount: Number(l.amount),
        type: l.type,
        balanceBefore: Number(l.balanceBefore),
        balanceAfter: Number(l.balanceAfter),
        referenceType: l.referenceType,
        referenceId: l.referenceId,
        remark: l.remark,
        createdAt: l.createdAt,
        orderNumber: order?.orderNumber || l.referenceId,
        serviceName: order?.serviceNameSnapshot || order?.service?.name || (l.referenceType === 'ORDER' ? 'Order Payment' : 'Wallet adjustment'),
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

      const amountDecimal = new Prisma.Decimal(amount);
      const balanceBefore = wallet.balance;

      const updated = await walletRepo.creditTx(tx, wallet.id, amountDecimal);

      await walletRepo.createLedgerEntryTx(tx, {
        walletId: wallet.id,
        amount: amountDecimal,
        type: 'CREDIT',
        balanceBefore,
        balanceAfter: updated.balance,
        referenceType: 'TOPUP',
        referenceId: transactionId,
        remark: `Wallet TopUp of ₹${amount.toFixed(2)} via Secure UPI Gateway.`,
      });

      return { newBalance: Number(updated.balance) };
    });

    return {
      newBalance: result.newBalance,
      transactionId,
    };
  }
}

export const walletService = new WalletService();
