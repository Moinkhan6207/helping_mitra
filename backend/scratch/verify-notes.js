const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');

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

async function runNotesTests() {
  console.log('🧪 Starting Phase 5 Module 5 Internal Notes Verification Tests...\n');
  const results = [];

  const addResult = (test, status, details) => {
    results.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test} ${details ? `(${details})` : ''}`);
  };

  let adminToken = '';
  let userToken = '';
  let testOrderId = '';
  let testUserId = '';
  let testServiceId = '';

  try {
    // 1. Authenticate users
    const adminLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin@helpingmitra.com',
      password: 'AdminPassword@123',
    });
    if (adminLoginRes.status === 200) {
      adminToken = adminLoginRes.body.data.accessToken;
      addResult('Admin Login', 'PASS');
    } else {
      addResult('Admin Login', 'FAIL', `Status: ${adminLoginRes.status}`);
      return;
    }

    const userLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'testuser@gmail.com',
      password: 'Password@123',
    });
    if (userLoginRes.status === 200) {
      userToken = userLoginRes.body.data.accessToken;
      addResult('User Login', 'PASS');
    } else {
      addResult('User Login', 'FAIL', `Status: ${userLoginRes.status}`);
      return;
    }

    const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };
    const userHeaders = { 'Authorization': `Bearer ${userToken}` };

    // Get active service and test user from DB
    const testUser = await prisma.user.findFirst({ where: { email: 'testuser@gmail.com' } });
    testUserId = testUser.id;

    const testService = await prisma.service.findFirst({ where: { status: 'ACTIVE' } });
    testServiceId = testService.id;

    // Create a seed order
    const orderNo = `HM-NTS-${Date.now().toString().slice(-6)}`;
    const order = await prisma.order.create({
      data: {
        orderNumber: orderNo,
        userId: testUserId,
        serviceId: testServiceId,
        serviceNameSnapshot: testService.name,
        categoryNameSnapshot: 'Test Category',
        orderAmount: testService.mrp,
        orderAmountPaise: Math.round(Number(testService.mrp) * 100),
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        orderStatus: 'PENDING',
        idempotencyKey: `idemp-note-${Date.now()}`,
      }
    });
    testOrderId = order.id;
    addResult('Seed Order Creation', 'PASS', `Order ID: ${testOrderId}`);

    // ==========================================
    // TEST 1: AUTHORIZATION / SECURITY CHECK
    // ==========================================
    console.log('\n--- 🟥 TEST 1: Security Authorization checks (Admin-Only notes) ---');
    
    // Customer/Retailer POST Notes -> Expect 403
    const userPostNotesRes = await makeRequest('POST', `/api/admin/orders/${testOrderId}/notes`, userHeaders, {
      note: 'Retailer note content'
    });
    if (userPostNotesRes.status === 403) {
      addResult('Customer blocks on POST note endpoint', 'PASS');
    } else {
      addResult('Customer blocks on POST note endpoint', 'FAIL', `Status: ${userPostNotesRes.status}`);
    }

    // Customer/Retailer GET Notes -> Expect 403
    const userGetNotesRes = await makeRequest('GET', `/api/admin/orders/${testOrderId}/notes`, userHeaders);
    if (userGetNotesRes.status === 403) {
      addResult('Customer blocks on GET notes endpoint', 'PASS');
    } else {
      addResult('Customer blocks on GET notes endpoint', 'FAIL', `Status: ${userGetNotesRes.status}`);
    }

    // ==========================================
    // TEST 2: INPUT VALIDATION
    // ==========================================
    console.log('\n--- 🟥 TEST 2: Input Validation ---');

    // Empty note content -> Expect 400
    const emptyNoteRes = await makeRequest('POST', `/api/admin/orders/${testOrderId}/notes`, adminHeaders, {
      note: ''
    });
    if (emptyNoteRes.status === 400) {
      addResult('Create empty note rejected', 'PASS');
    } else {
      addResult('Create empty note rejected', 'FAIL', `Status: ${emptyNoteRes.status}`);
    }

    // Whitespace only note -> Expect 400
    const spaceNoteRes = await makeRequest('POST', `/api/admin/orders/${testOrderId}/notes`, adminHeaders, {
      note: '       '
    });
    if (spaceNoteRes.status === 400) {
      addResult('Create whitespace-only note rejected', 'PASS');
    } else {
      addResult('Create whitespace-only note rejected', 'FAIL', `Status: ${spaceNoteRes.status}`);
    }

    // Max length check (try >5000 characters) -> Expect 400
    const longNoteRes = await makeRequest('POST', `/api/admin/orders/${testOrderId}/notes`, adminHeaders, {
      note: 'a'.repeat(5001)
    });
    if (longNoteRes.status === 400) {
      addResult('Create note exceeding 5000 characters rejected', 'PASS');
    } else {
      addResult('Create note exceeding 5000 characters rejected', 'FAIL', `Status: ${longNoteRes.status}`);
    }

    // ==========================================
    // TEST 3: NOTE CREATION & PERMANENCE
    // ==========================================
    console.log('\n--- 🟥 TEST 3: Note Creation & Enforced Append-Only ---');

    // Create Note 1 (Verification type)
    const note1Res = await makeRequest('POST', `/api/admin/orders/${testOrderId}/notes`, adminHeaders, {
      note: 'User uploaded blurry documents.',
      noteType: 'DOCUMENT'
    });
    if (note1Res.status === 201) {
      addResult('Add Document Note 1', 'PASS');
    } else {
      addResult('Add Document Note 1', 'FAIL', `Status: ${note1Res.status}`);
    }

    // Create Note 2 (Escalation type)
    const note2Res = await makeRequest('POST', `/api/admin/orders/${testOrderId}/notes`, adminHeaders, {
      note: 'Escalating this check as KYC fails.',
      noteType: 'ESCALATION'
    });
    if (note2Res.status === 201) {
      addResult('Add Escalation Note 2', 'PASS');
    } else {
      addResult('Add Escalation Note 2', 'FAIL', `Status: ${note2Res.status}`);
    }

    // Create Note 3 (General type)
    const note3Res = await makeRequest('POST', `/api/admin/orders/${testOrderId}/notes`, adminHeaders, {
      note: 'General follow up call completed with client.',
      noteType: 'GENERAL'
    });
    if (note3Res.status === 201) {
      addResult('Add General Note 3', 'PASS');
    } else {
      addResult('Add General Note 3', 'FAIL', `Status: ${note3Res.status}`);
    }

    // Verify Audit Trail in DB
    const noteAuditLogs = await prisma.orderAuditLog.findMany({
      where: { orderId: testOrderId, action: 'NOTE_ADDED' }
    });
    if (noteAuditLogs.length === 3) {
      addResult('Audit logs count generated is exactly 3', 'PASS');
    } else {
      addResult('Audit logs count generated is exactly 3', 'FAIL', `Count: ${noteAuditLogs.length}`);
    }

    // ==========================================
    // TEST 4: SEARCH & FILTERS
    // ==========================================
    console.log('\n--- 🟥 TEST 4: Search & Filtering ---');

    // Get all notes (Expected count: 3)
    const listAllRes = await makeRequest('GET', `/api/admin/orders/${testOrderId}/notes`, adminHeaders);
    if (listAllRes.status === 200 && listAllRes.body.data.notes.length === 3) {
      addResult('List all internal notes resolves 3 items', 'PASS');
    } else {
      addResult('List all internal notes resolves 3 items', 'FAIL', `Status: ${listAllRes.status}, count: ${listAllRes.body?.data?.notes?.length}`);
    }

    // Case-insensitive search filter
    const searchRes = await makeRequest('GET', `/api/admin/orders/${testOrderId}/notes?search=BLURRY`, adminHeaders);
    if (searchRes.status === 200 && searchRes.body.data.notes.length === 1 && searchRes.body.data.notes[0].noteType === 'DOCUMENT') {
      addResult('Case-insensitive search returns matching note', 'PASS', `Result: ${searchRes.body.data.notes[0].note}`);
    } else {
      addResult('Case-insensitive search returns matching note', 'FAIL', `Status: ${searchRes.status}, count: ${searchRes.body?.data?.notes?.length}`);
    }

    // Filter by type
    const typeFilterRes = await makeRequest('GET', `/api/admin/orders/${testOrderId}/notes?noteType=ESCALATION`, adminHeaders);
    if (typeFilterRes.status === 200 && typeFilterRes.body.data.notes.length === 1 && typeFilterRes.body.data.notes[0].noteType === 'ESCALATION') {
      addResult('Filter by noteType ESCALATION returns 1 matching note', 'PASS');
    } else {
      addResult('Filter by noteType ESCALATION returns 1 matching note', 'FAIL', `Count: ${typeFilterRes.body?.data?.notes?.length}`);
    }

    // Pagination verification (limit 2)
    const pageRes = await makeRequest('GET', `/api/admin/orders/${testOrderId}/notes?limit=2&page=1`, adminHeaders);
    if (pageRes.status === 200 && pageRes.body.data.notes.length === 2 && pageRes.body.data.pagination.totalPages === 2) {
      addResult('Pagination with limit=2 resolves correctly', 'PASS', `totalPages=${pageRes.body.data.pagination.totalPages}`);
    } else {
      addResult('Pagination with limit=2 resolves correctly', 'FAIL', `totalPages=${pageRes.body?.data?.pagination?.totalPages}, count=${pageRes.body?.data?.notes?.length}`);
    }

    // ==========================================
    // TEST 5: USER DATA ISOLATION
    // ==========================================
    console.log('\n--- 🟥 TEST 5: User Data Isolation ---');

    // Call GET Customer Order details endpoint -> ensure notes never returned
    const customerOrderDetailsRes = await makeRequest('GET', `/api/orders/${testOrderId}`, userHeaders);
    if (customerOrderDetailsRes.status === 200) {
      const respOrder = customerOrderDetailsRes.body.data.order;
      if (respOrder.internalNotes === undefined && respOrder.notes === undefined) {
        addResult('Customer order details API isolates/excludes internal notes', 'PASS');
      } else {
        addResult('Customer order details API isolates/excludes internal notes', 'FAIL', 'Found notes keys in order object');
      }
    } else {
      addResult('Customer order details API isolates/excludes internal notes', 'FAIL', `Status: ${customerOrderDetailsRes.status}`);
    }

    // ==========================================
    // CLEANUP
    // ==========================================
    console.log('\n🧹 Cleaning up test database entries...');
    await prisma.orderAuditLog.deleteMany({ where: { orderId: testOrderId } });
    await prisma.orderInternalNote.deleteMany({ where: { orderId: testOrderId } });
    await prisma.order.delete({ where: { id: testOrderId } });

    console.log('\n🏁 VERIFICATION FINISHED.');
    const totalPassed = results.filter(r => r.status === 'PASS').length;
    const totalFailed = results.filter(r => r.status === 'FAIL').length;
    console.log(`Summary: Passed: ${totalPassed}, Failed: ${totalFailed}`);

  } catch (e) {
    console.error('💥 Fatal error in notes verification script:', e);
  } finally {
    await prisma.$disconnect();
  }
}

runNotesTests();
