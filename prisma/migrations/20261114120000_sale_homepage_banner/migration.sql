-- Pasek promocji na stronie głównej, sterowany z formularza przeceny.
-- Migracja addytywna: domyślnie wyłączony, więc nic nie zmienia się samo.

ALTER TABLE "Sale" ADD COLUMN "showBanner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Sale" ADD COLUMN "bannerText" TEXT;
