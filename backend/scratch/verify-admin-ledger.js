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
  console.log('🧪 Starting Admin Wallet Ledger API Verification...');

  try {
    // 1. Login as Admin
    console.log('\n--- 1. Logging in as Admin ---');
    const adminLogin = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'admin@helpingmitra.com',
      password: 'AdminPassword@123'
    });
    
    if (adminLogin.status !== 200) {
      console.error('❌ Admin login failed!');
      process.exit(1);
    }
    
    const adminToken = adminLogin.body.data.accessToken;
    console.log(`Admin login status: ${adminLogin.status}`);
    const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

    // 2. Login as regular User to verify security blocks
    console.log('\n--- 2. Logging in as Regular User ---');
    const userLogin = await makeRequest('POST', '/api/auth/login', {}, {
      identifier: 'testuser@gmail.com',
      password: 'Password@123'
    });
    
    let userToken = null;
    if (userLogin.status === 200) {
      userToken = userLogin.body.data.accessToken;
      console.log(`User login status: ${userLogin.status}`);
    } else {
      console.log(`User login returned status ${userLogin.status} (user might not exist, proceeding)`);
    }

    // ==========================================
    // SECURITY GATE VERIFICATION
    // ==========================================
    if (userToken) {
      console.log('\n--- Security Check: Regular User blocks on Admin Ledger ---');
      const userHeaders = { 'Authorization': `Bearer ${userToken}` };
      const blockCheck = await makeRequest('GET', '/api/wallet/admin/ledger', userHeaders);
      console.log(`Status (Expected 403): ${blockCheck.status}`);
      if (blockCheck.status !== 403) {
        console.error('❌ Security check failed! Regular user got access.');
        process.exit(1);
      }
    }

    console.log('\n--- Security Check: Anonymous blocks on Admin Ledger ---');
    const anonCheck = await makeRequest('GET', '/api/wallet/admin/ledger');
    console.log(`Status (Expected 401): ${anonCheck.status}`);
    if (anonCheck.status !== 401) {
      console.error('❌ Security check failed! Anonymous user got access.');
      process.exit(1);
    }

    // ==========================================
    // ADMIN WALLET LEDGER API TEST
    // ==========================================
    console.log('\n--- Admin Wallet Ledger: Get List ---');
    const ledgerList = await makeRequest('GET', '/api/wallet/admin/ledger?limit=5', adminHeaders);
    console.log(`Status (Expected 200): ${ledgerList.status}`);
    
    if (ledgerList.status !== 200) {
      console.error('❌ Failed to fetch admin wallet ledger list!');
      process.exit(1);
    }

    const data = ledgerList.body.data;
    console.log(`Pagination info:`, JSON.stringify(data.pagination));
    console.log(`Fetched ledgers count: ${data.ledgers.length}`);

    if (data.ledgers.length > 0) {
      const sample = data.ledgers[0];
      console.log(`Sample Ledger Entry:`, {
        id: sample.id,
        userName: sample.userName,
        userMobile: sample.userMobile,
        userType: sample.userType,
        amount: sample.amount,
        type: sample.type,
        balanceBefore: sample.balanceBefore,
        balanceAfter: sample.balanceAfter,
        referenceType: sample.referenceType,
        referenceId: sample.referenceId,
        remarks: sample.remarks
      });

      // Assert masking of userMobile
      if (sample.userMobile && sample.userMobile !== '-') {
        if (sample.userMobile.startsWith('******') || sample.userMobile.includes('*')) {
          console.log(`✅ Mobile number is correctly masked: ${sample.userMobile}`);
        } else {
          console.error(`❌ Mobile number is NOT masked! Value: ${sample.userMobile}`);
          process.exit(1);
        }
      } else {
        console.log('No user mobile number present in sample to check masking.');
      }
    } else {
      console.log('No ledger entries available in the database.');
    }

    // Test search / query parameters
    console.log('\n--- Admin Wallet Ledger: Query with search parameter ---');
    const searchRes = await makeRequest('GET', '/api/wallet/admin/ledger?search=System&limit=2', adminHeaders);
    console.log(`Search status (Expected 200): ${searchRes.status}`);
    console.log(`Search entries count: ${searchRes.body.data.ledgers.length}`);

    console.log('\n✅ Admin Wallet Ledger APIs successfully verified!');
    process.exit(0);
  } catch (e) {
    console.error(`💥 Unexpected Error in tests:`, e);
    process.exit(1);
  }
}

runTests();
