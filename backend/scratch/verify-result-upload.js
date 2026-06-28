/**
 * verify-result-upload.js
 * Phase 5 – Module 7: Secure Result File Upload, Storage & Download System
 *
 * Preconditions:
 *   • Backend running at http://localhost:3001
 *   • Database seeded with at least one admin and one user
 *   • An order in PROCESSING status with resultTypeSnapshot = 'FILE_UPLOAD' must exist
 *     (run verify-result-delivery.js tests first to create one in PROCESSING)
 *
 * Run:
 *   node scratch/verify-result-upload.js
 */

const http = require('http');
const https = require('https');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001';

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function request(method, url, body, token, isFormData = false) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      },
    };

    const req = (parsed.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (isFormData && body) {
      body.pipe(req);
    } else if (body) {
      req.write(JSON.stringify(body));
      req.end();
    } else {
      req.end();
    }
  });
}

async function login(email, password) {
  const res = await request('POST', `${BASE_URL}/api/auth/login`, { email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  return res.body.data.token;
}

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg) { console.error(`  ❌ FAIL: ${msg}`); process.exitCode = 1; }
function section(title) { console.log(`\n─── ${title} ───`); }

// ─── Setup: Ensure admin and processing order exist ────────────────────────────

async function ensureTestData() {
  // Upsert admin user
  const adminEmail = 'admin@helpingmitra.com';
  const adminPw = 'Admin@1234';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: adminEmail,
        mobile: '9000000001',
        passwordHash: bcrypt.hashSync(adminPw, 10),
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log('  Created admin user.');
  }

  // Find a PROCESSING order with FILE_UPLOAD result type, or create one
  let order = await prisma.order.findFirst({
    where: { orderStatus: 'PROCESSING', resultTypeSnapshot: 'FILE_UPLOAD' },
  });

  if (!order) {
    console.log('  No FILE_UPLOAD PROCESSING order found. Creating one...');

    // Find or create a regular user
    let user = await prisma.user.findFirst({ where: { role: 'USER' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Test Customer',
          email: 'customer_upload_test@test.com',
          mobile: '9000000099',
          passwordHash: bcrypt.hashSync('Pass@1234', 10),
          role: 'USER',
          status: 'ACTIVE',
          userType: 'RETAILER',
        },
      });
    }

    // Find or create a service
    let service = await prisma.service.findFirst({ where: { status: 'ACTIVE' } });
    if (!service) {
      const category = await prisma.serviceCategory.create({
        data: { name: 'Test Category', description: 'Test', status: 'ACTIVE' },
      });
      service = await prisma.service.create({
        data: {
          name: 'Upload Test Service',
          description: 'For testing',
          mrp: 100,
          categoryId: category.id,
          status: 'ACTIVE',
          resultType: 'FILE_UPLOAD',
          resultLabel: 'Certificate',
        },
      });
    }

    // Create a wallet for user
    await prisma.wallet.upsert({
      where: { userId: user.id },
      create: { userId: user.id, balance: 50000 },
      update: { balance: 50000 },
    });

    order = await prisma.order.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        categoryNameSnapshot: 'Test Category',
        orderAmountPaise: 10000,
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        idempotencyKey: `upload-test-${Date.now()}`,
        orderStatus: 'PROCESSING',
        assignedAdminId: admin.id,
        assignedAt: new Date(),
        assignedByAdminId: admin.id,
        resultTypeSnapshot: 'FILE_UPLOAD',
        resultLabelSnapshot: 'Certificate',
        processingStartedAt: new Date(),
        processingStartedByAdminId: admin.id,
      },
    });

    console.log(`  Created PROCESSING FILE_UPLOAD order: ${order.orderNumber}`);
  } else {
    // Ensure assigned to our admin
    if (order.assignedAdminId !== admin.id) {
      order = await prisma.order.update({
        where: { id: order.id },
        data: { assignedAdminId: admin.id, assignedAt: new Date(), assignedByAdminId: admin.id },
      });
    }
    console.log(`  Found existing PROCESSING FILE_UPLOAD order: ${order.orderNumber}`);
  }

  return { admin, adminPw: adminPw, orderId: order.id };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('=== Phase 5 Module 7: Result File Upload & Access Tests ===');

  const { adminPw, orderId } = await ensureTestData();
  const adminToken = await login('admin@helpingmitra.com', adminPw);

  // ── Test 1: Upload with blocked extension (.exe) ──
  section('Test 1: Blocked Extension Rejection');
  {
    const form = new FormData();
    // Simulate a fake .exe file
    form.append('file', Buffer.from('MZ fake exe content'), {
      filename: 'malware.exe',
      contentType: 'application/octet-stream',
    });
    const res = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: `/api/admin/orders/${orderId}/result/upload`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          ...form.getHeaders(),
        },
      }, (resp) => {
        let data = '';
        resp.on('data', (c) => (data += c));
        resp.on('end', () => resolve({ status: resp.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      form.pipe(req);
    });
    if (res.status === 400 && res.body.success === false) {
      pass(`Blocked .exe → 400: ${res.body.message}`);
    } else {
      fail(`Expected 400 for .exe upload. Got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  }

  // ── Test 2: Upload with valid PDF ──
  section('Test 2: Valid PDF Upload');
  {
    const form = new FormData();
    form.append('file', Buffer.from('%PDF-1.4 fake pdf content for testing'), {
      filename: 'test_result.pdf',
      contentType: 'application/pdf',
    });
    const res = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: `/api/admin/orders/${orderId}/result/upload`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          ...form.getHeaders(),
        },
      }, (resp) => {
        let data = '';
        resp.on('data', (c) => (data += c));
        resp.on('end', () => resolve({ status: resp.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      form.pipe(req);
    });
    if (res.status === 200 && res.body.data?.fileName && res.body.data?.storagePath) {
      pass(`PDF uploaded successfully: ${res.body.data.fileName} → ${res.body.data.storagePath}`);
      pass(`isReplacement: ${res.body.data.isReplacement}`);
    } else {
      fail(`PDF upload failed. Got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  }

  // ── Test 3: Audit log created for RESULT_FILE_UPLOADED ──
  section('Test 3: Audit Log for RESULT_FILE_UPLOADED');
  {
    const log = await prisma.orderAuditLog.findFirst({
      where: { orderId, action: { in: ['RESULT_FILE_UPLOADED', 'RESULT_FILE_REPLACED'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (log) {
      pass(`Audit log created: action=${log.action}, remarks="${log.remarks}"`);
    } else {
      fail('No RESULT_FILE_UPLOADED audit log found.');
    }
  }

  // ── Test 4: Replace file (second upload) ──
  section('Test 4: File Replacement');
  {
    const form = new FormData();
    form.append('file', Buffer.from('PNG fake replacement image'), {
      filename: 'replacement.png',
      contentType: 'image/png',
    });
    const res = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: `/api/admin/orders/${orderId}/result/upload`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          ...form.getHeaders(),
        },
      }, (resp) => {
        let data = '';
        resp.on('data', (c) => (data += c));
        resp.on('end', () => resolve({ status: resp.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      form.pipe(req);
    });
    if (res.status === 200 && res.body.data?.isReplacement === true) {
      pass(`File replaced: ${res.body.data.fileName}`);
    } else {
      fail(`Replacement upload failed. Got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  }

  // ── Test 5: RESULT_FILE_REPLACED audit log ──
  section('Test 5: Audit Log for RESULT_FILE_REPLACED');
  {
    const log = await prisma.orderAuditLog.findFirst({
      where: { orderId, action: 'RESULT_FILE_REPLACED' },
      orderBy: { createdAt: 'desc' },
    });
    if (log) {
      pass(`RESULT_FILE_REPLACED audit log created: "${log.remarks}"`);
    } else {
      fail('No RESULT_FILE_REPLACED audit log found.');
    }
  }

  // ── Test 6: Request VIEW signed URL ──
  section('Test 6: Signed URL for VIEW access');
  {
    const res = await request('POST', `${BASE_URL}/api/admin/orders/${orderId}/result/access`, { action: 'VIEW' }, adminToken);
    if (res.status === 200 && res.body.data?.signedUrl) {
      pass(`VIEW signed URL generated: ${res.body.data.signedUrl.substring(0, 80)}...`);
    } else {
      fail(`VIEW access failed. Got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  }

  // ── Test 7: RESULT_FILE_VIEWED audit log ──
  section('Test 7: Audit Log for RESULT_FILE_VIEWED');
  {
    const log = await prisma.orderAuditLog.findFirst({
      where: { orderId, action: 'RESULT_FILE_VIEWED' },
      orderBy: { createdAt: 'desc' },
    });
    if (log) {
      pass(`RESULT_FILE_VIEWED audit log created: "${log.remarks}"`);
    } else {
      fail('No RESULT_FILE_VIEWED audit log found.');
    }
  }

  // ── Test 8: Request DOWNLOAD signed URL ──
  section('Test 8: Signed URL for DOWNLOAD access');
  {
    const res = await request('POST', `${BASE_URL}/api/admin/orders/${orderId}/result/access`, { action: 'DOWNLOAD' }, adminToken);
    if (res.status === 200 && res.body.data?.signedUrl) {
      pass(`DOWNLOAD signed URL generated: ${res.body.data.signedUrl.substring(0, 80)}...`);
    } else {
      fail(`DOWNLOAD access failed. Got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  }

  // ── Test 9: RESULT_FILE_DOWNLOADED audit log ──
  section('Test 9: Audit Log for RESULT_FILE_DOWNLOADED');
  {
    const log = await prisma.orderAuditLog.findFirst({
      where: { orderId, action: 'RESULT_FILE_DOWNLOADED' },
      orderBy: { createdAt: 'desc' },
    });
    if (log) {
      pass(`RESULT_FILE_DOWNLOADED audit log created: "${log.remarks}"`);
    } else {
      fail('No RESULT_FILE_DOWNLOADED audit log found.');
    }
  }

  // ── Test 10: Non-assigned admin blocked ──
  section('Test 10: Non-assigned Admin Authorization Guard');
  {
    // Create a second admin
    let otherAdmin = await prisma.user.findUnique({ where: { email: 'other_admin_upload@test.com' } });
    if (!otherAdmin) {
      otherAdmin = await prisma.user.create({
        data: {
          name: 'Other Admin',
          email: 'other_admin_upload@test.com',
          mobile: '9000000088',
          passwordHash: bcrypt.hashSync('Admin@1234', 10),
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }
    const otherToken = await login('other_admin_upload@test.com', 'Admin@1234');

    const form = new FormData();
    form.append('file', Buffer.from('%PDF-1.4 another pdf'), {
      filename: 'unauthorized.pdf',
      contentType: 'application/pdf',
    });
    const res = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: `/api/admin/orders/${orderId}/result/upload`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherToken}`,
          ...form.getHeaders(),
        },
      }, (resp) => {
        let data = '';
        resp.on('data', (c) => (data += c));
        resp.on('end', () => resolve({ status: resp.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      form.pipe(req);
    });
    if (res.status === 403) {
      pass(`Non-assigned admin blocked with 403.`);
    } else {
      fail(`Expected 403. Got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  }

  console.log('\n=== All Module 7 Verification Tests Complete ===');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
