-- Add shop registration control fields
ALTER TABLE "Shop"
ADD COLUMN "shopCode" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "acceptsStaffRegistrations" BOOLEAN NOT NULL DEFAULT true;

-- Backfill shop code for existing shops before enforcing NOT NULL/UNIQUE
WITH ranked_shops AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM "Shop"
  WHERE "shopCode" IS NULL
)
UPDATE "Shop" s
SET "shopCode" = CONCAT('SHOP-', LPAD(ranked_shops.rn::text, 6, '0'))
FROM ranked_shops
WHERE s.id = ranked_shops.id;

ALTER TABLE "Shop"
ALTER COLUMN "shopCode" SET NOT NULL;

CREATE UNIQUE INDEX "Shop_shopCode_key" ON "Shop"("shopCode");

-- Add user identity fields for phone-based staff registration
ALTER TABLE "User"
ADD COLUMN "fullName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "phone" TEXT;

ALTER TABLE "User"
ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");