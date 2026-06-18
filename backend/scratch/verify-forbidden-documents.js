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
            status: res.statusCode,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
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
  console.log('🧪 Starting API Verification for FR-2.5...');

  try {
    // 1. Login as Admin
    console.log('\n--- Logging in as Admin ---');
    const adminLogin = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin@helpingmitra.com',
      password: 'AdminPassword@123'
    });
    
    if (adminLogin.status !== 200) {
      console.error('❌ Login failed:', adminLogin.body);
      return;
    }
    
    const adminToken = adminLogin.body.data.accessToken;
    const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };
    console.log('✅ Admin logged in successfully.');

    // 2. Fetch a service to inspect documents
    console.log('\n--- Fetching Services list ---');
    const svcList = await makeRequest('GET', '/api/admin/services', adminHeaders);
    const service = svcList.body.data.services[0];
    
    if (!service) {
      console.error('❌ No service found in db');
      return;
    }
    
    const serviceId = service.id;
    console.log(`✅ Found service "${service.name}" with ID ${serviceId}`);

    // Fetch service details to get a real document UUID
    console.log('\n--- Fetching Service Details ---');
    const svcDetails = await makeRequest('GET', `/api/admin/services/${serviceId}`, adminHeaders);
    const docs = svcDetails.body.data.documentRequirements || [];
    if (docs.length === 0) {
      console.error('❌ No documents configured on service');
      return;
    }
    
    const docId = docs[0].id;
    console.log(`✅ Found document "${docs[0].documentName}" with ID ${docId}`);

    // 3. Test: POST /services/:serviceId/documents (Expected: 403 Forbidden)
    console.log('\n--- Testing Document Creation Guard (Expected: 403) ---');
    const docCreate = await makeRequest('POST', `/api/admin/services/${serviceId}/documents`, adminHeaders, {
      documentName: 'Hack Certificate',
      documentKey: 'hackCert',
      isRequired: true,
      allowedFileTypes: ['PDF'],
      displayOrder: 99
    });
    console.log(`Status code: ${docCreate.status}`);
    console.log(`Error message: ${docCreate.body.message}`);
    if (docCreate.status === 403) {
      console.log('✅ PASS: Document creation correctly blocked!');
    } else {
      console.log('❌ FAIL: Document creation NOT blocked!');
    }

    // 4. Test: PATCH /documents/:id (Expected: 403 Forbidden)
    console.log('\n--- Testing Document Update Guard (Expected: 403) ---');
    const docUpdate = await makeRequest('PATCH', `/api/admin/documents/${docId}`, adminHeaders, {
      documentName: 'Updated Cert'
    });
    console.log(`Status code: ${docUpdate.status}`);
    console.log(`Error message: ${docUpdate.body.message}`);
    if (docUpdate.status === 403) {
      console.log('✅ PASS: Document update correctly blocked!');
    } else {
      console.log('❌ FAIL: Document update NOT blocked!');
    }

    // 5. Test: DELETE /documents/:id (Expected: 403 Forbidden)
    console.log('\n--- Testing Document Deletion Guard (Expected: 403) ---');
    const docDelete = await makeRequest('DELETE', `/api/admin/documents/${docId}`, adminHeaders);
    console.log(`Status code: ${docDelete.status}`);
    console.log(`Error message: ${docDelete.body.message}`);
    if (docDelete.status === 403) {
      console.log('✅ PASS: Document deletion correctly blocked!');
    } else {
      console.log('❌ FAIL: Document deletion NOT blocked!');
    }

  } catch (e) {
    console.error(`💥 Unexpected Error in tests:`, e);
  }
}

runTests();
