-- CreateEnum
CREATE TYPE "RepairPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "Repair" ADD COLUMN "priority" "RepairPriority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Repair" ADD COLUMN "estimatedCompletionDate" TIMESTAMP(3);
