import { prisma } from '../../config/database';
import { Prisma, WalletLedgerType, WalletReferenceType } from '@prisma/client';

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
   * Create wallet for a user with an optional starting balance in paise.
   */
  async createWallet(userId: string, balancePaise: number = 0) {
    return prisma.wallet.create({
      data: { userId, balancePaise },
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
  async debitTx(tx: Prisma.TransactionClient, walletId: string, amountPaise: number) {
    return tx.wallet.update({
      where: { id: walletId },
      data: { balancePaise: { decrement: amountPaise } },
    });
  }

  /**
   * Credit wallet balance inside a Prisma transaction.
   */
  async creditTx(tx: Prisma.TransactionClient, walletId: string, amountPaise: number) {
    return tx.wallet.update({
      where: { id: walletId },
      data: { balancePaise: { increment: amountPaise } },
    });
  }

  /**
   * Create a ledger entry inside a transaction.
   */
  async createLedgerEntryTx(
    tx: Prisma.TransactionClient,
    data: {
      walletId: string;
      amountPaise: number;
      type: WalletLedgerType;
      balanceBeforePaise: number;
      balanceAfterPaise: number;
      referenceType: WalletReferenceType;
      referenceId: string;
      remarks: string;
    }
  ) {
    return tx.walletLedger.create({ data });
  }
}
