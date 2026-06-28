import { prisma } from '../src/config/database';

async function main() {
  const orderCounts = await prisma.order.groupBy({
    by: ['orderStatus'],
    _count: true,
  });
  console.log('--- ORDER STATUS COUNTS IN DB ---');
  console.log(JSON.stringify(orderCounts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
