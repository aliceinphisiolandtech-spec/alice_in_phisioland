-- Omnibus: najniższa cena z 30 dni przed obniżką, ustawiana przy przecenie.
-- Migracja addytywna — jedna opcjonalna kolumna, istniejące dane bez zmian.

ALTER TABLE "Sale" ADD COLUMN "lowestPrice30dGrosze" INTEGER;
