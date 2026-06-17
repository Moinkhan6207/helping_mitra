import { prisma } from '../src/config/database';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../src/config/env';
import { JWTPayload } from '../src/modules/auth/auth.types';

const BASE_URL = `http://localhost:${env.PORT}/api/auth`;

// Helper to hash token using SHA-256
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

async function runTests() {
  console.log('🤖 Starting Authentication Integration Tests...\n');
  const results: { test: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

  const addResult = (test: string, status: 'PASS' | 'FAIL', details?: string) => {
    results.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test} ${details ? `(${details})` : ''}`);
  };

  const testUserEmail = 'testuser@example.com';
  const testUserMobile = '9876543210';
  const testUserPassword = 'Password@123';

  try {
    // 0. Database Cleanup
    await prisma.refreshToken.deleteMany({
      where: { user: { email: testUserEmail } },
    });
    await prisma.user.deleteMany({
      where: { email: testUserEmail },
    });

    // ==========================================
    // 1. REGISTER USER
    // ==========================================
    const registerPayload = {
      name: 'Test Retailer',
      mobile: testUserMobile,
      email: testUserEmail,
      password: testUserPassword,
      confirmPassword: testUserPassword,
      shopName: 'Mitra Retail Shop',
      aadhaarNumber: '123456789012',
      panNumber: 'ABCDE1234F',
      address: '123 Test Street, Near Market',
      state: 'West Bengal',
      district: 'Kolkata',
      pinCode: '700001',
      userType: 'RETAILER',
      role: 'ADMIN', // Try to inject ADMIN role
    };

    const regResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    });

    const regData = (await regResponse.json()) as any;

    if (
      regResponse.status === 201 &&
      regData.success === true &&
      regData.data.user.role === 'USER' && // Verify injected ADMIN was ignored
      regData.data.user.status === 'ACTIVE'
    ) {
      addResult('1. Register User', 'PASS', 'Created USER role ignore injected ADMIN');
    } else {
      addResult('1. Register User', 'FAIL', `Status: ${regResponse.status}, Role: ${regData.data?.user?.role}`);
    }

    // ==========================================
    // 2. DUPLICATE EMAIL REJECTED
    // ==========================================
    const dupEmailPayload = {
      ...registerPayload,
      mobile: '9876543211', // Unique mobile
    };

    const dupEmailRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dupEmailPayload),
    });
    const dupEmailData = (await dupEmailRes.json()) as any;

    if (dupEmailRes.status === 409 && dupEmailData.success === false) {
      addResult('2. Duplicate Email Rejected', 'PASS');
    } else {
      addResult('2. Duplicate Email Rejected', 'FAIL', `Status: ${dupEmailRes.status}`);
    }

    // ==========================================
    // 3. DUPLICATE MOBILE REJECTED
    // ==========================================
    const dupMobilePayload = {
      ...registerPayload,
      email: 'testuser2@example.com', // Unique email
    };

    const dupMobileRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dupMobilePayload),
    });
    const dupMobileData = (await dupMobileRes.json()) as any;

    if (dupMobileRes.status === 409 && dupMobileData.success === false) {
      addResult('3. Duplicate Mobile Rejected', 'PASS');
    } else {
      addResult('3. Duplicate Mobile Rejected', 'FAIL', `Status: ${dupMobileRes.status}`);
    }

    // ==========================================
    // 4. LOGIN WITH MOBILE
    // ==========================================
    const loginMobileRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testUserMobile, password: testUserPassword }),
    });
    const loginMobileData = (await loginMobileRes.json()) as any;

    let accessToken = '';
    let refreshToken = '';

    if (loginMobileRes.status === 200 && loginMobileData.success === true) {
      accessToken = loginMobileData.data.accessToken;
      refreshToken = loginMobileData.data.refreshToken;
      addResult('4. Login with Mobile', 'PASS');
    } else {
      addResult('4. Login with Mobile', 'FAIL', `Status: ${loginMobileRes.status}`);
    }

    // ==========================================
    // 5. LOGIN WITH EMAIL
    // ==========================================
    const loginEmailRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testUserEmail, password: testUserPassword }),
    });
    const loginEmailData = (await loginEmailRes.json()) as any;

    if (loginEmailRes.status === 200 && loginEmailData.success === true) {
      addResult('5. Login with Email', 'PASS');
    } else {
      addResult('5. Login with Email', 'FAIL', `Status: ${loginEmailRes.status}`);
    }

    // ==========================================
    // 6. WRONG PASSWORD REJECTED
    // ==========================================
    const wrongPassRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testUserEmail, password: 'WrongPassword' }),
    });
    const wrongPassData = (await wrongPassRes.json()) as any;

    if (wrongPassRes.status === 401 && wrongPassData.success === false) {
      addResult('6. Wrong Password Rejected', 'PASS');
    } else {
      addResult('6. Wrong Password Rejected', 'FAIL', `Status: ${wrongPassRes.status}`);
    }

    // ==========================================
    // 7. INACTIVE USER BLOCKED
    // ==========================================
    // Manually deactivate user in DB
    await prisma.user.update({
      where: { email: testUserEmail },
      data: { status: 'INACTIVE' },
    });

    const inactiveLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testUserEmail, password: testUserPassword }),
    });
    const inactiveLoginData = (await inactiveLoginRes.json()) as any;

    if (inactiveLoginRes.status === 403 && inactiveLoginData.success === false) {
      addResult('7. Inactive User Blocked', 'PASS');
    } else {
      addResult('7. Inactive User Blocked', 'FAIL', `Status: ${inactiveLoginRes.status}`);
    }

    // Re-activate user
    await prisma.user.update({
      where: { email: testUserEmail },
      data: { status: 'ACTIVE' },
    });

    // Re-login to get fresh tokens
    const reloginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testUserEmail, password: testUserPassword }),
    });
    const reloginData = (await reloginRes.json()) as any;
    accessToken = reloginData.data.accessToken;
    refreshToken = reloginData.data.refreshToken;

    // ==========================================
    // 8. ACCESS TOKEN GENERATED & PROPERTIES
    // ==========================================
    const decoded = jwt.decode(accessToken) as JWTPayload;
    if (decoded && decoded.id && decoded.role === 'USER' && decoded.status === 'ACTIVE' && decoded.userType === 'RETAILER') {
      addResult('8. Access Token Generated', 'PASS', 'Contains id, role, userType, status');
    } else {
      addResult('8. Access Token Generated', 'FAIL', 'JWT payload missing properties');
    }

    // ==========================================
    // 9. REFRESH TOKEN GENERATED
    // ==========================================
    if (refreshToken && refreshToken.length > 30) {
      addResult('9. Refresh Token Generated', 'PASS', `Length: ${refreshToken.length}`);
    } else {
      addResult('9. Refresh Token Generated', 'FAIL');
    }

    // ==========================================
    // 10. REFRESH TOKEN STORED HASHED
    // ==========================================
    const hashed = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: hashed },
    });

    const storedRawToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: refreshToken },
    });

    if (storedToken && !storedRawToken) {
      addResult('10. Refresh Token Stored Hashed', 'PASS', 'Hashed correctly, raw token not stored');
    } else {
      addResult('10. Refresh Token Stored Hashed', 'FAIL', `Hashed matches: ${!!storedToken}, Raw matches: ${!!storedRawToken}`);
    }

    // ==========================================
    // 11. REFRESH TOKEN WORKS
    // ==========================================
    const refreshRes = await fetch(`${BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshData = (await refreshRes.json()) as any;

    if (refreshRes.status === 200 && refreshData.success === true && refreshData.data.accessToken) {
      addResult('11. Refresh Token Works', 'PASS');
    } else {
      addResult('11. Refresh Token Works', 'FAIL', `Status: ${refreshRes.status}`);
    }

    // ==========================================
    // 12. LOGOUT REVOKES TOKEN
    // ==========================================
    const logoutRes = await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const logoutData = (await logoutRes.json()) as any;

    const dbRevokedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: hashed },
    });

    if (logoutRes.status === 200 && logoutData.success === true && dbRevokedToken?.revokedAt !== null) {
      addResult('12. Logout Revokes Token', 'PASS', `revokedAt: ${dbRevokedToken?.revokedAt}`);
    } else {
      addResult('12. Logout Revokes Token', 'FAIL', `Status: ${logoutRes.status}`);
    }

    // ==========================================
    // 13. REVOKED TOKEN REJECTED
    // ==========================================
    const badRefreshRes = await fetch(`${BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const badRefreshData = (await badRefreshRes.json()) as any;

    if (badRefreshRes.status === 401 && badRefreshData.success === false) {
      addResult('13. Revoked Token Rejected', 'PASS');
    } else {
      addResult('13. Revoked Token Rejected', 'FAIL', `Status: ${badRefreshRes.status}`);
    }

    // We reuse the accessToken from the 5th login (which is still active/valid for /me check)
    // No 6th login request is made to prevent hitting the 5-attempt login rate limiter.

    // ==========================================
    // 14. GET /auth/me WORKS
    // ==========================================
    const meRes = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meData = (await meRes.json()) as any;

    if (meRes.status === 200 && meData.success === true && meData.data.user.email === testUserEmail) {
      addResult('14. GET /auth/me Works', 'PASS');
    } else {
      addResult('14. GET /auth/me Works', 'FAIL', `Status: ${meRes.status}`);
    }

    // ==========================================
    // 15. SENSITIVE FIELDS HIDDEN
    // ==========================================
    // Check fields in register, login, me responses
    const allUserPayloads = [regData.data.user, reloginData.data.user, meData.data.user];
    let PIIExposed = false;

    for (const u of allUserPayloads) {
      if (
        'password' in u ||
        'passwordHash' in u ||
        'aadhaarNumber' in u ||
        'panNumber' in u ||
        'refreshTokenHash' in u ||
        'tokenHash' in u
      ) {
        PIIExposed = true;
        break;
      }
    }

    if (!PIIExposed) {
      addResult('15. Sensitive Fields Hidden', 'PASS', 'No passwordHash, aadhaarNumber, or panNumber returned');
    } else {
      addResult('15. Sensitive Fields Hidden', 'FAIL', 'Found sensitive properties in user responses');
    }

  } catch (error) {
    console.error('💥 Error running integration tests:', error);
  } finally {
    // Cleanup test user
    await prisma.refreshToken.deleteMany({
      where: { user: { email: testUserEmail } },
    });
    await prisma.user.deleteMany({
      where: { email: testUserEmail },
    });
    await prisma.$disconnect();
    console.log('\n🏁 Seeding cleanup completed & prisma disconnected.');
  }
}

runTests();
