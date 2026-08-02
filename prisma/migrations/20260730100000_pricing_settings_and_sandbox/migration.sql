-- Ustawienia cenowe w bazie + tryb piaskownicy.
-- Migracja addytywna: nowa tabela + nowe kolumny z domyślnymi wartościami.
-- Żadnych DROP/DELETE — istniejące rabaty i zamówienia pozostają nietknięte.

-- AlterTable: znacznik "utworzone/zmienione w piaskownicy"
ALTER TABLE "DiscountCode" ADD COLUMN "isSandbox" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Sale" ADD COLUMN "isSandbox" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EmailDiscount" ADD COLUMN "isSandbox" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: ustawienia cenowe (jeden wiersz)
CREATE TABLE "PricingSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "basePriceGrosze" INTEGER NOT NULL,
    "regularPriceGrosze" INTEGER NOT NULL,
    "sandboxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sandboxBasePriceGrosze" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

-- Wartości startowe = dokładnie te, które do tej pory były zaszyte w kodzie
-- (src/lib/pricing.ts), żeby włączenie tej migracji niczego nie przeceniło.
INSERT INTO "PricingSettings" ("id", "basePriceGrosze", "regularPriceGrosze", "sandboxEnabled", "sandboxBasePriceGrosze", "updatedAt")
VALUES ('singleton', 10900, 14900, false, NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
