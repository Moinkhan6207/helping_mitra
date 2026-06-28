const { orderRepository } = require('../dist/modules/orders/order.repository');
const { prisma } = require('../dist/config/database');

async function main() {
  // Find a valid user to test with
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found to run compatibility tests.');
    return;
  }
  
  console.log('Testing compatibility mappings...');

  // Test 1: Query with legacy status IN_PROGRESS
  console.log('\n--- Querying with IN_PROGRESS ---');
  try {
    const result = await orderRepository.findAllForUser(user.id, { orderStatus: 'IN_PROGRESS' }, 0, 10);
    console.log('Success! Result counts:', result.total, 'Orders:', result.orders.length);
  } catch (error) {
    console.error('Error querying IN_PROGRESS:', error);
  }

  // Test 2: Query with legacy status COMPLETED
  console.log('\n--- Querying with COMPLETED ---');
  try {
    const result = await orderRepository.findAllForUser(user.id, { orderStatus: 'COMPLETED' }, 0, 10);
    console.log('Success! Result counts:', result.total, 'Orders:', result.orders.length);
  } catch (error) {
    console.error('Error querying COMPLETED:', error);
  }

  // Test 3: Query with legacy status CANCELLED
  console.log('\n--- Querying with CANCELLED ---');
  try {
    const result = await orderRepository.findAllForUser(user.id, { orderStatus: 'CANCELLED' }, 0, 10);
    console.log('Success! Result counts:', result.total, 'Orders:', result.orders.length);
  } catch (error) {
    console.error('Error querying CANCELLED:', error);
  }

  // Test 4: Query with new status PROCESSING
  console.log('\n--- Querying with PROCESSING ---');
  try {
    const result = await orderRepository.findAllForUser(user.id, { orderStatus: 'PROCESSING' }, 0, 10);
    console.log('Success! Result counts:', result.total, 'Orders:', result.orders.length);
  } catch (error) {
    console.error('Error querying PROCESSING:', error);
  }

  // Test 5: Query with new status SUCCESS
  console.log('\n--- Querying with SUCCESS ---');
  try {
    const result = await orderRepository.findAllForUser(user.id, { orderStatus: 'SUCCESS' }, 0, 10);
    console.log('Success! Result counts:', result.total, 'Orders:', result.orders.length);
  } catch (error) {
    console.error('Error querying SUCCESS:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
