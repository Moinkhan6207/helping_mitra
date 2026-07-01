const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const order = await prisma.order.findUnique({
    where: { id: '7f5296e3-cd16-42bf-9e80-a95d123e8ee1' },
    include: {
      user: true
    }
  });
  console.log('ORDER DETAILS:', JSON.stringify(order, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
