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

async function runTests() {
  console.log('🧪 Starting Phase 5 Assignment, Masking, and Validation Verification Tests...\n');
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

    // Seed admin3 (for reassignment testing)
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
    async function createTestOrder(resultType, label, orderStatus, assignedAdminId) {
      const orderNo = `HM-TEST-${resultType.slice(0, 3)}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
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
          resultLabelSnapshot: label,
          assignedAdminId,
          assignedAt: assignedAdminId ? new Date() : null,
          idempotencyKey: `idemp-test-${orderNo}`,
        }
      });
      createdOrderIds.push(order.id);
      return order;
    }

    // ========================================================
    // TEST 1: REASSIGNMENT VALIDATION & REASON REQUIREMENT
    // ========================================================
    console.log('\n--- TEST 1: Reassignment Reason Validation & Auditing ---');
    const order1 = await createTestOrder('TEXT_RESULT', 'Aadhaar Card Number', 'PROCESSING', adminId);

    // Attempt to reassign without reason string -> Expect 400 Bad Request
    const noReasonRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/reassign`, adminHeaders, {
      assignedAdminId: admin2Id,
      version: order1.version,
    });
    if (noReasonRes.status === 400) {
      addResult('Reassignment without reason fails', 'PASS');
    } else {
      addResult('Reassignment without reason fails', 'FAIL', `Status: ${noReasonRes.status}`);
    }

    // Attempt to reassign with empty reason string -> Expect 400 Bad Request
    const emptyReasonRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/reassign`, adminHeaders, {
      assignedAdminId: admin2Id,
      reason: '   ',
      version: order1.version,
    });
    if (emptyReasonRes.status === 400) {
      addResult('Reassignment with empty reason fails', 'PASS');
    } else {
      addResult('Reassignment with empty reason fails', 'FAIL', `Status: ${emptyReasonRes.status}`);
    }

    // Reassign with valid reason -> Expect 200 OK
    const validReasonRes = await makeRequest('POST', `/api/admin/orders/${order1.id}/reassign`, adminHeaders, {
      assignedAdminId: admin2Id,
      reason: 'Workload balancing: Admin 1 is overloaded.',
      version: order1.version,
    });
    if (validReasonRes.status === 200) {
      addResult('Reassignment with valid reason succeeds', 'PASS');
    } else {
      addResult('Reassignment with valid reason succeeds', 'FAIL', `Status: ${validReasonRes.status}`);
    }

    // Verify DB assignee and audit log has the reason
    const updatedOrder1 = await prisma.order.findUnique({
      where: { id: order1.id },
      include: {
        auditLogs: {
          where: { action: 'ORDER_REASSIGNED' },
        },
      },
    });
    if (updatedOrder1.assignedAdminId === admin2Id) {
      addResult('Assigned admin updated in DB', 'PASS');
    } else {
      addResult('Assigned admin updated in DB', 'FAIL');
    }

    if (updatedOrder1.auditLogs.length === 1 && updatedOrder1.auditLogs[0].remarks.includes('Workload balancing')) {
      addResult('Audit log remarks contains reassignment reason', 'PASS');
      if (updatedOrder1.auditLogs[0].metadata?.reason === 'Workload balancing: Admin 1 is overloaded.') {
        addResult('Audit log metadata contains reassignment reason', 'PASS');
      } else {
        addResult('Audit log metadata contains reassignment reason', 'FAIL');
      }
    } else {
      addResult('Audit log remarks contains reassignment reason', 'FAIL');
    }

    // ========================================================
    // TEST 2: CUSTOMER INTERNAL DATA OMISSION (SANITIZATION)
    // ========================================================
    console.log('\n--- TEST 2: Customer Internal Data Omission (Sanitization) ---');
    
    // Fetch details as customer
    const userDetailRes = await makeRequest('GET', `/api/orders/${order1.id}`, userHeaders);
    if (userDetailRes.status === 200) {
      const orderData = userDetailRes.body.data.order;
      const internalFields = [
        'assignedAdminId',
        'assignedAt',
        'assignedByAdminId',
        'processingStartedAt',
        'processingStartedByAdminId',
        'completedByAdminId',
        'rejectedByAdminId',
        'internalRejectionReason',
        'internalCompletionNote',
      ];
      
      const foundLeak = internalFields.some(field => orderData[field] !== undefined);
      if (!foundLeak) {
        addResult('Order details endpoint strips internal details for users', 'PASS');
      } else {
        const leaked = internalFields.filter(field => orderData[field] !== undefined);
        addResult('Order details endpoint strips internal details for users', 'FAIL', `Leaked: ${leaked.join(', ')}`);
      }
    } else {
      addResult('Fetch user order details', 'FAIL', `Status: ${userDetailRes.status}`);
    }

    // Fetch list as customer
    const userListRes = await makeRequest('GET', `/api/orders`, userHeaders);
    if (userListRes.status === 200) {
      const firstOrder = userListRes.body.data.orders.find(o => o.id === order1.id);
      if (firstOrder) {
        const internalFields = [
          'assignedAdminId',
          'assignedAt',
          'assignedByAdminId',
          'processingStartedAt',
          'processingStartedByAdminId',
          'completedByAdminId',
          'rejectedByAdminId',
          'internalRejectionReason',
          'internalCompletionNote',
        ];
        const foundLeak = internalFields.some(field => firstOrder[field] !== undefined);
        if (!foundLeak) {
          addResult('Order list endpoint strips internal details for users', 'PASS');
        } else {
          addResult('Order list endpoint strips internal details for users', 'FAIL');
        }
      } else {
        addResult('Find test order in list', 'FAIL');
      }
    } else {
      addResult('Fetch user order list', 'FAIL', `Status: ${userListRes.status}`);
    }

    // ========================================================
    // TEST 3: TEXT RESULT FORMAT VALIDATION RULES
    // ========================================================
    console.log('\n--- TEST 3: Text Result Format Validation Rules ---');
    
    // Service label: Aadhaar Card Number
    const aadhaarOrder = await createTestOrder('TEXT_RESULT', 'Aadhaar Card Number', 'PROCESSING', admin2Id);
    
    // Save draft with invalid Aadhaar
    const invalidAadhaarRes = await makeRequest('POST', `/api/admin/orders/${aadhaarOrder.id}/result/draft`, admin2Headers, {
      textValue: '12345',
    });
    if (invalidAadhaarRes.status === 400 && invalidAadhaarRes.body.message.includes('Aadhaar card number')) {
      addResult('Validation blocks invalid Aadhaar number format', 'PASS');
    } else {
      addResult('Validation blocks invalid Aadhaar number format', 'FAIL', `Status: ${invalidAadhaarRes.status}`);
    }

    // Save draft with valid Aadhaar
    const validAadhaarRes = await makeRequest('POST', `/api/admin/orders/${aadhaarOrder.id}/result/draft`, admin2Headers, {
      textValue: '123456789012',
    });
    if (validAadhaarRes.status === 200) {
      addResult('Validation passes valid Aadhaar number format (12 digits)', 'PASS');
    } else {
      addResult('Validation passes valid Aadhaar number format (12 digits)', 'FAIL', `Status: ${validAadhaarRes.status}`);
    }

    // Service label: PAN Card
    const panOrder = await createTestOrder('TEXT_RESULT', 'PAN Card Number', 'PROCESSING', admin2Id);

    // Save draft with invalid PAN
    const invalidPanRes = await makeRequest('POST', `/api/admin/orders/${panOrder.id}/result/draft`, admin2Headers, {
      textValue: 'invalid-pan',
    });
    if (invalidPanRes.status === 400 && invalidPanRes.body.message.includes('PAN')) {
      addResult('Validation blocks invalid PAN format', 'PASS');
    } else {
      addResult('Validation blocks invalid PAN format', 'FAIL', `Status: ${invalidPanRes.status}`);
    }

    // Save draft with valid PAN
    const validPanRes = await makeRequest('POST', `/api/admin/orders/${panOrder.id}/result/draft`, admin2Headers, {
      textValue: 'ABCDE1234F',
    });
    if (validPanRes.status === 200) {
      addResult('Validation passes valid PAN format', 'PASS');
    } else {
      addResult('Validation passes valid PAN format', 'FAIL', `Status: ${validPanRes.status}`);
    }

    // Service label: Contact Mobile
    const mobileOrder = await createTestOrder('TEXT_RESULT', 'Contact Mobile', 'PROCESSING', admin2Id);

    // Save draft with invalid mobile
    const invalidMobileRes = await makeRequest('POST', `/api/admin/orders/${mobileOrder.id}/result/draft`, admin2Headers, {
      textValue: '1234',
    });
    if (invalidMobileRes.status === 400 && invalidMobileRes.body.message.includes('Mobile number')) {
      addResult('Validation blocks invalid Mobile number format', 'PASS');
    } else {
      addResult('Validation blocks invalid Mobile number format', 'FAIL', `Status: ${invalidMobileRes.status}`);
    }

    // Save draft with valid mobile
    const validMobileRes = await makeRequest('POST', `/api/admin/orders/${mobileOrder.id}/result/draft`, admin2Headers, {
      textValue: '9876543210',
    });
    if (validMobileRes.status === 200) {
      addResult('Validation passes valid Mobile number format', 'PASS');
    } else {
      addResult('Validation passes valid Mobile number format', 'FAIL', `Status: ${validMobileRes.status}`);
    }

    // ========================================================
    // TEST 4: SENSITIVE TEXT RESULT MASKING
    // ========================================================
    console.log('\n--- TEST 4: Sensitive Text Result Masking ---');
    
    // Complete the Aadhaar order (to make it SUCCESS)
    await prisma.order.update({
      where: { id: aadhaarOrder.id },
      data: { userVisibleCompletionNote: 'Completed Aadhaar' }
    });
    const completeRes = await makeRequest('POST', `/api/admin/orders/${aadhaarOrder.id}/complete`, admin2Headers, {
      version: 0,
    });
    if (completeRes.status === 200) {
      addResult('Complete Aadhaar Order', 'PASS');
    } else {
      addResult('Complete Aadhaar Order', 'FAIL', `Status: ${completeRes.status}`);
    }

    // Retrieve via admin order detail
    const adminDetailRes = await makeRequest('GET', `/api/admin/orders/${aadhaarOrder.id}`, adminHeaders);
    if (adminDetailRes.status === 200) {
      const textVal = adminDetailRes.body.data.result.textValue;
      if (textVal === '********9012') {
        addResult('Aadhaar result masked in admin order detail endpoint', 'PASS');
      } else {
        addResult('Aadhaar result masked in admin order detail endpoint', 'FAIL', `Value: ${textVal}`);
      }
    } else {
      addResult('Admin order detail', 'FAIL');
    }

    // Retrieve via customer getOrderResult
    const customerResultRes = await makeRequest('GET', `/api/orders/${aadhaarOrder.id}/result`, userHeaders);
    if (customerResultRes.status === 200) {
      const textVal = customerResultRes.body.data.textValue;
      if (textVal === '********9012') {
        addResult('Aadhaar result masked in user getOrderResult endpoint', 'PASS');
      } else {
        addResult('Aadhaar result masked in user getOrderResult endpoint', 'FAIL', `Value: ${textVal}`);
      }
    } else {
      addResult('User getOrderResult', 'FAIL', `Status: ${customerResultRes.status}`);
    }

    // Retrieve via completion-summary
    const summaryRes = await makeRequest('GET', `/api/admin/orders/${aadhaarOrder.id}/completion-summary`, admin2Headers);
    if (summaryRes.status === 200) {
      const textVal = summaryRes.body.data.result.textValue;
      if (textVal === '********9012') {
        addResult('Aadhaar result masked in completion summary endpoint', 'PASS');
      } else {
        addResult('Aadhaar result masked in completion summary endpoint', 'FAIL', `Value: ${textVal}`);
      }
    } else {
      addResult('Completion summary detail', 'FAIL');
    }

    // Complete the PAN order and verify masking
    await prisma.order.update({
      where: { id: panOrder.id },
      data: { userVisibleCompletionNote: 'Completed PAN' }
    });
    const completePanRes = await makeRequest('POST', `/api/admin/orders/${panOrder.id}/complete`, admin2Headers, {
      version: 0,
    });
    if (completePanRes.status === 200) {
      const summaryPanRes = await makeRequest('GET', `/api/admin/orders/${panOrder.id}/completion-summary`, admin2Headers);
      if (summaryPanRes.body.data.result.textValue === '******') {
        addResult('PAN result masked in completion summary (******)', 'PASS');
      } else {
        addResult('PAN result masked in completion summary (******)', 'FAIL', `Value: ${summaryPanRes.body.data.result.textValue}`);
      }
    } else {
      addResult('Complete PAN Order', 'FAIL');
    }

    // Complete the Mobile order and verify masking
    await prisma.order.update({
      where: { id: mobileOrder.id },
      data: { userVisibleCompletionNote: 'Completed Mobile' }
    });
    const completeMobileRes = await makeRequest('POST', `/api/admin/orders/${mobileOrder.id}/complete`, admin2Headers, {
      version: 0,
    });
    if (completeMobileRes.status === 200) {
      const summaryMobileRes = await makeRequest('GET', `/api/admin/orders/${mobileOrder.id}/completion-summary`, admin2Headers);
      if (summaryMobileRes.body.data.result.textValue === '******3210') {
        addResult('Mobile result masked in completion summary (******3210)', 'PASS');
      } else {
        addResult('Mobile result masked in completion summary (******3210)', 'FAIL', `Value: ${summaryMobileRes.body.data.result.textValue}`);
      }
    } else {
      addResult('Complete Mobile Order', 'FAIL');
    }

    // ========================================================
    // TEST 5: FILE UPLOAD SECURITY (METADATA & PATH LOCKING)
    // ========================================================
    console.log('\n--- TEST 5: Secure File Upload Metadata & Path checks ---');
    const fileOrder = await createTestOrder('FILE_UPLOAD', 'Result Document', 'PROCESSING', admin2Id);

    // Max Size restriction (10MB limit, try 11MB)
    const largeFileRes = await makeRequest('POST', `/api/admin/orders/${fileOrder.id}/result/upload`, admin2Headers, {
      storagePath: `/admin/${admin2Id}/temp/order-results/session-uuid-1/file.pdf`,
      fileName: 'file.pdf',
      fileType: 'application/pdf',
      fileSize: 11 * 1024 * 1024,
    });
    if (largeFileRes.status === 400 && largeFileRes.body.message.includes('exceeds')) {
      addResult('Validation blocks files exceeding 10MB', 'PASS');
    } else {
      addResult('Validation blocks files exceeding 10MB', 'FAIL', `Status: ${largeFileRes.status}`);
    }

    // Invalid storage path format / ownership
    const invalidPathRes = await makeRequest('POST', `/api/admin/orders/${fileOrder.id}/result/upload`, admin2Headers, {
      storagePath: `/users/${userId}/temp/sess/file.pdf`, // not under /admin/{adminId}/temp/order-results
      fileName: 'file.pdf',
      fileType: 'application/pdf',
      fileSize: 5 * 1024 * 1024,
    });
    if (invalidPathRes.status === 400 && invalidPathRes.body.message.includes('path structure')) {
      addResult('Validation blocks invalid/unauthorized upload path structures', 'PASS');
    } else {
      addResult('Validation blocks invalid/unauthorized upload path structures', 'FAIL', `Status: ${invalidPathRes.status}`);
    }

    // Magic Bytes signature verification (mock mode extension based checks)
    // Send PDF metadata, extension in path .txt -> signature mismatch
    const badBytesRes = await makeRequest('POST', `/api/admin/orders/${fileOrder.id}/result/upload`, admin2Headers, {
      storagePath: `/admin/${admin2Id}/temp/order-results/sess-1/temp.txt`,
      fileName: 'temp.pdf',
      fileType: 'application/pdf',
      fileSize: 5 * 1024 * 1024,
    });
    if (badBytesRes.status === 400 && badBytesRes.body.message.includes('signature')) {
      addResult('Validation blocks files with mismatched magic numbers', 'PASS');
    } else {
      addResult('Validation blocks files with mismatched magic numbers', 'FAIL', `Status: ${badBytesRes.status}`);
    }

    // Valid file metadata & mock signature -> Should succeed
    const validUploadRes = await makeRequest('POST', `/api/admin/orders/${fileOrder.id}/result/upload`, admin2Headers, {
      storagePath: `/admin/${admin2Id}/temp/order-results/sess-1/temp.pdf`,
      fileName: 'temp.pdf',
      fileType: 'application/pdf',
      fileSize: 5 * 1024 * 1024,
    });
    if (validUploadRes.status === 200) {
      addResult('Validation passes valid secure metadata and signature', 'PASS');
    } else {
      addResult('Validation passes valid secure metadata and signature', 'FAIL', `Status: ${validUploadRes.status}`);
    }

    // ========================================================
    // TEST 6: STATUS_ONLY COMPLETION & COMPLETE API PAYLOAD VALIDATION
    // ========================================================
    console.log('\n--- TEST 6: STATUS_ONLY Completion & Complete API Payload Validation ---');
    const statusOrder = await createTestOrder('STATUS_ONLY', 'Status Result', 'PROCESSING', admin2Id);

    // Call complete order with full payload (version, idempotencyKey, userVisibleCompletionNote, internalCompletionNote)
    const completeStatusRes = await makeRequest('POST', `/api/admin/orders/${statusOrder.id}/complete`, admin2Headers, {
      version: statusOrder.version,
      idempotencyKey: `comp-idemp-status-${statusOrder.id}`,
      userVisibleCompletionNote: 'Your application has been processed successfully.',
      internalCompletionNote: 'STATUS_ONLY completed with notes and payload successfully.',
    });

    if (completeStatusRes.status === 200 && completeStatusRes.body.data.orderStatus === 'SUCCESS') {
      addResult('STATUS_ONLY completed with complete payload and notes successfully', 'PASS');
    } else {
      addResult('STATUS_ONLY completed with complete payload and notes successfully', 'FAIL', `Status: ${completeStatusRes.status}, Body: ${JSON.stringify(completeStatusRes.body)}`);
    }

    // Verify DB states for notes
    const dbStatusOrder = await prisma.order.findUnique({
      where: { id: statusOrder.id },
    });
    if (dbStatusOrder.userVisibleCompletionNote === 'Your application has been processed successfully.' &&
        dbStatusOrder.internalCompletionNote === 'STATUS_ONLY completed with notes and payload successfully.') {
      addResult('Order user and internal completion notes updated in DB', 'PASS');
    } else {
      addResult('Order user and internal completion notes updated in DB', 'FAIL');
    }

  } catch (e) {
    console.error('💥 Fatal error in integration test script:', e);
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
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin2@helpingmitra.com', 'admin3@helpingmitra.com'] }
      }
    }).catch(() => {});

    console.log('\n🏁 VERIFICATION FINISHED.');
    const totalPassed = results.filter(r => r.status === 'PASS').length;
    const totalFailed = results.filter(r => r.status === 'FAIL').length;
    console.log(`Summary: Passed: ${totalPassed}, Failed: ${totalFailed}`);
    
    await prisma.$disconnect();
    process.exit(totalFailed > 0 ? 1 : 0);
  }
}

runTests();
