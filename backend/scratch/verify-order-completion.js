const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');
const bcrypt = require('bcrypt');

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

async function runOrderCompletionTests() {
  console.log('🧪 Starting Phase 5 Module 8 Order Completion & Workflow Verification Tests...\n');
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

    // Helper to create order in specific status and assign to someone
    async function createTestOrder(resultType, orderStatus, assignedAdminId) {
      const orderNo = `HM-COMP-${resultType.slice(0, 3)}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
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
          idempotencyKey: `idemp-comp-${orderNo}`,
        }
      });
      createdOrderIds.push(order.id);
      return order;
    }

    // ==========================================
    // TEST 1: AUTHORIZATION / SECURITY CHECK
    // ==========================================
    console.log('\n--- 🟥 TEST 1: Security Authorization checks (Admin-Only completion) ---');
    const order1 = await createTestOrder('TEXT_RESULT', 'PROCESSING', admin2Id);

    // Customer POST complete -> Expect 403 or 401
    const userCompleteRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/complete`, userHeaders, { version: order1.version });
    if (userCompleteRes.status === 403) {
      addResult('Customer blocked from completion endpoint', 'PASS');
    } else {
      addResult('Customer blocked from completion endpoint', 'FAIL', `Status: ${userCompleteRes.status}`);
    }

    // ==========================================
    // TEST 2: STATUS GUARD CHECKS
    // ==========================================
    console.log('\n--- 🟥 TEST 2: Status Guard Checks (Only PROCESSING allowed) ---');
    const pendingOrder = await createTestOrder('TEXT_RESULT', 'PENDING', admin2Id);

    const pendingCompleteRes = await makeRequest('POST', `/api/admin/orders/${pendingOrder.id}/complete`, admin2Headers, { version: pendingOrder.version });
    if (pendingCompleteRes.status === 400 && pendingCompleteRes.body.error?.code === 'INVALID_STATUS') {
      addResult('Complete rejected for PENDING order', 'PASS');
    } else {
      addResult('Complete rejected for PENDING order', 'FAIL', `Status: ${pendingCompleteRes.status}`);
    }

    // ==========================================
    // TEST 3: PROCESSING OWNERSHIP RULES
    // ==========================================
    console.log('\n--- 🟥 TEST 3: Processing Ownership Enforcements ---');
    // order1 is assigned to admin2Id.
    // Attempt by admin3Token (Non-assigned Admin) -> Expect 403 Forbidden (OWNERSHIP_MISMATCH)
    const admin3CompleteRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/complete`, admin3Headers, { version: order1.version });
    if (admin3CompleteRes.status === 403 && admin3CompleteRes.body.error?.code === 'OWNERSHIP_MISMATCH') {
      addResult('Non-assigned Admin receives 403 on complete', 'PASS');
    } else {
      addResult('Non-assigned Admin receives 403 on complete', 'FAIL', `Status: ${admin3CompleteRes.status}`);
    }

    // Super Admin tries to complete (not assigned, but Super Admin bypasses ownership checks) -> Should proceed past ownership (will fail result validation instead)
    const superAdminCompleteRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/complete`, adminHeaders, { version: order1.version });
    if (superAdminCompleteRes.status === 400 && superAdminCompleteRes.body.error?.code === 'VALIDATION_FAILED') {
      addResult('Super Admin passes ownership check but fails validation', 'PASS');
    } else {
      addResult('Super Admin passes ownership check but fails validation', 'FAIL', `Status: ${superAdminCompleteRes.status}`);
    }

    // ==========================================
    // TEST 4: RESULT VALIDATION CHECKS
    // ==========================================
    console.log('\n--- 🟥 TEST 4: Result Validation Checks ---');
    
    // TEXT_RESULT validation: should fail if draft has no textValue or no userVisibleCompletionNote
    const textOrder = await createTestOrder('TEXT_RESULT', 'PROCESSING', admin2Id);
    
    // No draft at all -> fails
    const textValidateRes1 = await makeRequest('POST', `/api/admin/orders/${textOrder.id}/complete`, admin2Headers, { version: textOrder.version });
    if (textValidateRes1.status === 400 && textValidateRes1.body.message && textValidateRes1.body.message.includes('User visible completion note is required')) {
      addResult('Validation blocks TEXT_RESULT with no note/result', 'PASS');
    } else {
      addResult('Validation blocks TEXT_RESULT with no note/result', 'FAIL', `Status: ${textValidateRes1.status}, Msg: ${textValidateRes1.body.message}`);
    }

    // Draft with note but no text value
    await prisma.orderResult.create({
      data: {
        orderId: textOrder.id,
        resultType: 'TEXT_RESULT',
        resultLabel: 'Text Result',
        textValue: '',
        createdByAdminId: admin2Id,
      }
    });
    await prisma.order.update({
      where: { id: textOrder.id },
      data: { userVisibleCompletionNote: 'Order complete!' }
    });
    
    const textValidateRes2 = await makeRequest('POST', `/api/admin/orders/${textOrder.id}/complete`, admin2Headers, { version: textOrder.version });
    if (textValidateRes2.status === 400 && textValidateRes2.body.message && textValidateRes2.body.message.includes('A text result must be entered')) {
      addResult('Validation blocks TEXT_RESULT with empty textValue', 'PASS');
    } else {
      addResult('Validation blocks TEXT_RESULT with empty textValue', 'FAIL', `Status: ${textValidateRes2.status}, Msg: ${textValidateRes2.body.message}`);
    }

    // FILE_UPLOAD validation: should fail if no file uploaded
    const fileOrder = await createTestOrder('FILE_UPLOAD', 'PROCESSING', admin2Id);
    await prisma.order.update({
      where: { id: fileOrder.id },
      data: { userVisibleCompletionNote: 'Result file attached.' }
    });
    const fileValidateRes1 = await makeRequest('POST', `/api/admin/orders/${fileOrder.id}/complete`, admin2Headers, { version: fileOrder.version });
    if (fileValidateRes1.status === 400 && fileValidateRes1.body.message && fileValidateRes1.body.message.includes('A result file must be uploaded')) {
      addResult('Validation blocks FILE_UPLOAD with no file', 'PASS');
    } else {
      addResult('Validation blocks FILE_UPLOAD with no file', 'FAIL', `Status: ${fileValidateRes1.status}, Msg: ${fileValidateRes1.body.message}`);
    }

    // ==========================================
    // TEST 5: VERSION LOCK / OPTIMISTIC LOCK
    // ==========================================
    console.log('\n--- 🟥 TEST 5: Version Lock Check ---');
    const versionOrder = await createTestOrder('STATUS_ONLY', 'PROCESSING', admin2Id);
    await prisma.order.update({
      where: { id: versionOrder.id },
      data: { userVisibleCompletionNote: 'Status completed note' }
    });

    // Provide incorrect version (e.g. 5 instead of 0)
    const badVersionRes = await makeRequest('POST', `/api/admin/orders/${versionOrder.id}/complete`, admin2Headers, { version: 5 });
    if (badVersionRes.status === 400 && badVersionRes.body.error?.code === 'VERSION_MISMATCH') {
      addResult('Incorrect version rejects completion', 'PASS');
    } else {
      addResult('Incorrect version rejects completion', 'FAIL', `Status: ${badVersionRes.status}`);
    }

    // ==========================================
    // TEST 6: SUCCESSFUL COMPLETION
    // ==========================================
    console.log('\n--- 🟥 TEST 6: Successful Completion ---');
    
    // Complete STATUS_ONLY order
    const statusOrder = await createTestOrder('STATUS_ONLY', 'PROCESSING', admin2Id);
    await prisma.order.update({
      where: { id: statusOrder.id },
      data: { userVisibleCompletionNote: 'Delivered status successfully.' }
    });

    const statusCompleteRes = await makeRequest('POST', `/api/admin/orders/${statusOrder.id}/complete`, admin2Headers, { version: statusOrder.version });
    if (statusCompleteRes.status === 200 && statusCompleteRes.body.data.orderStatus === 'SUCCESS') {
      addResult('STATUS_ONLY order completed successfully', 'PASS');
    } else {
      addResult('STATUS_ONLY order completed successfully', 'FAIL', `Status: ${statusCompleteRes.status}`);
    }

    // Verify DB states
    const updatedOrder = await prisma.order.findUnique({
      where: { id: statusOrder.id },
      include: { result: true }
    });

    if (updatedOrder.orderStatus === 'SUCCESS' && updatedOrder.completedByAdminId === admin2Id && updatedOrder.completedAt) {
      addResult('DB orderStatus, completedBy, completedAt updated', 'PASS');
    } else {
      addResult('DB orderStatus, completedBy, completedAt updated', 'FAIL');
    }

    if (updatedOrder.version === statusOrder.version + 1) {
      addResult('Order version incremented on success', 'PASS');
    } else {
      addResult('Order version incremented on success', 'FAIL', `Version: ${updatedOrder.version}`);
    }

    if (updatedOrder.result) {
      addResult('OrderResult record upserted on completion', 'PASS');
    } else {
      addResult('OrderResult record upserted on completion', 'FAIL');
    }

    // Verify Audit Log
    const auditLogs = await prisma.orderAuditLog.findMany({
      where: { orderId: statusOrder.id, action: 'ORDER_COMPLETED' }
    });
    if (auditLogs.length === 1 && auditLogs[0].oldStatus === 'PROCESSING' && auditLogs[0].newStatus === 'SUCCESS') {
      addResult('ORDER_COMPLETED audit log generated with correct states', 'PASS');
    } else {
      addResult('ORDER_COMPLETED audit log generated with correct states', 'FAIL');
    }

    // ==========================================
    // TEST 7: IDEMPOTENCY GATING
    // ==========================================
    console.log('\n--- 🟥 TEST 7: Idempotency Checks ---');
    const idempKey = 'test-idemp-completion-key-123';
    
    // Create new order
    const idempOrder = await createTestOrder('STATUS_ONLY', 'PROCESSING', admin2Id);
    await prisma.order.update({
      where: { id: idempOrder.id },
      data: { userVisibleCompletionNote: 'Idemp completion note' }
    });

    // Request 1
    const idempRes1 = await makeRequest('POST', `/api/admin/orders/${idempOrder.id}/complete`, admin2Headers, {
      version: idempOrder.version,
      idempotencyKey: idempKey,
    });
    
    // Request 2 (same idempotencyKey, and order is already SUCCESS)
    const idempRes2 = await makeRequest('POST', `/api/admin/orders/${idempOrder.id}/complete`, admin2Headers, {
      version: idempOrder.version,
      idempotencyKey: idempKey,
    });

    if (idempRes2.status === 200 && idempRes2.body.data.orderStatus === 'SUCCESS') {
      addResult('Idempotent subsequent request succeeds', 'PASS');
    } else {
      addResult('Idempotent subsequent request succeeds', 'FAIL', `Status: ${idempRes2.status}`);
    }

    const idempAuditLogs = await prisma.orderAuditLog.findMany({
      where: { orderId: idempOrder.id, action: 'ORDER_COMPLETED' }
    });
    if (idempAuditLogs.length === 1) {
      addResult('Idempotency prevented duplicate audit log creation', 'PASS');
    } else {
      addResult('Idempotency prevented duplicate audit log creation', 'FAIL', `Count: ${idempAuditLogs.length}`);
    }

    // ==========================================
    // TEST 8: IMMUTABILITY RULES FOR SUCCESS
    // ==========================================
    console.log('\n--- 🟥 TEST 8: Immutability Checks ---');
    
    // Save draft after completion -> Expect 400
    const immutableDraftRes = await makeRequest('POST', `/api/admin/orders/${statusOrder.id}/result/draft`, admin2Headers, { textValue: 'Changed after success' });
    if (immutableDraftRes.status === 400 && immutableDraftRes.body.error?.code === 'ORDER_IMMUTABLE') {
      addResult('Draft editing blocked on completed order', 'PASS');
    } else {
      addResult('Draft editing blocked on completed order', 'FAIL', `Status: ${immutableDraftRes.status}`);
    }

    // File upload after completion -> Expect 400
    const immutableUploadRes = await makeRequest('POST', `/api/admin/orders/${statusOrder.id}/result/upload`, admin2Headers);
    if (immutableUploadRes.status === 400 && immutableUploadRes.body.error?.code === 'ORDER_IMMUTABLE') {
      addResult('File uploading blocked on completed order', 'PASS');
    } else {
      addResult('File uploading blocked on completed order', 'FAIL', `Status: ${immutableUploadRes.status}`);
    }

    // ==========================================
    // TEST 9: COMPLETION SUMMARY ENDPOINT
    // ==========================================
    console.log('\n--- 🟥 TEST 9: Completion Summary Retrieval ---');
    
    // Fetch summary for completed STATUS_ONLY order
    const summaryRes = await makeRequest('GET', `/api/admin/orders/${statusOrder.id}/completion-summary`, admin2Headers);
    if (summaryRes.status === 200 && summaryRes.body.data.completed === true && summaryRes.body.data.completedBy === 'Admin Two') {
      addResult('Completion summary returns correct completed status and admin name', 'PASS');
    } else {
      addResult('Completion summary returns correct completed status and admin name', 'FAIL', `Status: ${summaryRes.status}, Body: ${JSON.stringify(summaryRes.body)}`);
    }

    // Clean up temporary admin3
    await prisma.user.delete({ where: { id: admin3User.id } });

  } catch (e) {
    console.error('💥 Fatal error in order completion verification script:', e);
  } finally {
    // ==========================================
    // CLEANUP
    // ==========================================
    console.log('\n🧹 Cleaning up test database entries...');
    for (const orderId of createdOrderIds) {
      await prisma.orderAuditLog.deleteMany({ where: { orderId } });
      await prisma.orderResult.deleteMany({ where: { orderId } });
      await prisma.actionIdempotency.deleteMany({ where: { orderId } });
      await prisma.order.delete({ where: { id: orderId } });
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

runOrderCompletionTests();
