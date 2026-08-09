-- Oznaczenie dostępów nadanych zakupem testowym z piaskownicy.
--
-- Bez tej kolumny licznik "Sprzedane E-booki" na dashboardzie liczył wiersze
-- Purchase bez żadnego filtra, więc każdy zakup testowy admina podbijał go o 1
-- — mimo że przychód, klienci i wykres były już filtrowane po Order.isSandbox.
--
-- Migracja addytywna: jedna kolumna z wartością domyślną. Wszystkie istniejące
-- dostępy dostają false, czyli "prawdziwy zakup" — bez zmiany ich znaczenia
-- i bez dotykania jakichkolwiek danych.

ALTER TABLE "Purchase" ADD COLUMN "isSandbox" BOOLEAN NOT NULL DEFAULT false;

-- Statystyki dashboardu filtrują po tej kolumnie, więc warto mieć indeks
-- (analogicznie do "Order_isSandbox_idx").
CREATE INDEX "Purchase_isSandbox_idx" ON "Purchase"("isSandbox");

-- Porządkowanie danych historycznych: dostępy, które powstały z zamówienia
-- oznaczonego jako testowe, dostają tę samą flagę. Webhook tworzy Purchase
-- w jednej transakcji z oznaczeniem zamówienia jako "succeeded", więc para
-- (userId, produkt) jednoznacznie wskazuje źródło.
UPDATE "Purchase" p
SET "isSandbox" = true
WHERE EXISTS (
  SELECT 1
  FROM "Order" o
  WHERE o."userId" = p."userId"
    AND o."isSandbox" = true
    AND o."status" = 'succeeded'
);
