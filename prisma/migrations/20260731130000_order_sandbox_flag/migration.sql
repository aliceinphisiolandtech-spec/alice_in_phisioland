-- Oznaczenie zamówień złożonych w piaskownicy (zakupy testowe admina).
-- Migracja addytywna: jedna kolumna z wartością domyślną. Wszystkie 128
-- istniejących zamówień dostaje false, czyli "prawdziwa sprzedaż" — bez zmiany
-- ich znaczenia i bez dotykania jakichkolwiek danych.

ALTER TABLE "Order" ADD COLUMN "isSandbox" BOOLEAN NOT NULL DEFAULT false;

-- Statystyki dashboardu filtrują po tej kolumnie, więc warto mieć indeks.
CREATE INDEX "Order_isSandbox_idx" ON "Order"("isSandbox");
