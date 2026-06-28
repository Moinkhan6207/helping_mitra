const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const PORT = 5050;

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode || 0,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode || 0,
            body: data,
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runOrderRejectionTests() {
  console.log('🧪 Starting Phase 5 Module 9 Order Rejection & Wallet Refund Verification Tests...\n');
  const results = [];

  const addResult = (test, status, details) => {
    results.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test} ${details ? `(${details})` : ''}`);
  };

  let adminToken = '';
  let admin2Token = '';
  let userToken = '';

  let adminId = '';
  let admin2Id = '';
  let userId = '';
  let testServiceId = '';

  const createdOrderIds = [];

  try {
    const passwordHash = bcrypt.hashSync('AdminPassword@123', 10);
    
    // Seed admin2
    const admin2User = await prisma.user.upsert({
      where: { email: 'admin2@helpingmitra.com' },
      update: {},
      create: {
        name: 'Admin Two',
        email: 'admin2@helpingmitra.com',
        mobile: '9999999992',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    admin2Id = admin2User.id;

    // Seed admin3 (for unauthorized admin tests)
    const admin3User = await prisma.user.upsert({
      where: { email: 'admin3@helpingmitra.com' },
      update: {},
      create: {
        name: 'Admin Three',
        email: 'admin3@helpingmitra.com',
        mobile: '9999999993',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // 1. Authenticate users
    const adminLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin@helpingmitra.com', // Super Admin
      password: 'AdminPassword@123',
    });
    if (adminLoginRes.status === 200) {
      adminToken = adminLoginRes.body.data.accessToken;
      adminId = adminLoginRes.body.data.user.id;
      addResult('Super Admin Login', 'PASS');
    } else {
      addResult('Super Admin Login', 'FAIL', `Status: ${adminLoginRes.status}`);
      return;
    }

    const admin2LoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin2@helpingmitra.com', // Regular Admin
      password: 'AdminPassword@123',
    });
    if (admin2LoginRes.status === 200) {
      admin2Token = admin2LoginRes.body.data.accessToken;
      addResult('Regular Admin Login', 'PASS');
    } else {
      addResult('Regular Admin Login', 'FAIL', `Status: ${admin2LoginRes.status}`);
      return;
    }

    const admin3LoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin3@helpingmitra.com', // Regular Admin 3
      password: 'AdminPassword@123',
    });
    let admin3Token = '';
    if (admin3LoginRes.status === 200) {
      admin3Token = admin3LoginRes.body.data.accessToken;
      addResult('Regular Admin 3 Login', 'PASS');
    } else {
      addResult('Regular Admin 3 Login', 'FAIL', `Status: ${admin3LoginRes.status}`);
      return;
    }

    const userLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'testuser@gmail.com',
      password: 'Password@123',
    });
    if (userLoginRes.status === 200) {
      userToken = userLoginRes.body.data.accessToken;
      userId = userLoginRes.body.data.user.id;
      addResult('Customer Login', 'PASS');
    } else {
      addResult('Customer Login', 'FAIL', `Status: ${userLoginRes.status}`);
      return;
    }

    const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };
    const admin2Headers = { 'Authorization': `Bearer ${admin2Token}` };
    const admin3Headers = { 'Authorization': `Bearer ${admin3Token}` };
    const userHeaders = { 'Authorization': `Bearer ${userToken}` };

    // Get active service
    const testService = await prisma.service.findFirst({ where: { status: 'ACTIVE' } });
    testServiceId = testService.id;

    // Seed wallet for the customer
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balancePaise: 100000, // ₹1,000.00
        },
      });
    }

    // Helper to create order in specific status and assign to someone
    async function createTestOrder(resultType, orderStatus, assignedAdminId) {
      const orderNo = `HM-REJ-${resultType.slice(0, 3)}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
      const order = await prisma.order.create({
        data: {
          orderNumber: orderNo,
          userId,
          serviceId: testServiceId,
          serviceNameSnapshot: testService.name,
          categoryNameSnapshot: 'Test Category',
          orderAmount: testService.mrp,
          orderAmountPaise: Math.round(Number(testService.mrp) * 100),
          consentAccepted: true,
          consentAcceptedAt: new Date(),
          orderStatus,
          resultTypeSnapshot: resultType,
          resultLabelSnapshot: `${resultType} Result`,
          assignedAdminId,
          assignedAt: assignedAdminId ? new Date() : null,
          idempotencyKey: `idemp-rej-${orderNo}`,
        }
      });
      createdOrderIds.push(order.id);
      return order;
    }

    // ==========================================
    // TEST 1: AUTHORIZATION / SECURITY CHECK
    // ==========================================
    console.log('\n--- 🟥 TEST 1: Security Authorization checks (Admin-Only rejection) ---');
    const order1 = await createTestOrder('TEXT_RESULT', 'PROCESSING', admin2Id);

    // Customer POST reject -> Expect 403 or 401
    const userRejectRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/reject`, userHeaders, {
      refundOption: 'FULL_REFUND',
      internalRejectionReason: 'Customer request',
      userVisibleRejectionReason: 'Duplicate order',
      version: order1.version,
      idempotencyKey: crypto.randomUUID(),
    });
    if (userRejectRes.status === 403) {
      addResult('Customer blocked from rejection endpoint', 'PASS');
    } else {
      addResult('Customer blocked from rejection endpoint', 'FAIL', `Status: ${userRejectRes.status}`);
    }

    // ==========================================
    // TEST 2: STATUS GUARD CHECKS
    // ==========================================
    console.log('\n--- 🟥 TEST 2: Status Guard Checks (Only PENDING/PROCESSING allowed) ---');
    
    // SUCCESS order -> Expect 400 with "Order cannot be rejected."
    const successOrder = await createTestOrder('TEXT_RESULT', 'SUCCESS', admin2Id);
    const successRejectRes = await makeRequest('POST', `/api/admin/orders/${successOrder.id}/reject`, admin2Headers, {
      refundOption: 'FULL_REFUND',
      internalRejectionReason: 'Completed already',
      userVisibleRejectionReason: 'Completed already',
      version: successOrder.version,
      idempotencyKey: crypto.randomUUID(),
    });
    if (successRejectRes.status === 400 && successRejectRes.body.message === 'Order cannot be rejected.') {
      addResult('Rejection rejected for SUCCESS order', 'PASS');
    } else {
      addResult('Rejection rejected for SUCCESS order', 'FAIL', `Status: ${successRejectRes.status}, Msg: ${successRejectRes.body.message}`);
    }

    // ==========================================
    // TEST 3: PROCESSING OWNERSHIP RULES
    // ==========================================
    console.log('\n--- 🟥 TEST 3: Processing Ownership Enforcements ---');
    // order1 is assigned to admin2Id.
    // Attempt by admin3Token (Non-assigned Admin) -> Expect 403 Forbidden (OWNERSHIP_MISMATCH)
    const admin3RejectRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/reject`, admin3Headers, {
      refundOption: 'FULL_REFUND',
      internalRejectionReason: 'Non-assigned reject',
      userVisibleRejectionReason: 'Non-assigned reject',
      version: order1.version,
      idempotencyKey: crypto.randomUUID(),
    });
    if (admin3RejectRes.status === 403 && admin3RejectRes.body.error?.code === 'OWNERSHIP_MISMATCH') {
      addResult('Non-assigned Admin receives 403 on reject', 'PASS');
    } else {
      addResult('Non-assigned Admin receives 403 on reject', 'FAIL', `Status: ${admin3RejectRes.status}`);
    }

    // Super Admin tries to reject (not assigned, but Super Admin bypasses ownership checks) -> Should succeed
    const superAdminOrder = await createTestOrder('TEXT_RESULT', 'PROCESSING', admin2Id);
    const superAdminRejectRes = await makeRequest('POST', `/api/admin/orders/${superAdminOrder.id}/reject`, adminHeaders, {
      refundOption: 'NO_REFUND',
      internalRejectionReason: 'Super admin bypass',
      userVisibleRejectionReason: 'Super admin bypass',
      noRefundReason: 'Super admin bypass no refund',
      version: superAdminOrder.version,
      idempotencyKey: crypto.randomUUID(),
    });
    if (superAdminRejectRes.status === 200 && superAdminRejectRes.body.data.orderStatus === 'REJECTED') {
      addResult('Super Admin passes ownership check and rejects order', 'PASS');
    } else {
      addResult('Super Admin passes ownership check and rejects order', 'FAIL', `Status: ${superAdminRejectRes.status}`);
    }

    // ==========================================
    // TEST 4: REJECTION VALIDATION CHECKS
    // ==========================================
    console.log('\n--- 🟥 TEST 4: Rejection Validation Checks ---');
    const valOrder = await createTestOrder('TEXT_RESULT', 'PROCESSING', admin2Id);

    // Empty internalRejectionReason
    const valRes1 = await makeRequest('POST', `/api/admin/orders/${valOrder.id}/reject`, admin2Headers, {
      refundOption: 'FULL_REFUND',
      internalRejectionReason: '  ',
      userVisibleRejectionReason: 'Invalid docs',
      version: valOrder.version,
      idempotencyKey: crypto.randomUUID(),
    });
    if (valRes1.status === 400 && valRes1.body.message.includes('Validation failed')) {
      addResult('Rejection validation blocks empty internalRejectionReason', 'PASS');
    } else {
      addResult('Rejection validation blocks empty internalRejectionReason', 'FAIL', `Status: ${valRes1.status}`);
    }

    // Missing refundOption
    const valRes2 = await makeRequest('POST', `/api/admin/orders/${valOrder.id}/reject`, admin2Headers, {
      internalRejectionReason: 'Reason',
      userVisibleRejectionReason: 'Reason',
      version: valOrder.version,
      idempotencyKey: crypto.randomUUID(),
    });
    if (valRes2.status === 400 && valRes2.body.message.includes('Validation failed')) {
      addResult('Rejection validation blocks missing refundOption', 'PASS');
    } else {
      addResult('Rejection validation blocks missing refundOption', 'FAIL', `Status: ${valRes2.status}`);
    }

    // NO_REFUND without noRefundReason -> Expect 400 Bad Request
    const noRefundReasonRes = await makeRequest('POST', `/api/admin/orders/${valOrder.id}/reject`, admin2Headers, {
      refundOption: 'NO_REFUND',
      internalRejectionReason: 'Reason',
      userVisibleRejectionReason: 'Reason',
      version: valOrder.version,
      idempotencyKey: crypto.randomUUID(),
    });
    if (noRefundReasonRes.status === 400 && noRefundReasonRes.body.message.includes('Validation failed')) {
      addResult('Rejection validation blocks NO_REFUND without noRefundReason', 'PASS');
    } else {
      addResult('Rejection validation blocks NO_REFUND without noRefundReason', 'FAIL', `Status: ${noRefundReasonRes.status}`);
    }

    // ==========================================
    // TEST 5: VERSION LOCK / OPTIMISTIC LOCK
    // ==========================================
    console.log('\n--- 🟥 TEST 5: Version Lock Check ---');
    const versionOrder = await createTestOrder('STATUS_ONLY', 'PROCESSING', admin2Id);

    // Provide incorrect version
    const badVersionRes = await makeRequest('POST', `/api/admin/orders/${versionOrder.id}/reject`, admin2Headers, {
      refundOption: 'NO_REFUND',
      internalRejectionReason: 'Rejection reason',
      userVisibleRejectionReason: 'Rejection reason',
      noRefundReason: 'Version mismatch check',
      version: 5,
      idempotencyKey: crypto.randomUUID(),
    });
    if (badVersionRes.status === 400 && badVersionRes.body.error?.code === 'VERSION_MISMATCH') {
      addResult('Incorrect version rejects rejection', 'PASS');
    } else {
      addResult('Incorrect version rejects rejection', 'FAIL', `Status: ${badVersionRes.status}`);
    }

    // ==========================================
    // TEST 6: SUCCESSFUL REJECTION WITH FULL_REFUND
    // ==========================================
    console.log('\n--- 🟥 TEST 6: Successful Rejection with FULL_REFUND ---');
    const refundOrder = await createTestOrder('STATUS_ONLY', 'PROCESSING', admin2Id);

    // Fetch initial wallet balance
    const walletBefore = await prisma.wallet.findUnique({ where: { userId } });
    const initialBalance = walletBefore.balancePaise;

    const refundRes = await makeRequest('POST', `/api/admin/orders/${refundOrder.id}/reject`, admin2Headers, {
      refundOption: 'FULL_REFUND',
      internalRejectionReason: 'Docs incomplete',
      userVisibleRejectionReason: 'Incomplete documentation provided. Please resubmit.',
      version: refundOrder.version,
      idempotencyKey: crypto.randomUUID(),
    });

    if (refundRes.status === 200 && refundRes.body.data.orderStatus === 'REJECTED') {
      addResult('FULL_REFUND rejection request succeeded', 'PASS');
    } else {
      addResult('FULL_REFUND rejection request succeeded', 'FAIL', `Status: ${refundRes.status}`);
    }

    // Verify DB States
    const updatedOrder = await prisma.order.findUnique({ where: { id: refundOrder.id } });
    if (
      updatedOrder.orderStatus === 'REJECTED' &&
      updatedOrder.paymentStatus === 'REFUNDED' &&
      updatedOrder.refundStatus === 'COMPLETED' &&
      updatedOrder.refundAmountPaise === refundOrder.orderAmountPaise
    ) {
      addResult('Order paymentStatus and refundStatus updated', 'PASS');
    } else {
      addResult('Order paymentStatus and refundStatus updated', 'FAIL', `paymentStatus: ${updatedOrder.paymentStatus}, refundStatus: ${updatedOrder.refundStatus}`);
    }

    const walletAfter = await prisma.wallet.findUnique({ where: { userId } });
    if (walletAfter.balancePaise === initialBalance + refundOrder.orderAmountPaise) {
      addResult('Wallet balance credited with order amount', 'PASS');
    } else {
      addResult('Wallet balance credited with order amount', 'FAIL', `Before: ${initialBalance}, After: ${walletAfter.balancePaise}`);
    }

    // Verify ledger record
    const ledger = await prisma.walletLedger.findUnique({
      where: {
        referenceType_referenceId_type: {
          referenceType: 'ORDER',
          referenceId: refundOrder.id,
          type: 'REFUND',
        },
      },
    });
    if (
      ledger &&
      ledger.amountPaise === refundOrder.orderAmountPaise &&
      ledger.balanceBeforePaise === initialBalance &&
      ledger.balanceAfterPaise === walletAfter.balancePaise
    ) {
      addResult('Refund WalletLedger entry generated with correct balances', 'PASS');
    } else {
      addResult('Refund WalletLedger entry generated with correct balances', 'FAIL');
    }

    // Verify audit logs
    const rejectAudit = await prisma.orderAuditLog.findFirst({
      where: { orderId: refundOrder.id, action: 'ORDER_REJECTED' },
    });
    const refundAudit = await prisma.orderAuditLog.findFirst({
      where: { orderId: refundOrder.id, action: 'WALLET_REFUNDED' },
    });
    if (rejectAudit && refundAudit) {
      addResult('ORDER_REJECTED and WALLET_REFUNDED audit logs created', 'PASS');
    } else {
      addResult('ORDER_REJECTED and WALLET_REFUNDED audit logs created', 'FAIL');
    }

    // ==========================================
    // TEST 7: SUCCESSFUL REJECTION WITH NO_REFUND
    // ==========================================
    console.log('\n--- 🟥 TEST 7: Successful Rejection with NO_REFUND ---');
    const noRefundOrder = await createTestOrder('STATUS_ONLY', 'PROCESSING', admin2Id);

    const walletBeforeNo = await prisma.wallet.findUnique({ where: { userId } });
    const initialBalanceNo = walletBeforeNo.balancePaise;

    const noRefundRes = await makeRequest('POST', `/api/admin/orders/${noRefundOrder.id}/reject`, admin2Headers, {
      refundOption: 'NO_REFUND',
      internalRejectionReason: 'Verification failed',
      userVisibleRejectionReason: 'Verification failed',
      noRefundReason: 'Mandatory no-refund test reason',
      version: noRefundOrder.version,
      idempotencyKey: crypto.randomUUID(),
    });

    if (noRefundRes.status === 200 && noRefundRes.body.data.orderStatus === 'REJECTED') {
      addResult('NO_REFUND rejection request succeeded', 'PASS');
    } else {
      addResult('NO_REFUND rejection request succeeded', 'FAIL', `Status: ${noRefundRes.status}`);
    }

    const updatedNoRefundOrder = await prisma.order.findUnique({ where: { id: noRefundOrder.id } });
    if (
      updatedNoRefundOrder.orderStatus === 'REJECTED' &&
      updatedNoRefundOrder.paymentStatus === 'PAID' &&
      updatedNoRefundOrder.refundStatus === 'NOT_REQUIRED'
    ) {
      addResult('NO_REFUND updates order but leaves payment status PAID', 'PASS');
    } else {
      addResult('NO_REFUND updates order but leaves payment status PAID', 'FAIL');
    }

    const walletAfterNo = await prisma.wallet.findUnique({ where: { userId } });
    if (walletAfterNo.balancePaise === initialBalanceNo) {
      addResult('NO_REFUND does not modify wallet balance', 'PASS');
    } else {
      addResult('NO_REFUND does not modify wallet balance', 'FAIL');
    }

    // ==========================================
    // TEST 8: DUPLICATE REFUND PROTECTION
    // ==========================================
    console.log('\n--- 🟥 TEST 8: Duplicate Refund Protection ---');
    // Attempting to inject a second refund on same order using manual Prisma operations to see if database constraints block it
    try {
      await prisma.walletLedger.create({
        data: {
          walletId: wallet.id,
          amountPaise: refundOrder.orderAmountPaise,
          type: 'REFUND',
          balanceBeforePaise: initialBalance,
          balanceAfterPaise: walletAfter.balancePaise,
          referenceType: 'ORDER',
          referenceId: refundOrder.id,
          status: 'COMPLETED',
          remarks: 'Duplicate refund ledger check',
        },
      });
      addResult('Unique constraint fails to block duplicate refund ledger', 'FAIL');
    } catch (dbErr) {
      if (dbErr.code === 'P2002') {
        addResult('Unique constraint blocks duplicate refund ledger successfully', 'PASS');
      } else {
        addResult('Unique constraint fails to block duplicate refund ledger', 'FAIL', dbErr.message);
      }
    }

    // ==========================================
    // TEST 9: IDEMPOTENCY
    // ==========================================
    console.log('\n--- 🟥 TEST 9: Idempotency Checks ---');
    const idempOrder = await createTestOrder('STATUS_ONLY', 'PROCESSING', admin2Id);
    const idempKey = crypto.randomUUID();

    const idempRes1 = await makeRequest('POST', `/api/admin/orders/${idempOrder.id}/reject`, admin2Headers, {
      refundOption: 'FULL_REFUND',
      internalRejectionReason: 'Idemp reason',
      userVisibleRejectionReason: 'Idemp reason',
      version: idempOrder.version,
      idempotencyKey: idempKey,
    });

    const idempRes2 = await makeRequest('POST', `/api/admin/orders/${idempOrder.id}/reject`, admin2Headers, {
      refundOption: 'FULL_REFUND',
      internalRejectionReason: 'Idemp reason',
      userVisibleRejectionReason: 'Idemp reason',
      version: idempOrder.version,
      idempotencyKey: idempKey,
    });

    if (idempRes2.status === 200 && idempRes2.body.data.orderStatus === 'REJECTED') {
      addResult('Idempotency returns successful response on subsequent call', 'PASS');
    } else {
      addResult('Idempotency returns successful response on subsequent call', 'FAIL', `Status: ${idempRes2.status}`);
    }

    const idempLedgers = await prisma.walletLedger.findMany({
      where: { referenceId: idempOrder.id, referenceType: 'ORDER', type: 'REFUND' },
    });
    if (idempLedgers.length === 1) {
      addResult('Idempotency prevented duplicate wallet ledger creation', 'PASS');
    } else {
      addResult('Idempotency prevented duplicate wallet ledger creation', 'FAIL', `Count: ${idempLedgers.length}`);
    }

    // ==========================================
    // TEST 10: CONCURRENCY PROTECTION
    // ==========================================
    console.log('\n--- 🟥 TEST 10: Concurrency Protection Check ---');
    const concOrder = await createTestOrder('STATUS_ONLY', 'PROCESSING', admin2Id);

    // Trigger two requests at the same time
    const req1 = makeRequest('POST', `/api/admin/orders/${concOrder.id}/reject`, admin2Headers, {
      refundOption: 'NO_REFUND',
      internalRejectionReason: 'Conc A',
      userVisibleRejectionReason: 'Conc A',
      noRefundReason: 'Conc A reason',
      version: concOrder.version,
      idempotencyKey: crypto.randomUUID(),
    });
    const req2 = makeRequest('POST', `/api/admin/orders/${concOrder.id}/reject`, admin2Headers, {
      refundOption: 'NO_REFUND',
      internalRejectionReason: 'Conc B',
      userVisibleRejectionReason: 'Conc B',
      noRefundReason: 'Conc B reason',
      version: concOrder.version,
      idempotencyKey: crypto.randomUUID(),
    });

    const [concRes1, concRes2] = await Promise.all([req1, req2]);
    const codes = [concRes1.status, concRes2.status];
    if (codes.includes(200) && codes.includes(400)) {
      addResult('Concurrency lock allows only one concurrent request to succeed', 'PASS');
    } else {
      addResult('Concurrency lock allows only one concurrent request to succeed', 'FAIL', `Statuses: ${codes.join(', ')}`);
    }

    // Clean up temporary admin3
    await prisma.user.delete({ where: { id: admin3User.id } });

  } catch (e) {
    console.error('💥 Fatal error in order rejection verification script:', e);
  } finally {
    // ==========================================
    // CLEANUP
    // ==========================================
    console.log('\n🧹 Cleaning up test database entries...');
    for (const orderId of createdOrderIds) {
      await prisma.orderAuditLog.deleteMany({ where: { orderId } });
      await prisma.walletLedger.deleteMany({ where: { referenceId: orderId, referenceType: 'ORDER' } });
      await prisma.actionIdempotency.deleteMany({ where: { orderId } });
      await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
    }
    await prisma.user.deleteMany({ where: { email: 'admin2@helpingmitra.com' } }).catch(() => {});

    console.log('\n🏁 VERIFICATION FINISHED.');
    const totalPassed = results.filter(r => r.status === 'PASS').length;
    const totalFailed = results.filter(r => r.status === 'FAIL').length;
    console.log(`Summary: Passed: ${totalPassed}, Failed: ${totalFailed}`);
    
    await prisma.$disconnect();
    process.exit(totalFailed > 0 ? 1 : 0);
  }
}

runOrderRejectionTests();
