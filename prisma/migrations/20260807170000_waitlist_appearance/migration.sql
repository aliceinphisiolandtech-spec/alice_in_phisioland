-- Pola wyglądu dla kreatora stron zapisów (Etap 2).
--
-- Migracja addytywna: same nowe kolumny z wartościami domyślnymi. Kampanie
-- założone w Etapie 1 dostają wariant "card" i motyw "forest", czyli dokładnie
-- to, jak wyglądały do tej pory — zmiana jest dla nich niewidoczna.

ALTER TABLE "WaitlistPage" ADD COLUMN "layoutVariant" TEXT NOT NULL DEFAULT 'card';
ALTER TABLE "WaitlistPage" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'forest';
ALTER TABLE "WaitlistPage" ADD COLUMN "heroImageUrl" TEXT;
ALTER TABLE "WaitlistPage" ADD COLUMN "ogImageUrl" TEXT;
