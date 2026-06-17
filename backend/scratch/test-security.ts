import { prisma } from '../src/config/database';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

const BASE_URL = `http://localhost:${env.PORT}/api`;

async function runSecurityTests() {
  console.log('🤖 Starting Phase 1.3 Security Middleware Tests...\n');
  const results: { test: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

  const addResult = (test: string, status: 'PASS' | 'FAIL', details?: string) => {
    results.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test} ${details ? `(${details})` : ''}`);
  };

  const testEmail = 'secuser@example.com';
  const testMobile = '9999911111';
  const testPass = 'Password@123';
  let userToken = '';
  let adminToken = '';
  let userId = '';

  try {
    // 0. Cleanup and Prep Test User
    await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // Register test user (starts as role USER, status ACTIVE)
    const registerPayload = {
      name: 'Security Tester',
      mobile: testMobile,
      email: testEmail,
      password: testPass,
      confirmPassword: testPass,
      shopName: 'Tester Shop',
      aadhaarNumber: '111122223333',
      panNumber: 'ABCDE1111F',
      address: '123 Tech Lane',
      state: 'Karnataka',
      district: 'Bengaluru',
      pinCode: '560001',
      userType: 'DISTRIBUTOR',
    };

    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    });
    const regData = (await regRes.json()) as any;
    userId = regData.data.user.id;

    // Login to get USER token
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: testPass }),
    });
    const loginData = (await loginRes.json()) as any;
    userToken = loginData.data.accessToken;

    // 1. NO TOKEN REJECTED
    const noTokenRes = await fetch(`${BASE_URL}/test/protected`);
    const noTokenData = (await noTokenRes.json()) as any;
    if (noTokenRes.status === 401 && noTokenData.success === false && noTokenData.error.code === 'UNAUTHORIZED') {
      addResult('1. No Token Rejected', 'PASS');
    } else {
      addResult('1. No Token Rejected', 'FAIL', `Status: ${noTokenRes.status}`);
    }

    // 2. INVALID TOKEN REJECTED
    const badTokenRes = await fetch(`${BASE_URL}/test/protected`, {
      headers: { Authorization: 'Bearer InvalidTokenStringXYZ' },
    });
    const badTokenData = (await badTokenRes.json()) as any;
    if (badTokenRes.status === 401 && badTokenData.success === false && badTokenData.error.code === 'UNAUTHORIZED') {
      addResult('2. Invalid Token Rejected', 'PASS');
    } else {
      addResult('2. Invalid Token Rejected', 'FAIL', `Status: ${badTokenRes.status}`);
    }

    // 3. EXPIRED TOKEN REJECTED
    // Forge a signed but expired access token
    const expiredPayload = {
      id: userId,
      role: 'USER',
      userType: 'DISTRIBUTOR',
      status: 'ACTIVE',
      exp: Math.floor(Date.now() / 1000) - 60, // Expired 1 minute ago
    };
    const expiredToken = jwt.sign(expiredPayload, env.JWT_ACCESS_SECRET!);
    const expiredRes = await fetch(`${BASE_URL}/test/protected`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const expiredData = (await expiredRes.json()) as any;
    if (expiredRes.status === 401 && expiredData.success === false && expiredData.error.code === 'UNAUTHORIZED') {
      addResult('3. Expired Token Rejected', 'PASS');
    } else {
      addResult('3. Expired Token Rejected', 'FAIL', `Status: ${expiredRes.status}`);
    }

    // 4. USER ACCESS USER ROUTE
    const userRouteRes = await fetch(`${BASE_URL}/test/user`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userRouteData = (await userRouteRes.json()) as any;
    if (userRouteRes.status === 200 && userRouteData.success === true) {
      addResult('4. USER Access User Route', 'PASS');
    } else {
      addResult('4. USER Access User Route', 'FAIL', `Status: ${userRouteRes.status}`);
    }

    // 5. USER BLOCKED FROM ADMIN ROUTE
    const userAdminRes = await fetch(`${BASE_URL}/test/admin`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userAdminData = (await userAdminRes.json()) as any;
    if (userAdminRes.status === 403 && userAdminData.success === false && userAdminData.error.code === 'FORBIDDEN') {
      addResult('5. USER Blocked From Admin Route', 'PASS');
    } else {
      addResult('5. USER Blocked From Admin Route', 'FAIL', `Status: ${userAdminRes.status}`);
    }

    // Promote user to ADMIN in DB to test ADMIN routes
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    });

    // Re-login to get ADMIN token
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: testPass }),
    });
    const adminLoginData = (await adminLoginRes.json()) as any;
    adminToken = adminLoginData.data.accessToken;

    // 6. ADMIN ACCESS ADMIN ROUTE
    const adminRouteRes = await fetch(`${BASE_URL}/test/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminRouteData = (await adminRouteRes.json()) as any;
    if (adminRouteRes.status === 200 && adminRouteData.success === true) {
      addResult('6. ADMIN Access Admin Route', 'PASS');
    } else {
      addResult('6. ADMIN Access Admin Route', 'FAIL', `Status: ${adminRouteRes.status}`);
    }

    // 7. ADMIN ACCESS PROTECTED ROUTE
    const adminProtectedRes = await fetch(`${BASE_URL}/test/protected`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminProtectedData = (await adminProtectedRes.json()) as any;
    if (adminProtectedRes.status === 200 && adminProtectedData.success === true) {
      addResult('7. ADMIN Access Protected Route', 'PASS');
    } else {
      addResult('7. ADMIN Access Protected Route', 'FAIL', `Status: ${adminProtectedRes.status}`);
    }

    // 8. INACTIVE USER BLOCKED
    // Set status to INACTIVE in DB
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
    });

    // Request protected route using valid adminToken but user is now inactive
    // Note: authMiddleware extracts status from token payload. If the token payload was ACTIVE, activeUserMiddleware will see ACTIVE from token.
    // Wait! Let's think: does activeUserMiddleware check the token payload status or query DB?
    // "Middleware should not contain business logic. No direct Prisma queries inside role/auth/activeUser middleware."
    // So the middlewares read the data directly from the decoded token payload (`req.user.status`), not from the database!
    // Since the database status was changed to INACTIVE, we must generate a new token or verify that a token with status 'INACTIVE' is rejected.
    // Let's generate a token with status = 'INACTIVE' or log in to get a token with status 'INACTIVE'.
    // Wait! The login API blocks inactive users from logging in, so we cannot log in to get an INACTIVE token.
    // But we can forge a token with status = 'INACTIVE' signed with our secret to test the activeUserMiddleware!
    // Yes! Let's sign a token: `{ id: userId, role: 'ADMIN', userType: 'DISTRIBUTOR', status: 'INACTIVE' }`.
    const inactiveToken = jwt.sign(
      { id: userId, role: 'ADMIN', userType: 'DISTRIBUTOR', status: 'INACTIVE' },
      env.JWT_ACCESS_SECRET!
    );
    const inactiveRes = await fetch(`${BASE_URL}/test/protected`, {
      headers: { Authorization: `Bearer ${inactiveToken}` },
    });
    const inactiveData = (await inactiveRes.json()) as any;
    if (
      inactiveRes.status === 403 &&
      inactiveData.success === false &&
      inactiveData.error.code === 'FORBIDDEN' &&
      inactiveData.message === 'Account is inactive.'
    ) {
      addResult('8. Inactive User Blocked', 'PASS', 'Middleware blocks INACTIVE token status');
    } else {
      addResult('8. Inactive User Blocked', 'FAIL', `Status: ${inactiveRes.status}, Msg: ${inactiveData.message}`);
    }

    // Restore user status to ACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    // 9. LOGIN RATE LIMIT WORKS
    console.log('⏳ Triggering Rate Limiter (making 6 rapid login requests)...');
    let triggered = false;
    let limitResponseStatus = 0;

    for (let i = 0; i < 6; i++) {
      const rlRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testEmail, password: 'WrongPasswordForLimit' }),
      });
      if (rlRes.status === 429) {
        triggered = true;
        limitResponseStatus = 429;
        break;
      }
    }

    if (triggered && limitResponseStatus === 429) {
      addResult('9. Login Rate Limit Works', 'PASS', '6th login attempt returned 429 Too Many Requests');
    } else {
      addResult('9. Login Rate Limit Works', 'FAIL', 'Rate limiter did not return 429 after 6 requests');
    }

    // 10. REQ.USER ATTACHED PROPERLY
    // Use the active adminToken we have
    const reqUserRes = await fetch(`${BASE_URL}/test/protected`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reqUserData = (await reqUserRes.json()) as any;

    if (
      reqUserRes.status === 200 &&
      reqUserData.data.user &&
      reqUserData.data.user.id === userId &&
      reqUserData.data.user.role === 'ADMIN' &&
      reqUserData.data.user.status === 'ACTIVE'
    ) {
      addResult('10. req.user Attached Properly', 'PASS', 'Decoded JWT data matches attached req.user');
    } else {
      addResult('10. req.user Attached Properly', 'FAIL', `req.user mismatch: ${JSON.stringify(reqUserData.data?.user)}`);
    }

  } catch (error) {
    console.error('💥 Error during security tests:', error);
  } finally {
    // 11. Cleanup test user
    await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    console.log('\n🏁 Cleanup completed & prisma disconnected.');
  }
}

runSecurityTests();
