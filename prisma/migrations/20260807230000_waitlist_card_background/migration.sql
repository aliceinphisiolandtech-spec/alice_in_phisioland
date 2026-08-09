-- Zdjęcie w tle karty z treścią + krycie nakładki w kolorze marki.
--
-- Migracja addytywna: dwie nowe kolumny z wartościami domyślnymi. Istniejące
-- kampanie dostają NULL w zdjęciu, więc renderują się dokładnie tak jak dotąd —
-- nakładka pojawia się wyłącznie wtedy, gdy jest co przykrywać.
--
-- 50 jako domyślne krycie: przy tej wartości zdjęcie jest jeszcze czytelne,
-- a tekst na nim już tak. To punkt wyjścia, nie ograniczenie — suwak
-- w kreatorze przyjmuje pełny zakres 0–100.

ALTER TABLE "WaitlistPage" ADD COLUMN "backgroundImageUrl" TEXT;
ALTER TABLE "WaitlistPage" ADD COLUMN "overlayOpacity" INTEGER NOT NULL DEFAULT 50;
