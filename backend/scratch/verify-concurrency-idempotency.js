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
  console.log('🧪 Starting Concurrency, Idempotency, and Ownership Verification Tests...\n');
  const results = [];

  const addResult = (test, status, details) => {
    results.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test} ${details ? `(${details})` : ''}`);
  };

  let tokenSuperAdmin = '';
  let tokenAdmin2 = '';
  let tokenAdmin3 = '';
  let testUserId = '';
  let testServiceId = '';

  try {
    // 1. Setup/Upsert Test Users
    console.log('--- Setting up DB seed users ---');
    const passwordHash = bcrypt.hashSync('AdminPassword@123', 10);

    const superAdminUser = await prisma.user.upsert({
      where: { email: 'admin@helpingmitra.com' },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: {
        name: 'Super Admin',
        email: 'admin@helpingmitra.com',
        mobile: '9876543201',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    const admin2User = await prisma.user.upsert({
      where: { email: 'admin2@helpingmitra.com' },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: {
        name: 'Admin Two',
        email: 'admin2@helpingmitra.com',
        mobile: '9876543202',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    const admin3User = await prisma.user.upsert({
      where: { email: 'admin3@helpingmitra.com' },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: {
        name: 'Admin Three',
        email: 'admin3@helpingmitra.com',
        mobile: '9876543203',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    const regularUser = await prisma.user.upsert({
      where: { email: 'testuser@gmail.com' },
      update: { role: 'USER', status: 'ACTIVE' },
      create: {
        name: 'Regular Test User',
        email: 'testuser@gmail.com',
        mobile: '9876543204',
        passwordHash: bcrypt.hashSync('Password@123', 10),
        role: 'USER',
        status: 'ACTIVE',
        userType: 'RETAILER'
      }
    });

    testUserId = regularUser.id;

    const activeService = await prisma.service.findFirst({ where: { status: 'ACTIVE' } });
    if (!activeService) {
      console.error('❌ No active services in DB. Cannot run order creation tests.');
      return;
    }
    testServiceId = activeService.id;

    // 2. Perform Logins to acquire JWT tokens
    console.log('\n--- Authenticating Users ---');
    const loginSuper = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin@helpingmitra.com',
      password: 'AdminPassword@123'
    });
    if (loginSuper.status === 200) {
      tokenSuperAdmin = loginSuper.body.data.accessToken;
      addResult('Login Super Admin', 'PASS');
    } else {
      addResult('Login Super Admin', 'FAIL', `Status: ${loginSuper.status}`);
      return;
    }

    const loginAdmin2 = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin2@helpingmitra.com',
      password: 'AdminPassword@123'
    });
    if (loginAdmin2.status === 200) {
      tokenAdmin2 = loginAdmin2.body.data.accessToken;
      addResult('Login Admin 2', 'PASS');
    } else {
      addResult('Login Admin 2', 'FAIL', `Status: ${loginAdmin2.status}`);
      return;
    }

    const loginAdmin3 = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin3@helpingmitra.com',
      password: 'AdminPassword@123'
    });
    if (loginAdmin3.status === 200) {
      tokenAdmin3 = loginAdmin3.body.data.accessToken;
      addResult('Login Admin 3', 'PASS');
    } else {
      addResult('Login Admin 3', 'FAIL', `Status: ${loginAdmin3.status}`);
      return;
    }

    const superHeaders = { 'Authorization': `Bearer ${tokenSuperAdmin}` };
    const admin2Headers = { 'Authorization': `Bearer ${tokenAdmin2}` };
    const admin3Headers = { 'Authorization': `Bearer ${tokenAdmin3}` };

    // Helper: Create a fresh order in DB
    const createTestOrder = async () => {
      const orderNo = `HM-TST-${Date.now().toString().slice(-6)}`;
      return prisma.order.create({
        data: {
          orderNumber: orderNo,
          userId: testUserId,
          serviceId: testServiceId,
          serviceNameSnapshot: activeService.name,
          categoryNameSnapshot: 'Test Category',
          orderAmount: activeService.mrp,
          orderAmountPaise: Math.round(Number(activeService.mrp) * 100),
          consentAccepted: true,
          consentAcceptedAt: new Date(),
          orderStatus: 'PENDING',
          version: 0,
          idempotencyKey: 'db-init-' + orderNo + '-' + Math.random().toString().slice(-4),
        }
      });
    };

    // ==========================================
    // TEST 1: CONCURRENCY CONTROL (VERSION MISMATCH)
    // ==========================================
    console.log('\n--- 🟥 TEST 1: Concurrency Control (Optimistic version locking) ---');
    const order1 = await createTestOrder();

    // Fire 2 claims sequentially/concurrently but BOTH using version 0.
    // The first one should succeed, incrementing version to 1.
    // The second one should fail because the expected version is 0, but the database is now 1.
    const resClaim1 = await makeRequest('POST', `/api/admin/orders/${order1.id}/claim`, admin2Headers, {
      version: 0
    });
    const resClaim2 = await makeRequest('POST', `/api/admin/orders/${order1.id}/claim`, superHeaders, {
      version: 0
    });

    if (resClaim1.status === 200) {
      addResult('First claim request with v=0', 'PASS', 'Succeeded');
    } else {
      addResult('First claim request with v=0', 'FAIL', `Status: ${resClaim1.status}`);
    }

    if (resClaim2.status === 400 && resClaim2.body.error?.code === 'VERSION_MISMATCH') {
      addResult('Second claim request with outdated v=0 conflict', 'PASS', 'Correctly rejected with 400/VERSION_MISMATCH');
    } else {
      addResult('Second claim request with outdated v=0 conflict', 'FAIL', `Status: ${resClaim2.status}, code: ${resClaim2.body?.error?.code}`);
    }

    // Verify DB state is correct
    const dbOrder1 = await prisma.order.findUnique({ where: { id: order1.id } });
    if (dbOrder1.version === 1 && dbOrder1.assignedAdminId === admin2User.id) {
      addResult('Database version increments and ownership sets', 'PASS', `v=${dbOrder1.version}, owner=${dbOrder1.assignedAdminId}`);
    } else {
      addResult('Database version increments and ownership sets', 'FAIL', `v=${dbOrder1.version}, owner=${dbOrder1.assignedAdminId}`);
    }


    // ==========================================
    // TEST 2: IDEMPOTENCY CHECK
    // ==========================================
    console.log('\n--- 🟥 TEST 2: Idempotency Key checks ---');
    const order2 = await createTestOrder();
    const idempotencyKey = `idemp-${Date.now()}`;

    // Send identical request with identical idempotencyKey twice
    const idempRes1 = await makeRequest('POST', `/api/admin/orders/${order2.id}/claim`, admin2Headers, {
      version: 0,
      idempotencyKey
    });
    const idempRes2 = await makeRequest('POST', `/api/admin/orders/${order2.id}/claim`, admin2Headers, {
      version: 0,
      idempotencyKey
    });

    if (idempRes1.status === 200 && idempRes2.status === 200) {
      addResult('Idempotent double claims', 'PASS', 'Both claims returned 200');
    } else {
      addResult('Idempotent double claims', 'FAIL', `Status 1: ${idempRes1.status}, Status 2: ${idempRes2.status}`);
    }

    // Check version and logs count
    const dbOrder2 = await prisma.order.findUnique({ where: { id: order2.id } });
    const auditLogsCount2 = await prisma.orderAuditLog.count({
      where: { orderId: order2.id, action: 'ORDER_CLAIMED' }
    });

    if (dbOrder2.version === 1) {
      addResult('Order version only incremented once', 'PASS', `v=${dbOrder2.version}`);
    } else {
      addResult('Order version only incremented once', 'FAIL', `v=${dbOrder2.version}`);
    }

    if (auditLogsCount2 === 1) {
      addResult('Only one audit log generated', 'PASS', `count=${auditLogsCount2}`);
    } else {
      addResult('Only one audit log generated', 'FAIL', `count=${auditLogsCount2}`);
    }


    // ==========================================
    // TEST 3: PROCESSING OWNERSHIP CONSTRAINT & SUPER ADMIN BYPASS
    // ==========================================
    console.log('\n--- 🟥 TEST 3: Processing Ownership Constraint & Super Admin Bypass ---');
    const order3 = await createTestOrder();

    // 1. Admin 2 claims the order -> version 1
    const claimRes = await makeRequest('POST', `/api/admin/orders/${order3.id}/claim`, admin2Headers, {
      version: 0
    });
    if (claimRes.status !== 200) {
      addResult('Claim order for processing ownership setup', 'FAIL', `Status: ${claimRes.status}`);
      return;
    }

    // 2. Admin 3 (unassigned admin) tries to start processing -> Expect FAIL (OWNERSHIP_MISMATCH)
    const startAdmin3Res = await makeRequest('POST', `/api/admin/orders/${order3.id}/start-processing`, admin3Headers, {
      version: 1
    });
    if (startAdmin3Res.status === 400 && startAdmin3Res.body.error?.code === 'OWNERSHIP_MISMATCH') {
      addResult('Non-assigned admin starts processing', 'PASS', 'Correctly blocked with 400/OWNERSHIP_MISMATCH');
    } else {
      addResult('Non-assigned admin starts processing', 'FAIL', `Status: ${startAdmin3Res.status}, code: ${startAdmin3Res.body?.error?.code}`);
    }

    // 3. Super Admin tries to start processing -> Expect SUCCESS (Bypass rule)
    const startSuperRes = await makeRequest('POST', `/api/admin/orders/${order3.id}/start-processing`, superHeaders, {
      version: 1
    });
    if (startSuperRes.status === 200) {
      addResult('Super Admin starts processing (Bypasses ownership)', 'PASS', 'Succeeded');
    } else {
      addResult('Super Admin starts processing (Bypasses ownership)', 'FAIL', `Status: ${startSuperRes.status}, body: ${JSON.stringify(startSuperRes.body)}`);
    }

    // Verify DB status is now PROCESSING and version is 2
    const dbOrder3 = await prisma.order.findUnique({ where: { id: order3.id } });
    if (dbOrder3.orderStatus === 'PROCESSING' && dbOrder3.version === 2) {
      addResult('Database state transitions to PROCESSING', 'PASS', `v=${dbOrder3.version}, status=${dbOrder3.orderStatus}`);
    } else {
      addResult('Database state transitions to PROCESSING', 'FAIL', `v=${dbOrder3.version}, status=${dbOrder3.orderStatus}`);
    }


    // ==========================================
    // TEST 4: AUDITING & HISTORICAL EVENT TIMELINE
    // ==========================================
    console.log('\n--- 🟥 TEST 4: Verification of Audit Timelines ---');
    const auditLogs = await prisma.orderAuditLog.findMany({
      where: { orderId: order3.id },
      orderBy: { createdAt: 'asc' }
    });

    const hasClaimed = auditLogs.some(log => log.action === 'ORDER_CLAIMED' && log.performedByAdminId === admin2User.id);
    const hasProcessing = auditLogs.some(log => log.action === 'PROCESSING_STARTED' && log.performedByAdminId === superAdminUser.id);

    if (hasClaimed) {
      addResult('Timeline contains ORDER_CLAIMED audit log', 'PASS');
    } else {
      addResult('Timeline contains ORDER_CLAIMED audit log', 'FAIL');
    }

    if (hasProcessing) {
      addResult('Timeline contains PROCESSING_STARTED audit log', 'PASS');
    } else {
      addResult('Timeline contains PROCESSING_STARTED audit log', 'FAIL');
    }

    console.log('\n🧹 Cleaning up test database entries...');
    // Clean up created orders and idempotency logs
    const testOrderIds = [order1.id, order2.id, order3.id];
    await prisma.orderAuditLog.deleteMany({ where: { orderId: { in: testOrderIds } } });
    await prisma.actionIdempotency.deleteMany({ where: { orderId: { in: testOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: testOrderIds } } });

    // Clean up dynamic admins
    await prisma.user.deleteMany({ where: { email: { in: ['admin2@helpingmitra.com', 'admin3@helpingmitra.com'] } } });

    console.log('\n🏁 VERIFICATION FINISHED.');
    const totalPassed = results.filter(r => r.status === 'PASS').length;
    const totalFailed = results.filter(r => r.status === 'FAIL').length;
    console.log(`Summary: Passed: ${totalPassed}, Failed: ${totalFailed}`);

  } catch (e) {
    console.error('💥 Fatal error in verification script:', e);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
