-- CreateTable
CREATE TABLE "PartsInventory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNumber" TEXT,
    "category" TEXT,
    "compatibleBrands" TEXT[],
    "compatibleModels" TEXT[],
    "supplierName" TEXT,
    "quantityInStock" INTEGER NOT NULL DEFAULT 0,
    "minimumStockLevel" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartsInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairPartsUsed" (
    "id" TEXT NOT NULL,
    "repairId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantityUsed" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "addedByUserId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairPartsUsed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartsInventory_tenantId_idx" ON "PartsInventory"("tenantId");

-- CreateIndex
CREATE INDEX "PartsInventory_shopId_idx" ON "PartsInventory"("shopId");

-- CreateIndex
CREATE INDEX "PartsInventory_category_idx" ON "PartsInventory"("category");

-- CreateIndex
CREATE INDEX "RepairPartsUsed_repairId_idx" ON "RepairPartsUsed"("repairId");

-- CreateIndex
CREATE INDEX "RepairPartsUsed_partId_idx" ON "RepairPartsUsed"("partId");

-- AddForeignKey
ALTER TABLE "PartsInventory" ADD CONSTRAINT "PartsInventory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairPartsUsed" ADD CONSTRAINT "RepairPartsUsed_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "Repair"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairPartsUsed" ADD CONSTRAINT "RepairPartsUsed_partId_fkey" FOREIGN KEY ("partId") REFERENCES "PartsInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairPartsUsed" ADD CONSTRAINT "RepairPartsUsed_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
