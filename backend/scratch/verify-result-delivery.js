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

async function runResultDeliveryTests() {
  console.log('🧪 Starting Phase 5 Module 6 Result Delivery Foundation Verification Tests...\n');
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
    // Seed admin2
    const passwordHash = bcrypt.hashSync('AdminPassword@123', 10);
    const admin2User = await prisma.user.upsert({
      where: { email: 'admin2@helpingmitra.com' },
      update: {},
      create: {
        name: 'Admin Two',
        email: 'admin2@helpingmitra.com',
        mobile: '9999999992',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
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
      admin2Id = admin2LoginRes.body.data.user.id;
      addResult('Regular Admin Login', 'PASS');
    } else {
      addResult('Regular Admin Login', 'FAIL', `Status: ${admin2LoginRes.status}`);
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
    const userHeaders = { 'Authorization': `Bearer ${userToken}` };

    // Get active service
    const testService = await prisma.service.findFirst({ where: { status: 'ACTIVE' } });
    testServiceId = testService.id;

    // Helper to create order in specific status and assign to someone
    async function createTestOrder(resultType, orderStatus, assignedAdminId) {
      const orderNo = `HM-RES-${resultType.slice(0, 3)}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
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
          idempotencyKey: `idemp-res-${orderNo}`,
        }
      });
      createdOrderIds.push(order.id);
      return order;
    }

    // ==========================================
    // TEST 1: AUTHORIZATION / SECURITY CHECK
    // ==========================================
    console.log('\n--- 🟥 TEST 1: Security Authorization checks (Admin-Only result management) ---');
    const order1 = await createTestOrder('TEXT_RESULT', 'PROCESSING', admin2Id);

    // Customer POST result draft -> Expect 403
    const userDraftRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/result/draft`, userHeaders, { textValue: 'User test' });
    if (userDraftRes.status === 403) {
      addResult('Customer blocks on draft save endpoint', 'PASS');
    } else {
      addResult('Customer blocks on draft save endpoint', 'FAIL', `Status: ${userDraftRes.status}`);
    }

    // Customer GET result -> Expect 403
    const userGetRes = await makeRequest('GET', `/api/admin/orders/${order1.id}/result`, userHeaders);
    if (userGetRes.status === 403) {
      addResult('Customer blocks on GET result endpoint', 'PASS');
    } else {
      addResult('Customer blocks on GET result endpoint', 'FAIL', `Status: ${userGetRes.status}`);
    }

    // Customer POST validate -> Expect 403
    const userValidateRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/result/validate`, userHeaders);
    if (userValidateRes.status === 403) {
      addResult('Customer blocks on validation endpoint', 'PASS');
    } else {
      addResult('Customer blocks on validation endpoint', 'FAIL', `Status: ${userValidateRes.status}`);
    }

    // ==========================================
    // TEST 2: STATUS GUARD CHECKS
    // ==========================================
    console.log('\n--- 🟥 TEST 2: Status Guard Checks (Only PROCESSING allowed) ---');
    const pendingOrder = await createTestOrder('TEXT_RESULT', 'PENDING', null);

    const pendingDraftRes = await makeRequest('POST', `/api/admin/orders/${pendingOrder.id}/result/draft`, adminHeaders, { textValue: 'Pending test' });
    if (pendingDraftRes.status === 400 && pendingDraftRes.body.error?.code === 'INVALID_STATUS') {
      addResult('Save draft rejected for PENDING order', 'PASS');
    } else {
      addResult('Save draft rejected for PENDING order', 'FAIL', `Status: ${pendingDraftRes.status}`);
    }

    const pendingValidateRes = await makeRequest('POST', `/api/admin/orders/${pendingOrder.id}/result/validate`, adminHeaders);
    if (pendingValidateRes.status === 400 && pendingValidateRes.body.error?.code === 'INVALID_STATUS') {
      addResult('Validate draft rejected for PENDING order', 'PASS');
    } else {
      addResult('Validate draft rejected for PENDING order', 'FAIL', `Status: ${pendingValidateRes.status}`);
    }

    // ==========================================
    // TEST 3: PROCESSING OWNERSHIP RULES
    // ==========================================
    console.log('\n--- 🟥 TEST 3: Processing Ownership Enforcements ---');
    // order1 is assigned to admin2Id. Attempt by admin2Token (Assigned Admin) should succeed.
    // Attempt by adminToken (Super Admin) should succeed.
    // Attempt by another admin (create new admin3, or check we have a regular token)
    // Wait, let's see. Let's seed a third admin user or try to use userToken? No, userToken is 403 Forbidden.
    // Let's create an admin3 user in the DB to test non-assigned admin block.
    const admin3User = await prisma.user.upsert({
      where: { email: 'admin3@helpingmitra.com' },
      update: {},
      create: {
        name: 'Admin Three',
        email: 'admin3@helpingmitra.com',
        mobile: '9999999993',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    const admin3LoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin3@helpingmitra.com',
      password: 'AdminPassword@123',
    });
    const admin3Token = admin3LoginRes.body.data.accessToken;
    const admin3Headers = { 'Authorization': `Bearer ${admin3Token}` };

    // admin3 tries to save draft for order1 (assigned to admin2) -> Expect 403 Forbidden (OWNERSHIP_MISMATCH)
    const admin3DraftRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/result/draft`, admin3Headers, { textValue: 'Unauthorized save' });
    if (admin3DraftRes.status === 403 && admin3DraftRes.body.error?.code === 'OWNERSHIP_MISMATCH') {
      addResult('Non-assigned Admin receives 403 on draft save', 'PASS');
    } else {
      addResult('Non-assigned Admin receives 403 on draft save', 'FAIL', `Status: ${admin3DraftRes.status}`);
    }

    // Super Admin tries to save draft for order1 (assigned to admin2) -> Expect 200 Success
    const superAdminDraftRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/result/draft`, adminHeaders, { textValue: 'Super admin save' });
    if (superAdminDraftRes.status === 200) {
      addResult('Super Admin bypasses ownership checks', 'PASS');
    } else {
      addResult('Super Admin bypasses ownership checks', 'FAIL', `Status: ${superAdminDraftRes.status}`);
    }

    // ==========================================
    // TEST 4: DRAFT SAVING & PERMANENCE
    // ==========================================
    console.log('\n--- 🟥 TEST 4: Draft Saving & Audit Logging ---');
    const orderText = await createTestOrder('TEXT_RESULT', 'PROCESSING', admin2Id);

    // Save initial draft
    const saveDraftRes = await makeRequest('POST', `/api/admin/orders/${orderText.id}/result/draft`, admin2Headers, {
      textValue: 'First text draft content',
      userVisibleCompletionNote: 'Work in progress',
      internalCompletionNote: 'Audit notes details'
    });
    if (saveDraftRes.status === 200) {
      addResult('Save text result draft', 'PASS');
    } else {
      addResult('Save text result draft', 'FAIL', `Status: ${saveDraftRes.status}`);
    }

    // Modify/Update draft
    const updateDraftRes = await makeRequest('POST', `/api/admin/orders/${orderText.id}/result/draft`, admin2Headers, {
      textValue: 'Updated text draft content',
      userVisibleCompletionNote: 'Draft completed and updated',
    });
    if (updateDraftRes.status === 200) {
      addResult('Update text result draft', 'PASS');
    } else {
      addResult('Update text result draft', 'FAIL', `Status: ${updateDraftRes.status}`);
    }

    // Get current draft -> verify values and snapshots
    const getDraftRes = await makeRequest('GET', `/api/admin/orders/${orderText.id}/result`, admin2Headers);
    if (getDraftRes.status === 200) {
      const body = getDraftRes.body.data;
      if (body.resultTypeSnapshot === 'TEXT_RESULT' && body.draft.textValue === 'Updated text draft content' && body.draft.internalCompletionNote === 'Audit notes details') {
        addResult('Get draft retrieves updated values & snapshots', 'PASS');
      } else {
        addResult('Get draft retrieves updated values & snapshots', 'FAIL', `Data mismatch: ${JSON.stringify(body)}`);
      }
    } else {
      addResult('Get draft retrieves updated values & snapshots', 'FAIL', `Status: ${getDraftRes.status}`);
    }

    // Check database Audit Logs for draft
    const draftAuditLogs = await prisma.orderAuditLog.findMany({
      where: { orderId: orderText.id }
    });
    const hasCreated = draftAuditLogs.some(log => log.action === 'RESULT_DRAFT_CREATED');
    const hasUpdated = draftAuditLogs.some(log => log.action === 'RESULT_DRAFT_UPDATED');
    if (hasCreated && hasUpdated) {
      addResult('Draft audit logs (CREATED/UPDATED) generated successfully', 'PASS');
    } else {
      addResult('Draft audit logs (CREATED/UPDATED) generated successfully', 'FAIL', `Audit actions: ${draftAuditLogs.map(l => l.action).join(', ')}`);
    }

    // ==========================================
    // TEST 5: VALIDATION ENGINE
    // ==========================================
    console.log('\n--- 🟥 TEST 5: Validation Engine Rules ---');

    // Case 5a: TEXT_RESULT incomplete validation (missing visible completion note)
    const badTextOrder = await createTestOrder('TEXT_RESULT', 'PROCESSING', admin2Id);
    await makeRequest('POST', `/api/admin/orders/${badTextOrder.id}/result/draft`, admin2Headers, {
      textValue: 'Text result present',
      userVisibleCompletionNote: '' // Empty note
    });
    const validateTextBadRes = await makeRequest('POST', `/api/admin/orders/${badTextOrder.id}/result/validate`, admin2Headers);
    if (validateTextBadRes.status === 400 && validateTextBadRes.body.error?.code === 'VALIDATION_FAILED') {
      addResult('Validation blocks empty user visible note', 'PASS');
    } else {
      addResult('Validation blocks empty user visible note', 'FAIL', `Status: ${validateTextBadRes.status}`);
    }

    // Case 5b: TEXT_RESULT complete validation
    await makeRequest('POST', `/api/admin/orders/${badTextOrder.id}/result/draft`, admin2Headers, {
      textValue: 'Text result present',
      userVisibleCompletionNote: 'Here is your completion note'
    });
    const validateTextGoodRes = await makeRequest('POST', `/api/admin/orders/${badTextOrder.id}/result/validate`, admin2Headers);
    if (validateTextGoodRes.status === 200 && validateTextGoodRes.body.data.success === true) {
      addResult('Validation passes complete TEXT_RESULT draft', 'PASS');
    } else {
      addResult('Validation passes complete TEXT_RESULT draft', 'FAIL', `Status: ${validateTextGoodRes.status}`);
    }

    // Case 5c: FILE_UPLOAD incomplete validation (missing file)
    const fileOrder = await createTestOrder('FILE_UPLOAD', 'PROCESSING', admin2Id);
    await makeRequest('POST', `/api/admin/orders/${fileOrder.id}/result/draft`, admin2Headers, {
      userVisibleCompletionNote: 'File is not uploaded in draft'
    });
    const validateFileBadRes = await makeRequest('POST', `/api/admin/orders/${fileOrder.id}/result/validate`, admin2Headers);
    if (validateFileBadRes.status === 400 && validateFileBadRes.body.error?.code === 'VALIDATION_FAILED') {
      addResult('Validation blocks missing file upload', 'PASS');
    } else {
      addResult('Validation blocks missing file upload', 'FAIL', `Status: ${validateFileBadRes.status}`);
    }

    // Case 5d: FILE_UPLOAD complete validation
    await makeRequest('POST', `/api/admin/orders/${fileOrder.id}/result/draft`, admin2Headers, {
      fileName: 'driving_license.pdf',
      fileType: 'application/pdf',
      fileSize: 504020,
      storagePath: 'tmp/driving_license.pdf',
      userVisibleCompletionNote: 'Result file uploaded'
    });
    const validateFileGoodRes = await makeRequest('POST', `/api/admin/orders/${fileOrder.id}/result/validate`, admin2Headers);
    if (validateFileGoodRes.status === 200 && validateFileGoodRes.body.data.success === true) {
      addResult('Validation passes complete FILE_UPLOAD draft', 'PASS');
    } else {
      addResult('Validation passes complete FILE_UPLOAD draft', 'FAIL', `Status: ${validateFileGoodRes.status}`);
    }

    // Case 5e: STATUS_ONLY complete validation
    const statusOrder = await createTestOrder('STATUS_ONLY', 'PROCESSING', admin2Id);
    await makeRequest('POST', `/api/admin/orders/${statusOrder.id}/result/draft`, admin2Headers, {
      userVisibleCompletionNote: 'Order verified successfully'
    });
    const validateStatusGoodRes = await makeRequest('POST', `/api/admin/orders/${statusOrder.id}/result/validate`, admin2Headers);
    if (validateStatusGoodRes.status === 200 && validateStatusGoodRes.body.data.success === true) {
      addResult('Validation passes STATUS_ONLY draft', 'PASS');
    } else {
      addResult('Validation passes STATUS_ONLY draft', 'FAIL', `Status: ${validateStatusGoodRes.status}`);
    }

    // Verify RESULT_VALIDATED audit log
    const validatedAuditLogs = await prisma.orderAuditLog.findMany({
      where: { orderId: statusOrder.id, action: 'RESULT_VALIDATED' }
    });
    if (validatedAuditLogs.length === 1) {
      addResult('RESULT_VALIDATED audit log generated', 'PASS');
    } else {
      addResult('RESULT_VALIDATED audit log generated', 'FAIL', `Count: ${validatedAuditLogs.length}`);
    }

    // Remove temporary admin3
    await prisma.user.delete({ where: { id: admin3User.id } });

  } catch (e) {
    console.error('💥 Fatal error in result delivery verification script:', e);
  } finally {
    // ==========================================
    // CLEANUP
    // ==========================================
    console.log('\n🧹 Cleaning up test database entries...');
    for (const orderId of createdOrderIds) {
      await prisma.orderAuditLog.deleteMany({ where: { orderId } });
      await prisma.orderResult.deleteMany({ where: { orderId } });
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

runResultDeliveryTests();
