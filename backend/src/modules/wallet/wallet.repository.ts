import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export class WalletRepository {
  /**
   * Find wallet by userId.
   */
  async findByUserId(userId: string) {
    return prisma.wallet.findUnique({ where: { userId } });
  }

  /**
   * Find wallet by userId within an active transaction context.
   */
  async findByUserIdTx(tx: Prisma.TransactionClient, userId: string) {
    return tx.wallet.findUnique({ where: { userId } });
  }

  /**
   * Create wallet for a user with an optional starting balance.
   */
  async createWallet(userId: string, balance: number = 0) {
    return prisma.wallet.create({
      data: { userId, balance },
    });
  }

  /**
   * Ensure wallet exists for a user.
   * If wallet is missing (legacy user), create it with 0 balance.
   * Returns the wallet record.
   */
  async ensureWalletExists(userId: string) {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;
    return this.createWallet(userId, 0);
  }

  /**
   * Debit wallet balance inside a Prisma transaction.
   * Returns updated wallet.
   */
  async debitTx(tx: Prisma.TransactionClient, walletId: string, amount: Prisma.Decimal) {
    return tx.wallet.update({
      where: { id: walletId },
      data: { balance: { decrement: amount } },
    });
  }

  /**
   * Credit wallet balance inside a Prisma transaction.
   */
  async creditTx(tx: Prisma.TransactionClient, walletId: string, amount: Prisma.Decimal) {
    return tx.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: amount } },
    });
  }

  /**
   * Create a ledger entry inside a transaction.
   */
  async createLedgerEntryTx(
    tx: Prisma.TransactionClient,
    data: {
      walletId: string;
      amount: Prisma.Decimal;
      type: 'DEBIT' | 'CREDIT';
      balanceBefore: Prisma.Decimal;
      balanceAfter: Prisma.Decimal;
      referenceType: 'ORDER' | 'TOPUP' | 'SYSTEM';
      referenceId: string;
      remark: string;
    }
  ) {
    return tx.walletLedger.create({ data });
  }
}
