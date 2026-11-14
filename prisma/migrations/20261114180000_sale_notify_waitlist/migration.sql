-- Popup promocji: przecena może wskazać listę zapisów, na którą trafia e-mail
-- z formularza „Powiadom mnie”. Migracja addytywna — kolumna opcjonalna,
-- istniejące przeceny dostają NULL (popup bez formularza).

ALTER TABLE "Sale" ADD COLUMN "notifyWaitlistId" TEXT;

ALTER TABLE "Sale"
  ADD CONSTRAINT "Sale_notifyWaitlistId_fkey"
  FOREIGN KEY ("notifyWaitlistId") REFERENCES "WaitlistPage"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
