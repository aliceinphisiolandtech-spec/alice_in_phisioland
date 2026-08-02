-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percentOff" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- AlterTable (snapshot rabatu przy zamówieniu; wszystkie kolumny nullowalne,
-- więc historyczne zamówienia pozostają nienaruszone)
ALTER TABLE "Order" ADD COLUMN     "discountAmount" INTEGER,
ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "originalAmount" INTEGER;

-- Kod startowy: utworzony wyłączony, aktywacja to świadomy klik w panelu.
INSERT INTO "DiscountCode" ("id", "code", "percentOff", "isActive", "createdAt", "updatedAt")
VALUES ('seed_discount_alicja10', 'ALICJA10', 10, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
