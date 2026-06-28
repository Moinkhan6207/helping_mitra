import { prisma } from '../src/config/database';

async function main() {
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      fieldValues: true,
      documents: true,
      auditLogs: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });
  console.log('--- LATEST ORDER IN DB ---');
  console.log(JSON.stringify(latestOrder, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
