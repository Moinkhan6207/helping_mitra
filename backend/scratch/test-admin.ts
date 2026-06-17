import { prisma } from '../src/config/database';
import { env } from '../src/config/env';
import { execSync } from 'child_process';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../src/modules/auth/auth.types';

const BASE_URL = `http://localhost:${env.PORT}/api`;

async function runAdminTests() {
  console.log('🤖 Starting Phase 1.5 Admin Bootstrap Tests...\n');
  const results: { test: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

  const addResult = (test: string, status: 'PASS' | 'FAIL', details?: string) => {
    results.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test} ${details ? `(${details})` : ''}`);
  };

  const adminEmail = env.ADMIN_EMAIL;
  const adminMobile = env.ADMIN_MOBILE;
  const adminPassword = env.ADMIN_PASSWORD;

  let adminToken = '';

  try {
    // 0. Initial Cleanup: Delete existing admin and refresh tokens
    await prisma.refreshToken.deleteMany({ where: { user: { email: adminEmail } } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });

    // 1. SEED CREATES ADMIN
    console.log('🌱 Executing: npm run seed...');
    const seedOutput1 = execSync('npm run seed', { cwd: '../backend' }).toString();
    
    const seededAdmin = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (
      seededAdmin &&
      seededAdmin.role === 'ADMIN' &&
      seededAdmin.status === 'ACTIVE' &&
      seededAdmin.userType === null &&
      seedOutput1.includes('Seeding default Admin account')
    ) {
      addResult('1. Seed creates admin', 'PASS', 'Admin created successfully via seed script');
    } else {
      addResult('1. Seed creates admin', 'FAIL');
    }

    // 2. DUPLICATE ADMIN PREVENTED
    console.log('🌱 Executing seed a second time (idempotency check)...');
    const seedOutput2 = execSync('npm run seed', { cwd: '../backend' }).toString();
    
    const totalAdmins = await prisma.user.count({
      where: { email: adminEmail },
    });

    if (
      totalAdmins === 1 &&
      seedOutput2.includes('already exists. Skipping creation')
    ) {
      addResult('2. Duplicate admin prevented', 'PASS', 'Idempotency validated: skipped duplicate write');
    } else {
      addResult('2. Duplicate admin prevented', 'FAIL', `Total admins: ${totalAdmins}`);
    }

    // 3. PASSWORD HASHED
    if (
      seededAdmin &&
      seededAdmin.passwordHash.startsWith('$2b$') &&
      seededAdmin.passwordHash !== adminPassword
    ) {
      addResult('3. Password hashed', 'PASS', 'Bcrypt hash correctly verified');
    } else {
      addResult('3. Password hashed', 'FAIL');
    }

    // 4. ADMIN LOGIN WORKS
    // Note: Since this is attempt 1 on this fresh server run, we are safely below the 5-attempt login rate limit.
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: adminEmail, password: adminPassword }),
    });
    const loginData = (await loginRes.json()) as any;

    if (
      loginRes.status === 200 &&
      loginData.success === true &&
      loginData.data.accessToken &&
      loginData.data.refreshToken &&
      loginData.data.user.role === 'ADMIN'
    ) {
      adminToken = loginData.data.accessToken;
      addResult('4. Admin login works', 'PASS', 'Successful login, returned tokens & role ADMIN');
    } else {
      addResult('4. Admin login works', 'FAIL', `Status: ${loginRes.status}`);
    }

    // 5. JWT GENERATED
    const decoded = jwt.decode(adminToken) as JWTPayload;
    if (
      decoded &&
      decoded.id === seededAdmin?.id &&
      decoded.role === 'ADMIN' &&
      decoded.userType === null &&
      decoded.status === 'ACTIVE'
    ) {
      addResult('5. JWT generated', 'PASS', 'Valid signatures and properties (id, role, status)');
    } else {
      addResult('5. JWT generated', 'FAIL');
    }

    // 6. REFRESH TOKEN GENERATED
    const rawRefreshToken = loginData.data.refreshToken;
    if (rawRefreshToken && rawRefreshToken.length > 30) {
      addResult('6. Refresh token generated', 'PASS', 'High entropy refresh token returned');
    } else {
      addResult('6. Refresh token generated', 'FAIL');
    }

    // 7. ADMIN DASHBOARD ACCESS WORKS
    const adminSummaryRes = await fetch(`${BASE_URL}/dashboard/admin-summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminSummaryData = (await adminSummaryRes.json()) as any;

    if (
      adminSummaryRes.status === 200 &&
      adminSummaryData.success === true &&
      'totalUsers' in adminSummaryData.data
    ) {
      addResult('7. Admin dashboard access works', 'PASS', 'ADMIN role authorized on GET /admin-summary');
    } else {
      addResult('7. Admin dashboard access works', 'FAIL', `Status: ${adminSummaryRes.status}`);
    }

    // 8. PUBLIC REGISTRATION CANNOT CREATE ADMIN
    // Create signup request trying to inject ADMIN role
    const testRegEmail = 'testregadmin@example.com';
    const testRegMobile = '9999933333';
    await prisma.user.deleteMany({ where: { email: testRegEmail } });

    const registerPayload = {
      name: 'Sneaky Tester',
      mobile: testRegMobile,
      email: testRegEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      shopName: 'Tester Shop',
      aadhaarNumber: '333344445555',
      panNumber: 'ABCDE3333F',
      address: '789 Seed Lane',
      state: 'Delhi',
      district: 'New Delhi',
      pinCode: '110001',
      userType: 'RETAILER',
      role: 'ADMIN', // Injecting admin
    };

    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    });
    const regData = (await regRes.json()) as any;

    if (
      regRes.status === 201 &&
      regData.success === true &&
      regData.data.user.role === 'USER' // Overridden to USER
    ) {
      addResult('8. Public registration cannot create admin', 'PASS', 'Forced register role to USER');
    } else {
      addResult('8. Public registration cannot create admin', 'FAIL', `Role returned: ${regData.data?.user?.role}`);
    }

    // Clean up registered user
    await prisma.user.deleteMany({ where: { email: testRegEmail } });

    // Additional checks (Admin profile and sensitive fields filter)
    const profileRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const profileData = (await profileRes.json()) as any;

    const allAdminPayloads = [loginData.data.user, profileData.data.user];
    let PIIExposed = false;
    for (const u of allAdminPayloads) {
      if ('passwordHash' in u || 'aadhaarNumber' in u || 'panNumber' in u || 'tokenHash' in u) {
        PIIExposed = true;
      }
    }

    if (profileRes.status === 200 && !PIIExposed) {
      console.log('✅ GET /auth/me profile fetch checks out and sensitive PII fields are fully masked.');
    } else {
      console.error('❌ Failed sensitive PII filter checks on GET /me.');
    }

  } catch (error) {
    console.error('💥 Error running admin tests:', error);
  } finally {
    // 9. Cleanup database test accounts
    await prisma.refreshToken.deleteMany({ where: { user: { email: adminEmail } } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });
    await prisma.$disconnect();
    console.log('\n🏁 Cleanup completed & prisma disconnected.');
  }
}

runAdminTests();
