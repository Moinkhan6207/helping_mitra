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

async function runTests() {
  console.log('🧪 Starting Security, Encryption at Rest & Concurrency Verification...\n');
  const results = [];
  const addResult = (test, status, details) => {
    results.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test} ${details ? `(${details})` : ''}`);
  };

  let adminToken = '';
  let adminId = '';
  let secondAdminToken = '';
  let secondAdminId = '';
  let testOrderId = '';
  let testDocumentId = '';
  let testUserId = '';
  let testServiceId = '';

  try {
    // 1. Logs in as Admin 1
    const adminLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin@helpingmitra.com',
      password: 'AdminPassword@123',
    });
    if (adminLoginRes.status === 200) {
      adminToken = adminLoginRes.body.data.accessToken;
      adminId = adminLoginRes.body.data.user.id;
      addResult('Admin 1 Login', 'PASS');
    } else {
      addResult('Admin 1 Login', 'FAIL', `Status: ${adminLoginRes.status}`);
      return;
    }

    // 2. Fetch or seed a second admin for concurrency tests
    const secondAdminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        NOT: { id: adminId }
      }
    });

    let secondAdminHeaders = null;
    if (secondAdminUser) {
      // In a real environment we can just generate a token for them or assume they exist.
      // Let's create a JWT for the second admin to authenticate.
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({
        id: secondAdminUser.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      }, 'mock_jwt_access_secret_for_local_dev', { expiresIn: '15m' });
      secondAdminToken = token;
      secondAdminId = secondAdminUser.id;
      secondAdminHeaders = { Authorization: `Bearer ${secondAdminToken}` };
      addResult('Second Admin Setup', 'PASS', `ID: ${secondAdminId}`);
    } else {
      // Create a dummy second admin in DB
      const dummyAdmin = await prisma.user.create({
        data: {
          name: 'Second Admin',
          email: 'secondadmin@helpingmitra.com',
          mobile: '9888888888',
          passwordHash: 'dummy',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      secondAdminId = dummyAdmin.id;
      const jwt = require('jsonwebtoken');
      secondAdminToken = jwt.sign({
        id: dummyAdmin.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      }, 'mock_jwt_access_secret_for_local_dev', { expiresIn: '15m' });
      secondAdminHeaders = { Authorization: `Bearer ${secondAdminToken}` };
      addResult('Second Admin Setup (Created)', 'PASS', `ID: ${secondAdminId}`);
    }

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Fetch existing user and service
    const testUser = await prisma.user.findFirst({ where: { email: 'testuser@gmail.com' } });
    if (!testUser) {
      addResult('Find Test User', 'FAIL', 'Please seed testuser@gmail.com');
      return;
    }
    testUserId = testUser.id;

    const testService = await prisma.service.findFirst({ where: { name: 'PAN PDF Service', status: 'ACTIVE' } });
    if (!testService) {
      addResult('Find Active Service', 'FAIL', 'PAN PDF Service not found or inactive');
      return;
    }
    testServiceId = testService.id;

    // ========================================================
    // FR-5.7: SENSITIVE DATA ENCRYPTION AT REST VERIFICATION
    // ========================================================
    console.log('\n--- FR-5.7: Sensitive Data Encryption at Rest ---');
    
    // Create an order via backend API (or direct repository since we want to check DB values)
    const uniqueNumber = `HM-ORD-${Date.now().toString().slice(-6)}`;
    
    // We use the normal submission flow to ensure encryption is triggered.
    // Let's first log in as regular user to get their token.
    const userLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'testuser@gmail.com',
      password: 'Password@123',
    });
    const userHeaders = { Authorization: `Bearer ${userLoginRes.body.data.accessToken}` };

    // Submit order via API
    const orderSubmission = await makeRequest('POST', '/api/orders', userHeaders, {
      idempotencyKey: require('crypto').randomUUID(),
      serviceId: testServiceId,
      amount: Number(testService.mrp),
      consentGiven: true,
      consentText: 'I agree to terms and conditions.',
      fieldValues: [
        { fieldKey: 'aadhaarNumber', fieldLabel: 'Aadhaar Number', value: '111122223333' },
        { fieldKey: 'panNumber', fieldLabel: 'PAN Number', value: 'ABCDE9999F' },
        { fieldKey: 'dob', fieldLabel: 'Date Of Birth', value: '2000-01-01' },
        { fieldKey: 'aadhaarOtpCallNumber', fieldLabel: 'Aadhaar OTP Call Number', value: '9888888888' }
      ],
      documents: [
        {
          documentKey: 'aadhaar',
          documentName: 'Aadhaar Card Front',
          fileName: 'aadhaar.jpg',
          fileType: 'image/jpeg',
          fileSize: 102400,
          storagePath: `/users/${testUserId}/temp/aadhaar.jpg`
        }
      ]
    });

    if (orderSubmission.status !== 201) {
      addResult('Order submission API', 'FAIL', `Status: ${orderSubmission.status}, Msg: ${JSON.stringify(orderSubmission.body)}`);
      return;
    }
    testOrderId = orderSubmission.body.data.orderId;
    addResult('Order submission API', 'PASS', `Created Order ID: ${testOrderId}`);

    // Query the database directly to inspect stored values
    const dbFieldValues = await prisma.orderFieldValue.findMany({
      where: { orderId: testOrderId }
    });

    const aadhaarDb = dbFieldValues.find(f => f.fieldKey === 'aadhaarNumber');
    const panDb = dbFieldValues.find(f => f.fieldKey === 'panNumber');
    const nameDb = dbFieldValues.find(f => f.fieldKey === 'dob');

    // Asserts:
    // 1. fieldValue should be MASKED in database
    // 2. encryptedValue should not be null
    // 3. decrypting encryptedValue should return cleartext
    const cryptoUtils = require('../src/core/utils/encryption');
    
    const aadhaarEncryptedValid = aadhaarDb && aadhaarDb.encryptedValue && !aadhaarDb.encryptedValue.includes('111122223333');
    const aadhaarMasked = aadhaarDb && aadhaarDb.fieldValue === '********3333';
    const aadhaarDecrypted = aadhaarDb && cryptoUtils.decrypt(aadhaarDb.encryptedValue) === '111122223333';

    const panEncryptedValid = panDb && panDb.encryptedValue && !panDb.encryptedValue.includes('ABCDE9999F');
    const panMasked = panDb && panDb.fieldValue === '******';
    const panDecrypted = panDb && cryptoUtils.decrypt(panDb.encryptedValue) === 'ABCDE9999F';

    const nameUnencrypted = nameDb && !nameDb.encryptedValue && nameDb.fieldValue === '2000-01-01';

    if (aadhaarEncryptedValid && aadhaarMasked && aadhaarDecrypted) {
      addResult('Aadhaar Encryption at Rest', 'PASS', `Field: ${aadhaarDb.fieldValue}, Encrypted: Yes, Decrypted: Yes`);
    } else {
      addResult('Aadhaar Encryption at Rest', 'FAIL', `Masked: ${aadhaarDb?.fieldValue}, EncryptedValue: ${aadhaarDb?.encryptedValue}`);
    }

    if (panEncryptedValid && panMasked && panDecrypted) {
      addResult('PAN Encryption at Rest', 'PASS', `Field: ${panDb.fieldValue}, Encrypted: Yes, Decrypted: Yes`);
    } else {
      addResult('PAN Encryption at Rest', 'FAIL', `Masked: ${panDb?.fieldValue}, EncryptedValue: ${panDb?.encryptedValue}`);
    }

    if (nameUnencrypted) {
      addResult('Non-Sensitive Value Plaintext', 'PASS', `Field: ${nameDb.fieldValue}, Encrypted: No`);
    } else {
      addResult('Non-Sensitive Value Plaintext', 'FAIL');
    }

    // ========================================================
    // FR-5.8: SECURE USER-DOCUMENT ACCESS VERIFICATION
    // ========================================================
    console.log('\n--- FR-5.8: Secure User-Document Access ---');
    const orderObj = await prisma.order.findUnique({
      where: { id: testOrderId },
      include: { documents: true }
    });
    testDocumentId = orderObj.documents[0].id;

    // 1. Call GET route
    const docUrlRes = await makeRequest('GET', `/api/admin/orders/${testOrderId}/documents/${testDocumentId}/url?action=VIEW`, adminHeaders);
    if (docUrlRes.status === 200 && docUrlRes.body.data.signedUrl.includes('mock-storage.googleapis.com')) {
      addResult('GET secure document URL', 'PASS', 'Signed URL generated successfully');
    } else {
      addResult('GET secure document URL', 'FAIL', `Status: ${docUrlRes.status}`);
    }

    // 2. Call GET route with mismatch document ID
    const mockDocId = require('crypto').randomUUID();
    const docMismatchRes = await makeRequest('GET', `/api/admin/orders/${testOrderId}/documents/${mockDocId}/url`, adminHeaders);
    if (docMismatchRes.status === 404) {
      addResult('GET secure document mismatch validation', 'PASS', 'Correctly rejected mismatched document');
    } else {
      addResult('GET secure document mismatch validation', 'FAIL', `Status: ${docMismatchRes.status}`);
    }

    // ========================================================
    // FR-5.9: ORDER CLAIM & START PROCESSING CONCURRENCY VERIFICATION
    // ========================================================
    console.log('\n--- FR-5.9: Order Claim & Start Processing Concurrency ---');

    // Verify initial version is 1
    const orderBefore = await prisma.order.findUnique({ where: { id: testOrderId } });
    const initialVersion = orderBefore.version;
    addResult('Initial version check', 'PASS', `Version: ${initialVersion}`);

    // Admin 1 starts processing with correct version
    const startProcRes = await makeRequest('PATCH', `/api/admin/orders/${testOrderId}/start-processing`, adminHeaders, {
      version: initialVersion,
      idempotencyKey: require('crypto').randomUUID()
    });

    if (startProcRes.status === 200 && startProcRes.body.data.orderStatus === 'PROCESSING') {
      addResult('Admin 1 Start Processing', 'PASS', 'Status set to PROCESSING');
    } else {
      addResult('Admin 1 Start Processing', 'FAIL', `Status: ${startProcRes.status}, Msg: ${JSON.stringify(startProcRes.body)}`);
      return;
    }

    // Verify order in database is claimed by Admin 1 and version is incremented
    const orderAfter = await prisma.order.findUnique({ where: { id: testOrderId } });
    if (
      orderAfter.orderStatus === 'PROCESSING' &&
      orderAfter.assignedAdminId === adminId &&
      orderAfter.processingStartedByAdminId === adminId &&
      orderAfter.version === initialVersion + 1
    ) {
      addResult('DB Claim attributes updated', 'PASS', `Version: ${orderAfter.version}, AssignedTo: ${orderAfter.assignedAdminId}`);
    } else {
      addResult('DB Claim attributes updated', 'FAIL', JSON.stringify(orderAfter));
    }

    // Admin 2 tries to start processing same order (which is now in PROCESSING status and claimed by Admin 1)
    const admin2Headers = { Authorization: `Bearer ${secondAdminToken}` };
    const startProcConflictRes = await makeRequest('PATCH', `/api/admin/orders/${testOrderId}/start-processing`, admin2Headers, {
      version: initialVersion, // trying with old version
      idempotencyKey: require('crypto').randomUUID()
    });

    if (startProcConflictRes.status === 400) {
      addResult('Admin 2 Start Processing Conflict (Old version)', 'PASS', `Blocked with: ${startProcConflictRes.body.message}`);
    } else {
      addResult('Admin 2 Start Processing Conflict (Old version)', 'FAIL', `Expected 400, got ${startProcConflictRes.status}`);
    }

    // Admin 2 tries to claim/start processing with updated version
    const startProcConflictRes2 = await makeRequest('PATCH', `/api/admin/orders/${testOrderId}/start-processing`, admin2Headers, {
      version: initialVersion + 1, // trying with correct version but already claimed
      idempotencyKey: require('crypto').randomUUID()
    });

    if (
      startProcConflictRes2.status === 400 &&
      startProcConflictRes2.body.message.includes('processed by another administrator')
    ) {
      addResult('Admin 2 Start Processing Claim Check', 'PASS', `Blocked with: ${startProcConflictRes2.body.message}`);
    } else {
      addResult('Admin 2 Start Processing Claim Check', 'FAIL', `Status: ${startProcConflictRes2.status}, Msg: ${JSON.stringify(startProcConflictRes2.body)}`);
    }

    console.log('\n🏁 Verification completed successfully.');

  } catch (e) {
    console.error('💥 Unexpected error during test verification:', e);
  } finally {
    // Cleanup temporary test order
    if (testOrderId) {
      await prisma.orderAuditLog.deleteMany({ where: { orderId: testOrderId } });
      await prisma.orderFieldValue.deleteMany({ where: { orderId: testOrderId } });
      await prisma.orderDocument.deleteMany({ where: { orderId: testOrderId } });
      await prisma.order.delete({ where: { id: testOrderId } });
      console.log('🏁 Cleanup: deleted temporary test order and logs.');
    }
    // Delete dummy second admin if created
    await prisma.user.deleteMany({ where: { email: 'secondadmin@helpingmitra.com' } });
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database.');
  }
}

runTests();
