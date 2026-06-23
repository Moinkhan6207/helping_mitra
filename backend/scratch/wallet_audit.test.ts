import { prisma } from '../src/config/database';
import { walletService } from '../src/modules/wallet/wallet.service';
import { RechargeStatus, RechargeAuditAction, WalletLedgerType, WalletReferenceType } from '@prisma/client';
import bcrypt from 'bcrypt';

async function runTests() {
  console.log('🧪 STARTING WALLET & RECHARGE SECURITY AUDIT SUITE...');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(` ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  // 1. Setup Test Users (Admin and standard User)
  const timestamp = Date.now();
  const testUserEmail = `user_${timestamp}@test.com`;
  const testUserMobile = `9${String(timestamp).slice(-9)}`;
  const testAdminEmail = `admin_${timestamp}@test.com`;
  const testAdminMobile = `8${String(timestamp).slice(-9)}`;
  const passwordHash = await bcrypt.hash('TestPassword123', 10);

  const user = await prisma.user.create({
    data: {
      name: 'Audit Test User',
      email: testUserEmail,
      mobile: testUserMobile,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      userType: 'RETAILER',
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Audit Test Admin',
      email: testAdminEmail,
      mobile: testAdminMobile,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Ensure user wallet exists
  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      balancePaise: 10000, // Starts with ₹100
    },
  });

  console.log(`Initialized Test User ID: ${user.id}, Admin ID: ${admin.id}`);

  try {
    // ==========================================
    // TASK 1: END TO END FLOW VALIDATION
    // ==========================================
    console.log('\n--- TASK 1: End-to-End Flow Validation ---');
    
    // Step A: Create recharge request
    const rechargeResult = await walletService.createRechargeRequest(user.id, 50000); // ₹500
    const recharge = rechargeResult.recharge;
    assert(recharge.status === RechargeStatus.CREATED, 'Recharge created with CREATED status');
    assert(recharge.requestedAmountPaise === 50000, 'Recharge requested amount is 50000 paise (₹500)');

    // Check Audit Log
    let auditLogs = await prisma.rechargeAuditLog.findMany({ where: { rechargeId: recharge.id } });
    assert(auditLogs.length === 1 && auditLogs[0].action === RechargeAuditAction.RECHARGE_CREATED, 'Audit log created for RECHARGE_CREATED');

    // Step B: Mark Payment Initiated
    const initiated = await walletService.markPaymentInitiated(user.id, recharge.id);
    assert(initiated.status === RechargeStatus.PAYMENT_INITIATED, 'Recharge transitioned to PAYMENT_INITIATED');

    auditLogs = await prisma.rechargeAuditLog.findMany({ where: { rechargeId: recharge.id } });
    assert(auditLogs.some(log => log.action === RechargeAuditAction.PAYMENT_INITIATED), 'Audit log created for PAYMENT_INITIATED');

    // Step C: Submit UTR Verification
    const testUtr = `UTR${timestamp}X`;
    const submitted = await walletService.submitRechargeVerification(user.id, recharge.id, testUtr, 'proofs/screenshot.png');
    assert(submitted.recharge.status === RechargeStatus.VERIFICATION_PENDING, 'Recharge transitioned to VERIFICATION_PENDING');

    // Verify raw UTR masked in getRechargeDetails but present in DB
    const userDetails = await walletService.getRechargeDetails(user.id, recharge.id);
    assert(userDetails.submissions[0].utr.startsWith('*'), 'UTR is masked for user details response');
    
    const dbSub = await prisma.rechargeVerificationSubmission.findFirst({ where: { rechargeId: recharge.id } });
    assert(dbSub?.utr === testUtr, 'Raw UTR is stored securely in the database');

    auditLogs = await prisma.rechargeAuditLog.findMany({ where: { rechargeId: recharge.id } });
    assert(auditLogs.some(log => log.action === RechargeAuditAction.VERIFICATION_SUBMITTED), 'Audit log created for VERIFICATION_SUBMITTED');

    // Step D: Admin claims review (UNDER_REVIEW)
    const claimed = await walletService.startRechargeReview(admin.id, recharge.id);
    assert(claimed.status === RechargeStatus.UNDER_REVIEW, 'Recharge transitioned to UNDER_REVIEW');
    assert(claimed.reviewStartedByAdminId === admin.id, 'Reviewer assigned to admin ID');

    auditLogs = await prisma.rechargeAuditLog.findMany({ where: { rechargeId: recharge.id } });
    assert(auditLogs.some(log => log.action === RechargeAuditAction.REVIEW_STARTED), 'Audit log created for REVIEW_STARTED');

    // Step E: Admin approves recharge
    const initialBalance = (await prisma.wallet.findUnique({ where: { userId: user.id } }))?.balancePaise ?? 0;
    
    const approved = await walletService.approveRechargeRequest(admin.id, recharge.id, {
      verifiedAmountPaise: 50000,
      paymentDate: new Date().toISOString(),
      receivingAccountId: 'MAIN_UPI_ACC',
      adminRemarks: 'Approved E2E Flow',
    });

    assert(approved.recharge.status === RechargeStatus.BALANCE_CREDITED, 'Recharge transitioned to BALANCE_CREDITED');
    
    // Check wallet balance update
    const finalBalance = (await prisma.wallet.findUnique({ where: { userId: user.id } }))?.balancePaise ?? 0;
    assert(finalBalance === initialBalance + 50000, 'Wallet balance credited with verified amount (₹500)');

    // Check Ledger credit
    const ledger = await prisma.walletLedger.findUnique({
      where: {
        referenceType_referenceId_type: {
          referenceType: WalletReferenceType.RECHARGE,
          referenceId: recharge.id,
          type: WalletLedgerType.CREDIT,
        }
      }
    });
    assert(ledger !== null && ledger.amountPaise === 50000, 'Exactly one CREDIT ledger entry recorded for this recharge');

    auditLogs = await prisma.rechargeAuditLog.findMany({ where: { rechargeId: recharge.id } });
    assert(auditLogs.some(log => log.action === RechargeAuditAction.APPROVED), 'Audit log created for APPROVED');


    // ==========================================
    // TASK 2: STATUS TRANSITION AUDIT
    // ==========================================
    console.log('\n--- TASK 2: Status Transition Audit ---');
    
    // Create new recharge request
    const r2 = (await walletService.createRechargeRequest(user.id, 10000)).recharge; // starts CREATED

    // CREATED -> VERIFICATION_PENDING direct submission (MUST FAIL)
    try {
      await walletService.submitRechargeVerification(user.id, r2.id, `UTR${timestamp}A`);
      assert(false, 'Allowed invalid transition CREATED -> VERIFICATION_PENDING directly');
    } catch (err: any) {
      assert(err.message.includes('Cannot submit verification'), 'Blocked invalid transition CREATED -> VERIFICATION_PENDING directly');
    }

    // CREATED -> UNDER_REVIEW (MUST FAIL)
    try {
      await walletService.startRechargeReview(admin.id, r2.id);
      assert(false, 'Allowed invalid transition CREATED -> UNDER_REVIEW');
    } catch (err: any) {
      assert(err.message.includes('VERIFICATION_PENDING is required'), 'Blocked invalid transition CREATED -> UNDER_REVIEW');
    }

    // CREATED -> BALANCE_CREDITED (MUST FAIL)
    try {
      await walletService.approveRechargeRequest(admin.id, r2.id, {
        verifiedAmountPaise: 10000,
        paymentDate: new Date().toISOString(),
        receivingAccountId: 'ACC',
      });
      assert(false, 'Allowed invalid transition CREATED -> BALANCE_CREDITED');
    } catch (err: any) {
      assert(err.message.includes('Cannot approve recharge request'), 'Blocked invalid transition CREATED -> BALANCE_CREDITED');
    }

    // Transition to PAYMENT_INITIATED
    await walletService.markPaymentInitiated(user.id, r2.id);

    // PAYMENT_INITIATED -> UNDER_REVIEW (MUST FAIL)
    try {
      await walletService.startRechargeReview(admin.id, r2.id);
      assert(false, 'Allowed invalid transition PAYMENT_INITIATED -> UNDER_REVIEW');
    } catch (err: any) {
      assert(err.message.includes('VERIFICATION_PENDING is required'), 'Blocked invalid transition PAYMENT_INITIATED -> UNDER_REVIEW');
    }

    // PAYMENT_INITIATED -> VERIFICATION_PENDING (MUST SUCCEED)
    await walletService.submitRechargeVerification(user.id, r2.id, `UTR${timestamp}B`);
    assert(true, 'Allowed valid transition PAYMENT_INITIATED -> VERIFICATION_PENDING');

    // VERIFICATION_PENDING -> UNDER_REVIEW (MUST SUCCEED)
    await walletService.startRechargeReview(admin.id, r2.id);
    assert(true, 'Allowed valid transition VERIFICATION_PENDING -> UNDER_REVIEW');

    // UNDER_REVIEW -> REJECTED (MUST SUCCEED)
    await walletService.rejectRechargeRequest(admin.id, r2.id, 'Rejecting for testing transitions');
    const r2Rejected = await prisma.walletRecharge.findUnique({ where: { id: r2.id } });
    assert(r2Rejected?.status === RechargeStatus.REJECTED, 'Allowed valid transition UNDER_REVIEW -> REJECTED');

    // REJECTED -> VERIFICATION_PENDING (MUST SUCCEED via resubmit)
    const resubmitted = await walletService.resubmitRechargeVerification(user.id, r2.id, {
      utr: `UTR${timestamp}C`,
    });
    assert(resubmitted.recharge.status === RechargeStatus.VERIFICATION_PENDING, 'Allowed valid transition REJECTED -> VERIFICATION_PENDING');


    // ==========================================
    // TASK 3: FINANCIAL INTEGRITY AUDIT
    // ==========================================
    console.log('\n--- TASK 3: Financial Integrity Audit ---');
    // Ensure that for the approved recharge r1, there is exactly one wallet balance increase,
    // exactly one ledger entry, exactly one audit entry of action APPROVED.
    const rechargeCount = await prisma.walletRecharge.count({ where: { id: recharge.id } });
    const ledgerCount = await prisma.walletLedger.count({ where: { referenceId: recharge.id, type: WalletLedgerType.CREDIT } });
    const submissionCount = await prisma.rechargeVerificationSubmission.count({ where: { rechargeId: recharge.id } });
    
    assert(rechargeCount === 1, 'Exactly one Recharge Request record exists');
    assert(ledgerCount === 1, 'Exactly one Wallet Credit Ledger record exists');
    assert(submissionCount === 1, 'Exactly one Verification Submission record exists');


    // ==========================================
    // TASK 4: DUPLICATE APPROVAL TEST (CONCURRENCY)
    // ==========================================
    console.log('\n--- TASK 4: Duplicate Approval Test (Concurrency) ---');
    // Create new recharge, initiate payment, submit verification
    const r3 = (await walletService.createRechargeRequest(user.id, 100000)).recharge; // ₹1000
    await walletService.markPaymentInitiated(user.id, r3.id);
    await walletService.submitRechargeVerification(user.id, r3.id, `UTR${timestamp}D`);

    const balanceBeforeConcurrent = (await prisma.wallet.findUnique({ where: { userId: user.id } }))?.balancePaise ?? 0;

    // Simulate concurrent approvals using Promise.all
    console.log('Sending two concurrent approval requests for same recharge...');
    const approvalPromises = Promise.all([
      walletService.approveRechargeRequest(admin.id, r3.id, {
        verifiedAmountPaise: 100000,
        paymentDate: new Date().toISOString(),
        receivingAccountId: 'CONCURRENCY_TEST',
        adminRemarks: 'Admin 1 approval',
      }),
      walletService.approveRechargeRequest(admin.id, r3.id, {
        verifiedAmountPaise: 100000,
        paymentDate: new Date().toISOString(),
        receivingAccountId: 'CONCURRENCY_TEST',
        adminRemarks: 'Admin 2 approval',
      })
    ]);

    const results = await approvalPromises;
    
    // Analyze results: one must succeed, and the other must return early idempotently or fail.
    // Check wallet balance
    const balanceAfterConcurrent = (await prisma.wallet.findUnique({ where: { userId: user.id } }))?.balancePaise ?? 0;
    assert(balanceAfterConcurrent === balanceBeforeConcurrent + 100000, 'Wallet credited exactly once (₹1000) under concurrent approval pressure');

    const totalLedgersForR3 = await prisma.walletLedger.count({
      where: { referenceId: r3.id, type: WalletLedgerType.CREDIT }
    });
    assert(totalLedgersForR3 === 1, 'Exactly one ledger record was created for concurrent approval request');

    // Confirm that the status in both returned objects is BALANCE_CREDITED
    assert(
      results[0].recharge.status === RechargeStatus.BALANCE_CREDITED &&
      results[1].recharge.status === RechargeStatus.BALANCE_CREDITED,
      'Both concurrent approval requests resolved to BALANCE_CREDITED safely (one was credited, one was skipped/idempotent)'
    );


    // ==========================================
    // TASK 6: AUTHORIZATION AUDIT
    // ==========================================
    console.log('\n--- TASK 6: Authorization Audit ---');
    // Non-ownership verification block: try to access r3 details using another user ID (non-existent or different)
    try {
      await walletService.getRechargeDetails('different_user_id', r3.id);
      assert(false, 'Allowed cross-user recharge details lookup');
    } catch (err: any) {
      assert(err.message.includes('not found'), 'Blocked cross-user recharge details lookup');
    }

    try {
      await walletService.getVerificationProofUrl('different_user_id', r3.id, dbSub!.id);
      assert(false, 'Allowed cross-user proof url generation');
    } catch (err: any) {
      assert(err.message.includes('not found'), 'Blocked cross-user proof url generation');
    }


    // ==========================================
    // TASK 7: UTR SECURITY AUDIT
    // ==========================================
    console.log('\n--- TASK 7: UTR Security Audit ---');
    // Create new recharge
    const r4 = (await walletService.createRechargeRequest(user.id, 20000)).recharge;
    await walletService.markPaymentInitiated(user.id, r4.id);

    // Try submitting the already used UTR: testUtr
    try {
      await walletService.submitRechargeVerification(user.id, r4.id, testUtr);
      assert(false, 'Allowed duplicate UTR submission');
    } catch (err: any) {
      assert(err.message.includes('already been submitted'), 'Blocked duplicate UTR submission');
    }


    // ==========================================
    // TASK 9: WALLET AUDIT (NO NEGATIVE BALANCES)
    // ==========================================
    console.log('\n--- TASK 9: Wallet Audit (No Negative Balances) ---');
    // Attempt to debit wallet beyond available funds
    const currentBalance = (await prisma.wallet.findUnique({ where: { userId: user.id } }))?.balancePaise ?? 0;
    const debitAmountInRupees = (currentBalance / 100) + 10; // ₹10 more than balance

    try {
      await prisma.$transaction(async (tx) => {
        await walletService.debitWithLedgerTx(tx, user.id, debitAmountInRupees, 'order-id-fail', 'debit fail remarks');
      });
      assert(false, 'Allowed wallet debit resulting in negative balance');
    } catch (err: any) {
      assert(err.message.includes('Insufficient wallet balance'), 'Blocked wallet debit resulting in negative balance');
    }


    // ==========================================
    // TASK 10: CREDITED RECHARGE IMMUTABILITY AUDIT
    // ==========================================
    console.log('\n--- TASK 10: Credited Recharge Immutability Audit ---');
    // recharge is in BALANCE_CREDITED. Try cancel:
    try {
      await walletService.cancelRechargeRequest(user.id, recharge.id);
      assert(false, 'Allowed cancellation of BALANCE_CREDITED request');
    } catch (err: any) {
      assert(err.message.includes('Cannot cancel an already credited'), 'Blocked cancellation of BALANCE_CREDITED request');
    }

    // Try resubmit:
    try {
      await walletService.resubmitRechargeVerification(user.id, recharge.id, { utr: 'UTR123456789012' });
      assert(false, 'Allowed resubmission of BALANCE_CREDITED request');
    } catch (err: any) {
      assert(err.message.includes('Cannot resubmit verification'), 'Blocked resubmission of BALANCE_CREDITED request');
    }

    // Try reject:
    try {
      await walletService.rejectRechargeRequest(admin.id, recharge.id, 'Rejecting approved');
      assert(false, 'Allowed rejection of BALANCE_CREDITED request');
    } catch (err: any) {
      assert(err.message.includes('Cannot reject recharge request'), 'Blocked rejection of BALANCE_CREDITED request');
    }

    console.log('\n--- ALL AUDIT TESTS COMPLETE ---');
    console.log(`PASS: ${passCount}, FAIL: ${failCount}`);

  } catch (err) {
    console.error('Fatal error during audit tests:', err);
  } finally {
    // Cleanup audit entities to keep database clean
    console.log('Cleaning up seeded test users/wallets...');
    await prisma.rechargeAuditLog.deleteMany({ where: { recharge: { userId: user.id } } });
    await prisma.rechargeVerificationSubmission.deleteMany({ where: { submittedByUserId: user.id } });
    await prisma.walletLedger.deleteMany({ where: { wallet: { userId: user.id } } });
    await prisma.walletRecharge.deleteMany({ where: { userId: user.id } });
    await prisma.wallet.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.user.delete({ where: { id: admin.id } });
    await prisma.$disconnect();
  }
}

runTests();
