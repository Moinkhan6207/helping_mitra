import { prisma } from '../src/config/database';

async function main() {
  console.log('Fetching orders with 0 orderAmountPaise...');
  const orders = await prisma.order.findMany({
    where: { orderAmountPaise: 0 }
  });

  console.log(`Found ${orders.length} orders to fix.`);

  for (const order of orders) {
    const paise = Math.round(Number(order.orderAmount) * 100);
    console.log(`Updating Order ${order.orderNumber}: ${order.orderAmount} INR -> ${paise} Paise`);
    await prisma.order.update({
      where: { id: order.id },
      data: { orderAmountPaise: paise }
    });
  }

  console.log('✅ All orders updated successfully.');
}

main()
  .catch((err) => {
    console.error('Error fixing order amounts:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
