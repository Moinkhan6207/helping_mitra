import { prisma } from '../src/config/database';
import { walletService } from '../src/modules/wallet/wallet.service';
import { RECHARGE_CONFIG } from '../src/config/recharge.config';
import { env } from '../src/config/env';

async function runConfigTests() {
  console.log('🧪 RUNNING UPI CONFIGURATION HARDENING TEST SUITE...');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(` ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  // 1. Verify Startup Schema / Env variables exist
  console.log('\n--- Test 1: Validate startup environment configurations ---');
  assert(env.UPI_ACCOUNT_ID !== undefined && env.UPI_ACCOUNT_ID !== '', `env.UPI_ACCOUNT_ID correctly exists: ${env.UPI_ACCOUNT_ID}`);
  assert(env.UPI_VPA !== undefined && env.UPI_VPA !== '', `env.UPI_VPA correctly exists: ${env.UPI_VPA}`);
  assert(env.UPI_PAYEE_NAME !== undefined && env.UPI_PAYEE_NAME !== '', `env.UPI_PAYEE_NAME correctly exists: ${env.UPI_PAYEE_NAME}`);
  assert(env.UPI_NOTE_PREFIX !== undefined && env.UPI_NOTE_PREFIX !== '', `env.UPI_NOTE_PREFIX correctly exists: ${env.UPI_NOTE_PREFIX}`);

  // Create test user
  const user = await prisma.user.create({
    data: {
      name: 'Config Test User',
      email: `config_user_${Date.now()}@test.com`,
      mobile: `9${String(Date.now()).slice(-9)}`,
      passwordHash: 'hashedpassword',
    },
  });

  try {
    // 2. Create recharge under current configuration (Test 1)
    console.log('\n--- Test 2: Create recharge request under current .env config ---');
    const r1Result = await walletService.createRechargeRequest(user.id, 10000);
    const r1 = r1Result.recharge;

    assert(r1.upiAccountId === env.UPI_ACCOUNT_ID, `Recharge 1 stored correct upiAccountId: ${env.UPI_ACCOUNT_ID}`);
    assert(r1.upiVpaSnapshot === env.UPI_VPA, `Recharge 1 stored correct upiVpaSnapshot: ${env.UPI_VPA}`);
    assert(r1.payeeNameSnapshot === env.UPI_PAYEE_NAME, `Recharge 1 stored correct payeeNameSnapshot: ${env.UPI_PAYEE_NAME}`);
    assert(r1.paymentNote.startsWith(env.UPI_NOTE_PREFIX), `Recharge 1 paymentNote starts with ${env.UPI_NOTE_PREFIX}`);

    // 3. Simulate Environment / config changes and create a second recharge (Test 2)
    console.log('\n--- Test 3: Modify configuration and verify future recharges use new values ---');
    
    // Simulate updating config in memory (representing .env reload on server restart)
    const originalVpa = RECHARGE_CONFIG.UPI_VPA;
    const originalPayee = RECHARGE_CONFIG.UPI_PAYEE_NAME;
    const originalAccountId = RECHARGE_CONFIG.UPI_ACCOUNT_ID;
    
    RECHARGE_CONFIG.UPI_VPA = 'testbusiness@ybl';
    RECHARGE_CONFIG.UPI_PAYEE_NAME = 'Test Business';
    RECHARGE_CONFIG.UPI_ACCOUNT_ID = 'test-account';

    const r2Result = await walletService.createRechargeRequest(user.id, 20000);
    const r2 = r2Result.recharge;

    assert(r2.upiAccountId === 'test-account', 'Recharge 2 correctly stored updated upiAccountId: test-account');
    assert(r2.upiVpaSnapshot === 'testbusiness@ybl', 'Recharge 2 correctly stored updated upiVpaSnapshot: testbusiness@ybl');
    assert(r2.payeeNameSnapshot === 'Test Business', 'Recharge 2 correctly stored updated payeeNameSnapshot: Test Business');

    // Restore config references
    RECHARGE_CONFIG.UPI_VPA = originalVpa;
    RECHARGE_CONFIG.UPI_PAYEE_NAME = originalPayee;
    RECHARGE_CONFIG.UPI_ACCOUNT_ID = originalAccountId;

    // 4. Verify historical snapshots remained unchanged (Test 3)
    console.log('\n--- Test 4: Verify historical recharge snapshots remained unchanged ---');
    const fetchedR1 = await prisma.walletRecharge.findUnique({ where: { id: r1.id } });
    assert(fetchedR1?.upiVpaSnapshot === env.UPI_VPA, `Recharge 1 upiVpaSnapshot remained unaffected by config changes: ${env.UPI_VPA}`);
    assert(fetchedR1?.payeeNameSnapshot === env.UPI_PAYEE_NAME, `Recharge 1 payeeNameSnapshot remained unaffected by config changes: ${env.UPI_PAYEE_NAME}`);

    console.log(`\n🎉 CONFIG AUDIT COMPLETE. PASS: ${passCount}, FAIL: ${failCount}`);

  } catch (err) {
    console.error('Fatal error during configuration testing:', err);
  } finally {
    // Cleanup
    await prisma.rechargeAuditLog.deleteMany({ where: { recharge: { userId: user.id } } });
    await prisma.walletRecharge.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

runConfigTests();
