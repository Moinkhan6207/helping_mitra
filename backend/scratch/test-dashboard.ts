import { prisma } from '../src/config/database';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

const BASE_URL = `http://localhost:${env.PORT}/api/dashboard`;
const AUTH_URL = `http://localhost:${env.PORT}/api/auth`;

async function runDashboardTests() {
  console.log('🤖 Starting Phase 1.4 Dashboard Integration Tests...\n');
  const results: { test: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

  const addResult = (test: string, status: 'PASS' | 'FAIL', details?: string) => {
    results.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test} ${details ? `(${details})` : ''}`);
  };

  const testEmail = 'dashuser@example.com';
  const testMobile = '9999922222';
  const testPass = 'Password@123';
  let userToken = '';
  let adminToken = '';
  let userId = '';

  try {
    // 0. Cleanup and Prep Test User
    await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // Register a test user (creates USER role, ACTIVE status)
    const registerPayload = {
      name: 'Dashboard Tester',
      mobile: testMobile,
      email: testEmail,
      password: testPass,
      confirmPassword: testPass,
      shopName: 'Dashboard Tester Shop',
      aadhaarNumber: '222233334444',
      panNumber: 'ABCDE2222F',
      address: '456 Panel Row',
      state: 'Maharashtra',
      district: 'Mumbai',
      pinCode: '400001',
      userType: 'RETAILER',
    };

    const regRes = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    });
    const regData = (await regRes.json()) as any;
    userId = regData.data.user.id;

    // Login to get USER token (Attempt 1)
    const loginRes = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: testPass }),
    });
    const loginData = (await loginRes.json()) as any;
    userToken = loginData.data.accessToken;

    // 1. USER ACCESSES USER-SUMMARY (PASS)
    const userSummaryRes = await fetch(`${BASE_URL}/user-summary`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userSummaryData = (await userSummaryRes.json()) as any;

    if (
      userSummaryRes.status === 200 &&
      userSummaryData.success === true &&
      userSummaryData.data.walletBalance === 0 &&
      userSummaryData.data.totalOrders === 0
    ) {
      addResult('1. USER accesses user-summary', 'PASS', 'Allowed, returned placeholder summary');
    } else {
      addResult('1. USER accesses user-summary', 'FAIL', `Status: ${userSummaryRes.status}`);
    }

    // 2. USER ACCESSES ADMIN-SUMMARY (FAIL)
    const userAdminRes = await fetch(`${BASE_URL}/admin-summary`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userAdminData = (await userAdminRes.json()) as any;

    if (userAdminRes.status === 403 && userAdminData.success === false && userAdminData.error.code === 'FORBIDDEN') {
      addResult('2. USER accesses admin-summary', 'PASS', 'Rejected with 403 Forbidden as expected');
    } else {
      addResult('2. USER accesses admin-summary', 'FAIL', `Status: ${userAdminRes.status}`);
    }

    // Promote user to ADMIN in DB
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    });

    // Login to get ADMIN token (Attempt 2)
    // Note: This is attempt 2, so it is safely below the 5-attempt rate limit.
    const adminLoginRes = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: testPass }),
    });
    const adminLoginData = (await adminLoginRes.json()) as any;
    adminToken = adminLoginData.data.accessToken;

    // 3. ADMIN ACCESSES ADMIN-SUMMARY (PASS)
    const adminSummaryRes = await fetch(`${BASE_URL}/admin-summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminSummaryData = (await adminSummaryRes.json()) as any;

    if (
      adminSummaryRes.status === 200 &&
      adminSummaryData.success === true &&
      'totalUsers' in adminSummaryData.data &&
      'totalRetailers' in adminSummaryData.data &&
      adminSummaryData.data.totalOrders === 0
    ) {
      addResult(
        '3. ADMIN accesses admin-summary',
        'PASS',
        `Returned real counts (Retailers: ${adminSummaryData.data.totalRetailers})`
      );
    } else {
      addResult('3. ADMIN accesses admin-summary', 'FAIL', `Status: ${adminSummaryRes.status}`);
    }

    // 4. ADMIN ACCESSES USER-SUMMARY (FAIL)
    const adminUserRes = await fetch(`${BASE_URL}/user-summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminUserData = (await adminUserRes.json()) as any;

    if (adminUserRes.status === 403 && adminUserData.success === false && adminUserData.error.code === 'FORBIDDEN') {
      addResult('4. ADMIN accesses user-summary', 'PASS', 'Rejected with 403 Forbidden as expected');
    } else {
      addResult('4. ADMIN accesses user-summary', 'FAIL', `Status: ${adminUserRes.status}`);
    }

    // 5. NO TOKEN (FAIL)
    const noTokenRes = await fetch(`${BASE_URL}/user-summary`);
    const noTokenData = (await noTokenRes.json()) as any;

    if (noTokenRes.status === 401 && noTokenData.success === false && noTokenData.error.code === 'UNAUTHORIZED') {
      addResult('5. No token', 'PASS', 'Rejected with 401 Unauthorized');
    } else {
      addResult('5. No token', 'FAIL', `Status: ${noTokenRes.status}`);
    }

    // 6. INACTIVE USER (FAIL)
    // Forge an INACTIVE token status signed with our secret to test the status checker middleware
    const inactiveToken = jwt.sign(
      { id: userId, role: 'USER', userType: 'RETAILER', status: 'INACTIVE' },
      env.JWT_ACCESS_SECRET!
    );
    const inactiveRes = await fetch(`${BASE_URL}/user-summary`, {
      headers: { Authorization: `Bearer ${inactiveToken}` },
    });
    const inactiveData = (await inactiveRes.json()) as any;

    if (
      inactiveRes.status === 403 &&
      inactiveData.success === false &&
      inactiveData.error.code === 'FORBIDDEN' &&
      inactiveData.message === 'Account is inactive.'
    ) {
      addResult('6. Inactive user', 'PASS', 'Blocked with 403 and Account is inactive message');
    } else {
      addResult('6. Inactive user', 'FAIL', `Status: ${inactiveRes.status}, Message: ${inactiveData.message}`);
    }

  } catch (error) {
    console.error('💥 Error running dashboard tests:', error);
  } finally {
    // 7. Cleanup
    await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    console.log('\n🏁 Cleanup completed & prisma disconnected.');
  }
}

runDashboardTests();
