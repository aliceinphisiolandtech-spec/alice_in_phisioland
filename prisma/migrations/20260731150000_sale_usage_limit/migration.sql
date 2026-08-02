-- Limit użyć dla przecen i zniżek mailowych (tak jak przy kodach rabatowych)
-- + powiązanie zamówienia z konkretną obniżką, żeby dało się naliczyć zużycie.
-- Migracja addytywna: same nowe kolumny z wartościami domyślnymi.

ALTER TABLE "Sale" ADD COLUMN "usageLimit" INTEGER;
ALTER TABLE "Sale" ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN "exhaustedNotifiedAt" TIMESTAMP(3);

ALTER TABLE "EmailDiscount" ADD COLUMN "usageLimit" INTEGER;
ALTER TABLE "EmailDiscount" ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EmailDiscount" ADD COLUMN "exhaustedNotifiedAt" TIMESTAMP(3);

ALTER TABLE "Order" ADD COLUMN "saleId" TEXT;
ALTER TABLE "Order" ADD COLUMN "emailDiscountId" TEXT;

-- Backfill: historyczne zamówienia wiążemy po nazwie ze snapshotu (jedyne, co
-- mamy). Nazwy są unikalne w praktyce; przy kolizji zostanie NULL.
UPDATE "Order" o
SET "saleId" = s."id"
FROM "Sale" s
WHERE o."saleName" = s."name"
  AND o."saleId" IS NULL;

UPDATE "Order" o
SET "emailDiscountId" = e."id"
FROM "EmailDiscount" e
WHERE o."emailDiscountName" = e."name"
  AND o."emailDiscountId" IS NULL;

-- Backfill liczników z opłaconych, nietestowych zamówień.
UPDATE "Sale" s
SET "usedCount" = (
  SELECT COUNT(*)
  FROM "Order" o
  WHERE o."saleId" = s."id"
    AND o."status" = 'succeeded'
    AND o."isSandbox" = false
);

UPDATE "EmailDiscount" e
SET "usedCount" = (
  SELECT COUNT(*)
  FROM "Order" o
  WHERE o."emailDiscountId" = e."id"
    AND o."status" = 'succeeded'
    AND o."isSandbox" = false
);
