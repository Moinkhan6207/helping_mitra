import { PrismaClient } from '@prisma/client';

/**
 * -----------------------------------------------------------------------------
 * FUTURE SCALABILITY ARCHITECTURE PREPARATION FOR HIGH-CONCURRENCY FINANCIAL OPERATIONS
 * -----------------------------------------------------------------------------
 * When implementing future modules (Wallet, Payments, Refunds, Orders), the following
 * architectural design decisions and patterns must be strictly followed:
 *
 * 1. DATABASE TRANSACTIONS & CONCURRENCY CONTROL
 *    - All double-entry ledger updates, balance changes, and status transitions (e.g., Order -> Paid)
 *      MUST run inside a database transaction (`prisma.$transaction`).
 *    - To avoid race conditions and double-spending on wallet adjustments, use pessimistic locking
 *      via raw SQL where necessary:
 *        `SELECT balance FROM "Wallet" WHERE "userId" = $1 FOR UPDATE;`
 *    - Alternatively, implement optimistic concurrency control (OCC) by storing a version column
 *      and checking it during updates:
 *        `UPDATE "Wallet" SET balance = balance + amount, version = version + 1 WHERE id = id AND version = currentVersion;`
 *
 * 2. LEDGER DESIGN (DOUBLE-ENTRY BOOKKEEPING)
 *    - Wallet balances MUST NOT be simple mutable columns updated in place without auditability.
 *    - Implement a `LedgerEntry` or `TransactionJournal` table that records all additions (credits)
 *      and subtractions (debits).
 *    - Every financial event must create a balanced set of entries (Assets vs Liabilities/Equity).
 *    - Wallet Balance = Sum of all historical Ledger Entries. For performance, cache the current balance
 *      in a `Wallet` table, but make it recalculable at any time from the ledger log.
 *
 * 3. IDEMPOTENCY & DUPLICATE REQUEST PREVENTION
 *    - For all write operations (creating orders, processing payouts, charging wallets), clients
 *      must submit a unique UUID called `Idempotency-Key` in the request headers.
 *    - Implement an Idempotency Middleware that:
 *      a) Checks if the key exists in a fast-access cache (e.g. Redis) or `IdempotencyKey` table.
 *      b) If it exists and the request is IN_PROGRESS, return 409 Conflict.
 *      c) If completed, return the cached response immediately.
 *      d) If new, save key with status IN_PROGRESS, execute business flow, save response, and return it.
 *
 * 4. UNIQUE TRANSACTION IDS (TRID)
 *    - Generate immutable, globally unique IDs for every transaction using custom prefixed identifiers,
 *      e.g., `tx_` + ULID (Universally Unique Lexicographically Sortable Identifier) or high-entropy UUIDv4.
 *    - Avoid auto-incrementing integer IDs for transactions to prevent predictability and enumeration attacks.
 *    - Ensure the transaction ID is recorded across all related modules (Order -> Payment -> Wallet -> Refund).
 * -----------------------------------------------------------------------------
 */

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Verifies the database connection by executing a lightweight query.
 * Useful during startup and for the health check API.
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Run a fast, minimal query to assert connectivity (works on PostgreSQL)
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database connection verification failed:', error);
    return false;
  }
};

/**
 * Handles graceful database disconnection during app shutdown.
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('🔌 Database client disconnected successfully.');
  } catch (error) {
    console.error('❌ Error disconnecting database client:', error);
  }
};
