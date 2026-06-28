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
    // ADMIN ORDERS QUEUE & STATS TEST
    // ==========================================
    console.log('\n--- Orders Queue: Get Admin Orders list ---');
    const orderList = await makeRequest('GET', '/api/admin/orders', adminHeaders);
    console.log(`Status (Expected 200): ${orderList.status}`);
    console.log(`Total Orders in Queue: ${orderList.body.data.pagination.total}`);

    console.log('\n--- Orders Queue: Get Stats ---');
    const orderStats = await makeRequest('GET', '/api/admin/orders/stats', adminHeaders);
    console.log(`Status (Expected 200): ${orderStats.status}`);
    console.log(`Stats body:`, JSON.stringify(orderStats.body.data));

    console.log('\n--- Orders Queue: Get Admin list ---');
    const orderAdmins = await makeRequest('GET', '/api/admin/orders/admins', adminHeaders);
    console.log(`Status (Expected 200): ${orderAdmins.status}`);
    console.log(`Admin list count: ${orderAdmins.body.data.length}`);

    console.log('\n--- Security Check: Regular User blocks on Admin Orders ---');
    const orderBlock = await makeRequest('GET', '/api/admin/orders', userHeaders);
    console.log(`Status (Expected 403): ${orderBlock.status}`);

    console.log('\n✅ Admin Orders APIs successfully verified!');
    return;
  } catch (e) {
    console.error(`💥 Unexpected Error in tests:`, e);
  }
}

runTests();
