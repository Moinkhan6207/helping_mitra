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

async function runDetailsTests() {
  console.log('🧪 Starting Phase 5 Module 3 Details, Document & Audit Verification...\n');
  const results = [];

  const addResult = (test, status, details) => {
    results.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test} ${details ? `(${details})` : ''}`);
  };

  let adminToken = '';
  let userToken = '';
  let testOrderId = '';
  let testDocumentId = '';
  let testUserId = '';
  let testServiceId = '';

  try {
    // 1. Logs in as Admin
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

    // 2. Logs in as Regular User (Retailer)
    const userLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'testuser@gmail.com',
      password: 'Password@123',
    });
    if (userLoginRes.status === 200) {
      userToken = userLoginRes.body.data.accessToken;
      addResult('Regular User Login', 'PASS');
    } else {
      addResult('Regular User Login', 'FAIL', `Status: ${userLoginRes.status}`);
      return;
    }

    // Fetch existing user and service from database to link order correctly
    const testUser = await prisma.user.findFirst({ where: { email: 'testuser@gmail.com' } });
    if (!testUser) {
      addResult('Find Test User', 'FAIL', 'Please make sure seed data contains testuser@gmail.com');
      return;
    }
    testUserId = testUser.id;

    const testService = await prisma.service.findFirst({ where: { status: 'ACTIVE' } });
    if (!testService) {
      addResult('Find Active Service', 'FAIL', 'No active services in database to create order');
      return;
    }
    testServiceId = testService.id;

    // Create a dummy order inside the database with sensitive dynamic fields & file attachments
    const uniqueNumber = `HM-ORD-${Date.now().toString().slice(-6)}`;
    const order = await prisma.order.create({
      data: {
        orderNumber: uniqueNumber,
        userId: testUserId,
        serviceId: testServiceId,
        serviceNameSnapshot: testService.name,
        categoryNameSnapshot: 'Test Category',
        orderAmount: testService.mrp,
        orderAmountPaise: Math.round(Number(testService.mrp) * 100),
        idempotencyKey: `idemp-${Date.now()}`,
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        orderStatus: 'PENDING',
        fieldValues: {
          createMany: {
            data: [
              {
                fieldKey: 'aadhaar_number',
                fieldLabel: 'Aadhaar Number',
                fieldValue: '123456789012',
                isSensitive: true,
              },
              {
                fieldKey: 'pan_number',
                fieldLabel: 'PAN Card Number',
                fieldValue: 'ABCDE1234F',
                isSensitive: true,
              },
              {
                fieldKey: 'bank_account_no',
                fieldLabel: 'Bank Account Number',
                fieldValue: '918273645019',
                isSensitive: true,
              },
              {
                fieldKey: 'bank_ifsc',
                fieldLabel: 'Bank IFSC Code',
                fieldValue: 'SBIN0001234',
                isSensitive: true,
              },
              {
                fieldKey: 'full_name',
                fieldLabel: 'Applicant Full Name',
                fieldValue: 'Mitra Tester',
                isSensitive: false,
              },
            ],
          },
        },
        documents: {
          create: {
            documentKey: 'aadhaar',
            documentName: 'Aadhaar Card Front',
            fileName: 'aadhaar.jpg',
            fileType: 'image/jpeg',
            fileSize: 102400,
            storagePath: `/users/${testUserId}/temp/aadhaar.jpg`,
          },
        },
      },
      include: {
        documents: true,
      },
    });

    testOrderId = order.id;
    testDocumentId = order.documents[0].id;
    addResult('Database Seed Order', 'PASS', `Created Order ID: ${testOrderId}`);

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const userHeaders = { Authorization: `Bearer ${userToken}` };

    // ==========================================
    // TEST 1: Access Control to GET /admin/orders/:orderId
    // ==========================================
    const detailAuthRes = await makeRequest('GET', `/api/admin/orders/${testOrderId}`, userHeaders);
    if (detailAuthRes.status === 403) {
      addResult('1. GET Details - Retailer Forbidden', 'PASS');
    } else {
      addResult('1. GET Details - Retailer Forbidden', 'FAIL', `Expected 403, got ${detailAuthRes.status}`);
    }

    // ==========================================
    // TEST 2: GET details as Admin & check masking
    // ==========================================
    const detailRes = await makeRequest('GET', `/api/admin/orders/${testOrderId}`, adminHeaders);
    if (detailRes.status === 200 && detailRes.body.success) {
      const fields = detailRes.body.data.fieldValues || [];
      const aadhaar = fields.find((f) => f.fieldKey === 'aadhaar_number');
      const pan = fields.find((f) => f.fieldKey === 'pan_number');
      const bank = fields.find((f) => f.fieldKey === 'bank_account_no');
      const ifsc = fields.find((f) => f.fieldKey === 'bank_ifsc');
      const name = fields.find((f) => f.fieldKey === 'full_name');

      const aadhaarMasked = aadhaar && aadhaar.fieldValue.includes('*') && !aadhaar.fieldValue.includes('12345678');
      const panMasked = pan && pan.fieldValue.includes('*') && !pan.fieldValue.includes('ABCDE');
      const bankMasked = bank && bank.fieldValue.includes('*') && !bank.fieldValue.includes('91827');
      const ifscMasked = ifsc && ifsc.fieldValue.includes('*') && !ifsc.fieldValue.includes('00012');
      const nameUnmasked = name && name.fieldValue === 'Mitra Tester';

      if (aadhaarMasked && panMasked && bankMasked && ifscMasked && nameUnmasked) {
        addResult('2. GET Details - Admin OK & Fields Masked', 'PASS', 'Sensitive fields correctly masked by default');
      } else {
        addResult('2. GET Details - Admin OK & Fields Masked', 'FAIL', `Masking checks failed: Aadhaar: ${aadhaar?.fieldValue}, PAN: ${pan?.fieldValue}, Bank: ${bank?.fieldValue}, IFSC: ${ifsc?.fieldValue}`);
      }
    } else {
      addResult('2. GET Details - Admin OK & Fields Masked', 'FAIL', `Status: ${detailRes.status}`);
    }

    // ==========================================
    // TEST 3: Access Control to POST /admin/orders/:orderId/reveal
    // ==========================================
    const revealAuthRes = await makeRequest('POST', `/api/admin/orders/${testOrderId}/reveal`, userHeaders, {
      fieldKey: 'aadhaar_number',
      reason: 'I need it',
    });
    if (revealAuthRes.status === 403) {
      addResult('3. POST Reveal - Retailer Forbidden', 'PASS');
    } else {
      addResult('3. POST Reveal - Retailer Forbidden', 'FAIL', `Expected 403, got ${revealAuthRes.status}`);
    }

    // ==========================================
    // TEST 4: Reveal sensitive field as Admin (Validation & Success)
    // ==========================================
    // 4a. Validation fail check (missing reason)
    const revealValRes = await makeRequest('POST', `/api/admin/orders/${testOrderId}/reveal`, adminHeaders, {
      fieldKey: 'aadhaar_number',
    });
    if (revealValRes.status === 400) {
      addResult('4a. POST Reveal - Missing Reason Blocked', 'PASS');
    } else {
      addResult('4a. POST Reveal - Missing Reason Blocked', 'FAIL', `Expected 400, got ${revealValRes.status}`);
    }

    // 4b. Successful reveal
    const revealRes = await makeRequest('POST', `/api/admin/orders/${testOrderId}/reveal`, adminHeaders, {
      fieldKey: 'aadhaar_number',
      reason: 'Verification of identity for seed order',
    });
    if (revealRes.status === 200 && revealRes.body.data.fieldValue === '123456789012') {
      addResult('4b. POST Reveal - Success & Return Cleartext', 'PASS', 'Unmasked value returned successfully');
    } else {
      addResult('4b. POST Reveal - Success & Return Cleartext', 'FAIL', `Status: ${revealRes.status}, Value: ${revealRes.body?.data?.fieldValue}`);
    }

    // ==========================================
    // TEST 5: Access Control to POST /admin/orders/:orderId/files/:fileId/access
    // ==========================================
    const fileAuthRes = await makeRequest('POST', `/api/admin/orders/${testOrderId}/files/${testDocumentId}/access`, userHeaders, {
      action: 'VIEW',
    });
    if (fileAuthRes.status === 403) {
      addResult('5. POST File Access - Retailer Forbidden', 'PASS');
    } else {
      addResult('5. POST File Access - Retailer Forbidden', 'FAIL', `Expected 403, got ${fileAuthRes.status}`);
    }

    // ==========================================
    // TEST 6: File Access URL generation
    // ==========================================
    const fileRes = await makeRequest('POST', `/api/admin/orders/${testOrderId}/files/${testDocumentId}/access`, adminHeaders, {
      action: 'VIEW',
    });
    if (fileRes.status === 200 && fileRes.body.data.signedUrl.includes('mock-storage.googleapis.com')) {
      addResult('6. POST File Access - Signed URL Generated', 'PASS', 'Signed URL contains local mock storage endpoint');
    } else {
      addResult('6. POST File Access - Signed URL Generated', 'FAIL', `Status: ${fileRes.status}, URL: ${fileRes.body?.data?.signedUrl}`);
    }

    // ==========================================
    // TEST 7: Timeline & Audit history checks
    // ==========================================
    const auditRes = await makeRequest('GET', `/api/admin/orders/${testOrderId}`, adminHeaders);
    if (auditRes.status === 200) {
      const timeline = auditRes.body.data.timeline || [];
      const revealLog = timeline.find((t) => t.action === 'SENSITIVE_DATA_REVEAL');
      const viewLog = timeline.find((t) => t.action === 'DOCUMENT_VIEW');

      const logsExist = !!revealLog && !!viewLog;
      const actorNameResolved = revealLog?.actorName === 'Helping Mitra Admin' || revealLog?.actorName === 'Mitra Admin';

      if (logsExist && actorNameResolved) {
        addResult('7. Timeline Audit History Integrity', 'PASS', 'Audit logs correctly resolved actor names and logged events');
      } else {
        addResult('7. Timeline Audit History Integrity', 'FAIL', `Logs Exist: ${logsExist}, Actor Name: ${revealLog?.actorName}`);
      }
    } else {
      addResult('7. Timeline Audit History Integrity', 'FAIL', `Status: ${auditRes.status}`);
    }

  } catch (error) {
    console.error('💥 Error running verification tests:', error);
  } finally {
    // Cleanup created order and references
    if (testOrderId) {
      await prisma.orderAuditLog.deleteMany({ where: { orderId: testOrderId } });
      await prisma.orderFieldValue.deleteMany({ where: { orderId: testOrderId } });
      await prisma.orderDocument.deleteMany({ where: { orderId: testOrderId } });
      await prisma.order.delete({ where: { id: testOrderId } });
      console.log('\n🏁 Cleanup: deleted temporary test order and logs.');
    }
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database.');
  }
}

runDetailsTests();
