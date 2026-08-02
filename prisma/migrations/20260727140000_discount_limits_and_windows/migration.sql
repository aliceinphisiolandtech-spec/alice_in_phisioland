-- Rozszerzenie kodów rabatowych o typ rabatu, limit użyć i okno czasowe.
-- Migracja jest w całości addytywna: nowe kolumny + rozluźnienie NOT NULL.
-- Żadnych DROP/DELETE — istniejące dane pozostają nietknięte.

-- AlterTable: typ rabatu (istniejące kody to rabaty procentowe)
ALTER TABLE "DiscountCode" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'percent';
ALTER TABLE "DiscountCode" ADD COLUMN "amountOff" INTEGER;

-- percentOff przestaje być wymagane (kody kwotowe go nie mają)
ALTER TABLE "DiscountCode" ALTER COLUMN "percentOff" DROP NOT NULL;

-- AlterTable: limit ilościowy
ALTER TABLE "DiscountCode" ADD COLUMN "usageLimit" INTEGER;
ALTER TABLE "DiscountCode" ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: okno czasowe + dedup powiadomienia o wyczerpaniu
ALTER TABLE "DiscountCode" ADD COLUMN "validFrom" TIMESTAMP(3);
ALTER TABLE "DiscountCode" ADD COLUMN "validUntil" TIMESTAMP(3);
ALTER TABLE "DiscountCode" ADD COLUMN "exhaustedNotifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DiscountCode_isActive_idx" ON "DiscountCode"("isActive");

-- AlterTable: powiązanie zamówienia z konkretnym kodem (bez FK — patrz schema)
ALTER TABLE "Order" ADD COLUMN "discountCodeId" TEXT;

-- Backfill: powiązanie historycznych zamówień po nazwie kodu
UPDATE "Order" o
SET "discountCodeId" = dc."id"
FROM "DiscountCode" dc
WHERE o."discountCode" = dc."code"
  AND o."discountCodeId" IS NULL;

-- Backfill: licznik użyć liczony z opłaconych zamówień
UPDATE "DiscountCode" dc
SET "usedCount" = (
  SELECT COUNT(*)
  FROM "Order" o
  WHERE o."status" = 'succeeded'
    AND o."discountCode" = dc."code"
);
