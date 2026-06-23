-- CreateEnum
CREATE TYPE "RechargeStatus" AS ENUM ('CREATED', 'PAYMENT_INITIATED', 'VERIFICATION_PENDING', 'UNDER_REVIEW', 'BALANCE_CREDITED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WalletLedgerType" AS ENUM ('DEBIT', 'CREDIT', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "WalletReferenceType" AS ENUM ('ORDER', 'RECHARGE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('COMPLETED', 'REVERSED');

-- CreateEnum
CREATE TYPE "RechargeAuditAction" AS ENUM ('RECHARGE_CREATED', 'PAYMENT_INITIATED', 'VERIFICATION_SUBMITTED', 'REVIEW_STARTED', 'APPROVED', 'REJECTED', 'RESUBMITTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('WALLET');

-- AlterTable
ALTER TABLE "ServiceField" ADD COLUMN     "sectionName" TEXT;

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balancePaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletLedger" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "type" "WalletLedgerType" NOT NULL,
    "balanceBeforePaise" INTEGER NOT NULL,
    "balanceAfterPaise" INTEGER NOT NULL,
    "referenceType" "WalletReferenceType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "status" "LedgerStatus" NOT NULL DEFAULT 'COMPLETED',
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletRecharge" (
    "id" TEXT NOT NULL,
    "rechargeNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedAmountPaise" INTEGER NOT NULL,
    "upiAccountId" TEXT,
    "upiVpaSnapshot" TEXT,
    "payeeNameSnapshot" TEXT,
    "paymentNote" TEXT,
    "status" "RechargeStatus" NOT NULL DEFAULT 'CREATED',
    "paymentExpiresAt" TIMESTAMP(3),
    "utrSubmissionDeadline" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewStartedByAdminId" TEXT,
    "reviewStartedAt" TIMESTAMP(3),
    "resolvedByAdminId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "verifiedAmountPaise" INTEGER,
    "paymentDate" TIMESTAMP(3),
    "receivingAccountId" TEXT,
    "adminRemarks" TEXT,
    "rejectionReason" TEXT,
    "creditedAt" TIMESTAMP(3),
    "resubmissionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletRecharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RechargeVerificationSubmission" (
    "id" TEXT NOT NULL,
    "rechargeId" TEXT NOT NULL,
    "submissionNumber" INTEGER NOT NULL,
    "utr" TEXT NOT NULL,
    "proofStoragePath" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RechargeStatus" NOT NULL,
    "adminRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RechargeVerificationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RechargeAuditLog" (
    "id" TEXT NOT NULL,
    "rechargeId" TEXT NOT NULL,
    "action" "RechargeAuditAction" NOT NULL,
    "oldStatus" "RechargeStatus",
    "newStatus" "RechargeStatus" NOT NULL,
    "performedByUserId" TEXT,
    "performedByAdminId" TEXT,
    "remarks" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RechargeAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceNameSnapshot" TEXT NOT NULL,
    "categoryNameSnapshot" TEXT NOT NULL,
    "orderAmount" DECIMAL(10,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'WALLET',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "consentAccepted" BOOLEAN NOT NULL,
    "consentAcceptedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderFieldValue" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDocument" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "documentKey" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "WalletLedger_walletId_idx" ON "WalletLedger"("walletId");

-- CreateIndex
CREATE INDEX "WalletLedger_createdAt_idx" ON "WalletLedger"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WalletLedger_referenceType_referenceId_type_key" ON "WalletLedger"("referenceType", "referenceId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "WalletRecharge_rechargeNumber_key" ON "WalletRecharge"("rechargeNumber");

-- CreateIndex
CREATE INDEX "WalletRecharge_rechargeNumber_idx" ON "WalletRecharge"("rechargeNumber");

-- CreateIndex
CREATE INDEX "WalletRecharge_userId_idx" ON "WalletRecharge"("userId");

-- CreateIndex
CREATE INDEX "WalletRecharge_status_idx" ON "WalletRecharge"("status");

-- CreateIndex
CREATE INDEX "WalletRecharge_createdAt_idx" ON "WalletRecharge"("createdAt");

-- CreateIndex
CREATE INDEX "WalletRecharge_submittedAt_idx" ON "WalletRecharge"("submittedAt");

-- CreateIndex
CREATE INDEX "WalletRecharge_resolvedAt_idx" ON "WalletRecharge"("resolvedAt");

-- CreateIndex
CREATE INDEX "WalletRecharge_creditedAt_idx" ON "WalletRecharge"("creditedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeVerificationSubmission_utr_key" ON "RechargeVerificationSubmission"("utr");

-- CreateIndex
CREATE INDEX "RechargeVerificationSubmission_rechargeId_idx" ON "RechargeVerificationSubmission"("rechargeId");

-- CreateIndex
CREATE INDEX "RechargeVerificationSubmission_submittedAt_idx" ON "RechargeVerificationSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "RechargeVerificationSubmission_utr_idx" ON "RechargeVerificationSubmission"("utr");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeVerificationSubmission_rechargeId_submissionNumber_key" ON "RechargeVerificationSubmission"("rechargeId", "submissionNumber");

-- CreateIndex
CREATE INDEX "RechargeAuditLog_rechargeId_idx" ON "RechargeAuditLog"("rechargeId");

-- CreateIndex
CREATE INDEX "RechargeAuditLog_createdAt_idx" ON "RechargeAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_serviceId_idx" ON "Order"("serviceId");

-- CreateIndex
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderFieldValue_orderId_idx" ON "OrderFieldValue"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderFieldValue_orderId_fieldKey_key" ON "OrderFieldValue"("orderId", "fieldKey");

-- CreateIndex
CREATE INDEX "OrderDocument_orderId_idx" ON "OrderDocument"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderDocument_orderId_documentKey_key" ON "OrderDocument"("orderId", "documentKey");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecharge" ADD CONSTRAINT "WalletRecharge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeVerificationSubmission" ADD CONSTRAINT "RechargeVerificationSubmission_rechargeId_fkey" FOREIGN KEY ("rechargeId") REFERENCES "WalletRecharge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeVerificationSubmission" ADD CONSTRAINT "RechargeVerificationSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeAuditLog" ADD CONSTRAINT "RechargeAuditLog_rechargeId_fkey" FOREIGN KEY ("rechargeId") REFERENCES "WalletRecharge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeAuditLog" ADD CONSTRAINT "RechargeAuditLog_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderFieldValue" ADD CONSTRAINT "OrderFieldValue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "Wallet" ADD CONSTRAINT "wallet_balance_paise_non_negative" CHECK ("balancePaise" >= 0);
