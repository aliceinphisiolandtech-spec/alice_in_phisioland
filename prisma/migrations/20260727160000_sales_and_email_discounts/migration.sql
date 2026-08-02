-- Pełny system rabatowy: przeceny, zniżki dla puli maili, reguła nakładania.
-- Migracja addytywna: nowe tabele + nowe kolumny. Żadnych DROP/DELETE.

-- AlterTable: reguła nakładania na poziomie pojedynczego kodu
ALTER TABLE "DiscountCode" ADD COLUMN "stackableWithSale" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: snapshot pozostałych źródeł obniżki przy zamówieniu
ALTER TABLE "Order" ADD COLUMN "saleName" TEXT;
ALTER TABLE "Order" ADD COLUMN "saleAmount" INTEGER;
ALTER TABLE "Order" ADD COLUMN "emailDiscountName" TEXT;
ALTER TABLE "Order" ADD COLUMN "emailDiscountAmount" INTEGER;
ALTER TABLE "Order" ADD COLUMN "totalDiscountAmount" INTEGER;

-- Backfill: dla historycznych zamówień jedynym źródłem obniżki był kod
UPDATE "Order"
SET "totalDiscountAmount" = "discountAmount"
WHERE "discountAmount" IS NOT NULL
  AND "totalDiscountAmount" IS NULL;

-- CreateTable: przecena
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'percent',
    "percentOff" INTEGER,
    "fixedPrice" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Sale_isActive_idx" ON "Sale"("isActive");

-- CreateTable: zniżka dla puli maili
CREATE TABLE "EmailDiscount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'percent',
    "percentOff" INTEGER,
    "amountOff" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDiscount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailDiscount_isActive_idx" ON "EmailDiscount"("isActive");

-- CreateTable: adresy objęte zniżką
CREATE TABLE "EmailDiscountMember" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDiscountMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailDiscountMember_discountId_email_key" ON "EmailDiscountMember"("discountId", "email");
CREATE INDEX "EmailDiscountMember_email_idx" ON "EmailDiscountMember"("email");

ALTER TABLE "EmailDiscountMember"
  ADD CONSTRAINT "EmailDiscountMember_discountId_fkey"
  FOREIGN KEY ("discountId") REFERENCES "EmailDiscount"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
