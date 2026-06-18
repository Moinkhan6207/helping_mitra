const http = require('http');

const PORT = 5050;
const BASE_URL = `http://localhost:${PORT}`;

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
  console.log('🧪 Starting Admin APIs Verification Tests...');

  try {
    // 1. Dynamic User registration (ignore failure if already registered)
    console.log('\n--- 1. Registering Regular User ---');
    const regRes = await makeRequest('POST', '/api/auth/register', {}, {
      name: 'Regular Test User',
      email: 'testuser@gmail.com',
      mobile: '9876543210',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      shopName: 'Test Shop',
      aadhaarNumber: '123456789012',
      panNumber: 'ABCDE1234F',
      address: '123 Street',
      state: 'Madhya Pradesh',
      district: 'Bhopal',
      pinCode: '462001',
      userType: 'RETAILER'
    });
    console.log(`Register status: ${regRes.status}`);

    // 2. Login as Admin
    console.log('\n--- 2. Logging in as Admin ---');
    const adminLogin = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin@helpingmitra.com',
      password: 'AdminPassword@123'
    });
    const adminToken = adminLogin.body.data.accessToken;
    console.log(`Admin login status: ${adminLogin.status}`);

    // 3. Login as regular User
    console.log('\n--- 3. Logging in as Regular User ---');
    const userLogin = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'testuser@gmail.com',
      password: 'Password@123'
    });
    const userToken = userLogin.body.data.accessToken;
    console.log(`User login status: ${userLogin.status}`);

    const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };
    const userHeaders = { 'Authorization': `Bearer ${userToken}` };

    // ==========================================
    // SECURITY GATE VERIFICATION
    // ==========================================
    console.log('\n--- Security Check: Regular User blocks on Admin routes ---');
    const blockCheck = await makeRequest('GET', '/api/admin/service-categories', userHeaders);
    console.log(`Status (Expected 403): ${blockCheck.status}`);
    console.log(`Body:`, JSON.stringify(blockCheck.body));

    console.log('\n--- Security Check: Anonymous blocks on Admin routes ---');
    const anonCheck = await makeRequest('GET', '/api/admin/service-categories');
    console.log(`Status (Expected 401): ${anonCheck.status}`);
    console.log(`Body:`, JSON.stringify(anonCheck.body));

    // ==========================================
    // CATEGORY CRUD TEST
    // ==========================================
    console.log('\n--- Category: Creating Category ---');
    const catCreate = await makeRequest('POST', '/api/admin/service-categories', adminHeaders, {
      name: 'Utility Services',
      slug: 'utility-services',
      description: 'Utility based services',
      displayOrder: 7
    });
    const categoryId = catCreate.body.data.id;
    console.log(`Status: ${catCreate.status}`);
    console.log(`Created ID: ${categoryId}`);

    console.log('\n--- Category: Get Admin Categories ---');
    const catList = await makeRequest('GET', '/api/admin/service-categories', adminHeaders);
    console.log(`Status: ${catList.status}`);
    console.log(`Total Categories: ${catList.body.data.length}`);

    console.log('\n--- Category: Updating Category ---');
    const catUpdate = await makeRequest('PATCH', `/api/admin/service-categories/${categoryId}`, adminHeaders, {
      name: 'Utility and Bills'
    });
    console.log(`Status: ${catUpdate.status}`);
    console.log(`Updated Name: ${catUpdate.body.data.name}`);

    // ==========================================
    // SERVICE CRUD TEST
    // ==========================================
    console.log('\n--- Service: Creating Service ---');
    const svcCreate = await makeRequest('POST', '/api/admin/services', adminHeaders, {
      categoryId,
      name: 'PAN Status Check',
      slug: 'pan-status-check',
      shortDescription: 'Track PAN status',
      description: 'Track PAN application progress',
      mrp: 15,
      resultType: 'STATUS_ONLY',
      resultLabel: 'Status',
      displayOrder: 1
    });
    const serviceId = svcCreate.body.data.id;
    console.log(`Status: ${svcCreate.status}`);
    console.log(`Created Service ID: ${serviceId}`);

    console.log('\n--- Service: Get Admin Services list ---');
    const svcList = await makeRequest('GET', '/api/admin/services', adminHeaders);
    console.log(`Status: ${svcList.status}`);
    console.log(`Total Services: ${svcList.body.data.pagination.total}`);

    console.log('\n--- Service: Get Service by ID ---');
    const svcGet = await makeRequest('GET', `/api/admin/services/${serviceId}`, adminHeaders);
    console.log(`Status: ${svcGet.status}`);
    console.log(`Details name: ${svcGet.body.data.name}`);

    // ==========================================
    // PRICING HISTORY LOGGING TEST
    // ==========================================
    console.log('\n--- Pricing: Updating Service MRP (Triggering Price History) ---');
    const svcUpdatePrice = await makeRequest('PATCH', `/api/admin/services/${serviceId}`, adminHeaders, {
      mrp: 20
    });
    console.log(`Status: ${svcUpdatePrice.status}`);
    console.log(`Updated MRP: ${svcUpdatePrice.body.data.mrp}`);

    console.log('\n--- Pricing: Get Price History ---');
    const priceHistory = await makeRequest('GET', `/api/admin/services/${serviceId}/price-history`, adminHeaders);
    console.log(`Status: ${priceHistory.status}`);
    console.log(`History records:`, JSON.stringify(priceHistory.body.data, null, 2));

    // ==========================================
    // FIELDS CRUD TEST
    // ==========================================
    console.log('\n--- Fields: Creating Field ---');
    const fieldCreate = await makeRequest('POST', `/api/admin/services/${serviceId}/fields`, adminHeaders, {
      label: 'Aadhaar Number',
      fieldKey: 'aadhaarNumber',
      fieldType: 'TEXT',
      placeholder: 'Enter Aadhaar Number',
      isRequired: true,
      displayOrder: 1,
      validationRules: {
        minLength: 12,
        maxLength: 12
      }
    });
    const fieldId = fieldCreate.body.data.id;
    console.log(`Status: ${fieldCreate.status}`);
    console.log(`Created Field ID: ${fieldId}`);

    console.log('\n--- Fields: Updating Field ---');
    const fieldUpdate = await makeRequest('PATCH', `/api/admin/fields/${fieldId}`, adminHeaders, {
      placeholder: 'Please enter 12 digit Aadhaar'
    });
    console.log(`Status: ${fieldUpdate.status}`);
    console.log(`Updated Placeholder: ${fieldUpdate.body.data.placeholder}`);

    console.log('\n--- Fields: Deleting Field ---');
    const fieldDelete = await makeRequest('DELETE', `/api/admin/fields/${fieldId}`, adminHeaders);
    console.log(`Status: ${fieldDelete.status}`);

    // ==========================================
    // DOCUMENTS CRUD TEST
    // ==========================================
    console.log('\n--- Documents: Creating Document ---');
    const docCreate = await makeRequest('POST', `/api/admin/services/${serviceId}/documents`, adminHeaders, {
      documentName: 'Aadhaar Card',
      documentKey: 'aadhaarCard',
      isRequired: true,
      allowedFileTypes: ['PDF', 'JPG', 'JPEG', 'PNG'],
      displayOrder: 1
    });
    const docId = docCreate.body.data.id;
    console.log(`Status: ${docCreate.status}`);
    console.log(`Created Document ID: ${docId}`);

    console.log('\n--- Documents: Updating Document ---');
    const docUpdate = await makeRequest('PATCH', `/api/admin/documents/${docId}`, adminHeaders, {
      isRequired: false
    });
    console.log(`Status: ${docUpdate.status}`);
    console.log(`Updated isRequired: ${docUpdate.body.data.isRequired}`);

    console.log('\n--- Documents: Deleting Document ---');
    const docDelete = await makeRequest('DELETE', `/api/admin/documents/${docId}`, adminHeaders);
    console.log(`Status: ${docDelete.status}`);

    // ==========================================
    // SOFT DELETE VERIFICATION
    // ==========================================
    console.log('\n--- Soft Delete: Disabling Category ---');
    const catDisable = await makeRequest('DELETE', `/api/admin/service-categories/${categoryId}`, adminHeaders);
    console.log(`Status: ${catDisable.status}`);
    console.log(`Disabled Category Status: ${catDisable.body.data.status}`);

    console.log('\n--- Soft Delete: Disabling Service ---');
    const svcDisable = await makeRequest('DELETE', `/api/admin/services/${serviceId}`, adminHeaders);
    console.log(`Status: ${svcDisable.status}`);
    console.log(`Disabled Service Status: ${svcDisable.body.data.status}`);

  } catch (e) {
    console.error(`💥 Unexpected Error in tests:`, e);
  }
}

runTests();
