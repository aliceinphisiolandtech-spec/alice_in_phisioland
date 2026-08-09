-- Twardy limit liczby zapisów na kampanię.
--
-- Migracja addytywna: jedna kolumna dopuszczająca NULL. Istniejące kampanie
-- dostają NULL, czyli „bez limitu" — zachowują się dokładnie tak jak dotąd.
--
-- Bez indeksu: limit sprawdzamy zawsze dla JEDNEJ kampanii, po kluczu głównym,
-- a liczbę zapisów zliczamy po istniejącym indeksie WaitlistSubscriber(pageId).

ALTER TABLE "WaitlistPage" ADD COLUMN "maxSignups" INTEGER;
