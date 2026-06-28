/*
  Warnings:

  - The values [IN_PROGRESS,COMPLETED,CANCELLED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NOT_REQUIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RefundOption" AS ENUM ('FULL_REFUND', 'NO_REFUND');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'REJECTED');
ALTER TABLE "Order" ALTER COLUMN "orderStatus" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "orderStatus" TYPE "OrderStatus_new" USING ("orderStatus"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "orderStatus" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "assignedAdminId" TEXT,
ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignedByAdminId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedByAdminId" TEXT,
ADD COLUMN     "internalCompletionNote" TEXT,
ADD COLUMN     "internalRejectionReason" TEXT,
ADD COLUMN     "orderAmountPaise" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "processingStartedAt" TIMESTAMP(3),
ADD COLUMN     "processingStartedByAdminId" TEXT,
ADD COLUMN     "refundAmountPaise" INTEGER,
ADD COLUMN     "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedByAdminId" TEXT,
ADD COLUMN     "resultLabelSnapshot" TEXT,
ADD COLUMN     "resultTypeSnapshot" "ResultType",
ADD COLUMN     "userVisibleCompletionNote" TEXT,
ADD COLUMN     "userVisibleRejectionReason" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "OrderResult" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "resultType" "ResultType" NOT NULL,
    "resultLabel" TEXT NOT NULL,
    "textValue" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "storagePath" TEXT,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderInternalNote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAuditLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldStatus" "OrderStatus",
    "newStatus" "OrderStatus" NOT NULL,
    "performedByUserId" TEXT,
    "performedByAdminId" TEXT,
    "remarks" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionIdempotency" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "responseSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderResult_orderId_key" ON "OrderResult"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ActionIdempotency_adminId_orderId_action_idempotencyKey_key" ON "ActionIdempotency"("adminId", "orderId", "action", "idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_assignedAdminId_idx" ON "Order"("assignedAdminId");

-- CreateIndex
CREATE INDEX "Order_processingStartedAt_idx" ON "Order"("processingStartedAt");

-- CreateIndex
CREATE INDEX "Order_completedAt_idx" ON "Order"("completedAt");

-- CreateIndex
CREATE INDEX "Order_rejectedAt_idx" ON "Order"("rejectedAt");

-- CreateIndex
CREATE INDEX "Order_refundStatus_idx" ON "Order"("refundStatus");

-- AddForeignKey
ALTER TABLE "OrderResult" ADD CONSTRAINT "OrderResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderInternalNote" ADD CONSTRAINT "OrderInternalNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAuditLog" ADD CONSTRAINT "OrderAuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionIdempotency" ADD CONSTRAINT "ActionIdempotency_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
