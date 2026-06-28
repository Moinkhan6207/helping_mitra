const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const usersCount = await prisma.user.count();
  const walletCount = await prisma.wallet.count();
  const ledgerCount = await prisma.walletLedger.count();
  const rechargeCount = await prisma.walletRecharge.count();
  console.log('--- DATABASE COUNTS ---');
  console.log('Users:', usersCount);
  console.log('Wallets:', walletCount);
  console.log('Ledgers:', ledgerCount);
  console.log('Recharges:', rechargeCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
