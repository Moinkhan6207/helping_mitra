-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ResultType" AS ENUM ('FILE_UPLOAD', 'STATUS_ONLY', 'TEXT_RESULT');

-- CreateEnum
CREATE TYPE "ServiceFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'EMAIL', 'MOBILE', 'TEXTAREA', 'SELECT');

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "resultType" "ResultType" NOT NULL,
    "resultLabel" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceField" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldType" "ServiceFieldType" NOT NULL,
    "placeholder" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "validationRules" JSONB,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDocumentRequirement" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentKey" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "allowedFileTypes" TEXT[],
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePriceHistory" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "oldMrp" DECIMAL(10,2) NOT NULL,
    "newMrp" DECIMAL(10,2) NOT NULL,
    "changedByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_slug_idx" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_status_idx" ON "ServiceCategory"("status");

-- CreateIndex
CREATE INDEX "ServiceCategory_displayOrder_idx" ON "ServiceCategory"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_slug_idx" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");

-- CreateIndex
CREATE INDEX "Service_status_idx" ON "Service"("status");

-- CreateIndex
CREATE INDEX "Service_displayOrder_idx" ON "Service"("displayOrder");

-- CreateIndex
CREATE INDEX "Service_resultType_idx" ON "Service"("resultType");

-- CreateIndex
CREATE INDEX "ServiceField_serviceId_idx" ON "ServiceField"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceField_displayOrder_idx" ON "ServiceField"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceField_serviceId_fieldKey_key" ON "ServiceField"("serviceId", "fieldKey");

-- CreateIndex
CREATE INDEX "ServiceDocumentRequirement_serviceId_idx" ON "ServiceDocumentRequirement"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceDocumentRequirement_displayOrder_idx" ON "ServiceDocumentRequirement"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDocumentRequirement_serviceId_documentKey_key" ON "ServiceDocumentRequirement"("serviceId", "documentKey");

-- CreateIndex
CREATE INDEX "ServicePriceHistory_serviceId_idx" ON "ServicePriceHistory"("serviceId");

-- CreateIndex
CREATE INDEX "ServicePriceHistory_changedByAdminId_idx" ON "ServicePriceHistory"("changedByAdminId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceField" ADD CONSTRAINT "ServiceField_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDocumentRequirement" ADD CONSTRAINT "ServiceDocumentRequirement_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePriceHistory" ADD CONSTRAINT "ServicePriceHistory_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePriceHistory" ADD CONSTRAINT "ServicePriceHistory_changedByAdminId_fkey" FOREIGN KEY ("changedByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
