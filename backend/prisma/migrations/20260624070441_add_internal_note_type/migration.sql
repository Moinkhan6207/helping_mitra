-- CreateEnum
CREATE TYPE "InternalNoteType" AS ENUM ('GENERAL', 'VERIFICATION', 'DOCUMENT', 'FOLLOW_UP', 'ESCALATION');

-- AlterTable
ALTER TABLE "OrderInternalNote" ADD COLUMN     "noteType" "InternalNoteType";

-- AddForeignKey
ALTER TABLE "OrderInternalNote" ADD CONSTRAINT "OrderInternalNote_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
