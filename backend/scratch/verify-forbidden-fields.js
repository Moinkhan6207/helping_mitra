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
  console.log('🧪 Starting API Verification for FR-2.4...');

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

    // 2. Fetch a service to inspect fields
    console.log('\n--- Fetching Services list ---');
    const svcList = await makeRequest('GET', '/api/admin/services', adminHeaders);
    const service = svcList.body.data.services[0];
    
    if (!service) {
      console.error('❌ No service found in db');
      return;
    }
    
    const serviceId = service.id;
    console.log(`✅ Found service "${service.name}" with ID ${serviceId}`);

    // Fetch service details to get a real field UUID
    console.log('\n--- Fetching Service Details ---');
    const svcDetails = await makeRequest('GET', `/api/admin/services/${serviceId}`, adminHeaders);
    const fields = svcDetails.body.data.fields || [];
    if (fields.length === 0) {
      console.error('❌ No fields configured on service');
      return;
    }
    
    const fieldId = fields[0].id;
    console.log(`✅ Found field "${fields[0].label}" with ID ${fieldId}`);

    // 3. Test: POST /services/:serviceId/fields (Expected: 403 Forbidden)
    console.log('\n--- Testing Field Creation Guard (Expected: 403) ---');
    const fieldCreate = await makeRequest('POST', `/api/admin/services/${serviceId}/fields`, adminHeaders, {
      label: 'Hack Field',
      fieldKey: 'hackField',
      fieldType: 'TEXT',
      displayOrder: 99
    });
    console.log(`Status code: ${fieldCreate.status}`);
    console.log(`Error message: ${fieldCreate.body.message}`);
    if (fieldCreate.status === 403) {
      console.log('✅ PASS: Field creation correctly blocked!');
    } else {
      console.log('❌ FAIL: Field creation NOT blocked!');
    }

    // 4. Test: PATCH /fields/:id (Expected: 403 Forbidden)
    console.log('\n--- Testing Field Update Guard (Expected: 403) ---');
    const fieldUpdate = await makeRequest('PATCH', `/api/admin/fields/${fieldId}`, adminHeaders, {
      label: 'Updated Field'
    });
    console.log(`Status code: ${fieldUpdate.status}`);
    console.log(`Error message: ${fieldUpdate.body.message}`);
    if (fieldUpdate.status === 403) {
      console.log('✅ PASS: Field update correctly blocked!');
    } else {
      console.log('❌ FAIL: Field update NOT blocked!');
    }

    // 5. Test: DELETE /fields/:id (Expected: 403 Forbidden)
    console.log('\n--- Testing Field Deletion Guard (Expected: 403) ---');
    const fieldDelete = await makeRequest('DELETE', `/api/admin/fields/${fieldId}`, adminHeaders);
    console.log(`Status code: ${fieldDelete.status}`);
    console.log(`Error message: ${fieldDelete.body.message}`);
    if (fieldDelete.status === 403) {
      console.log('✅ PASS: Field deletion correctly blocked!');
    } else {
      console.log('❌ FAIL: Field deletion NOT blocked!');
    }

  } catch (e) {
    console.error(`💥 Unexpected Error in tests:`, e);
  }
}

runTests();
