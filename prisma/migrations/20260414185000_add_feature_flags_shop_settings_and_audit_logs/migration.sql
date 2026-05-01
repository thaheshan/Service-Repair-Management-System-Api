-- CreateTable
CREATE TABLE "ShopSettings" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "feature_flags" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_tenantId_key" ON "ShopSettings"("tenantId");

-- CreateIndex
CREATE INDEX "ShopSettings_tenantId_idx" ON "ShopSettings"("tenantId");

-- AddForeignKey
ALTER TABLE "ShopSettings" ADD CONSTRAINT "ShopSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AuditLogs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "flagName" TEXT NOT NULL,
  "oldVal" BOOLEAN NOT NULL,
  "newVal" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLogs_tenantId_idx" ON "AuditLogs"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLogs_adminId_idx" ON "AuditLogs"("adminId");

-- CreateIndex
CREATE INDEX "AuditLogs_flagName_idx" ON "AuditLogs"("flagName");

