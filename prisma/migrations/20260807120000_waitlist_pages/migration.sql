-- Lista oczekujących: strony zapisów pod akcje marketingowe + zebrane kontakty.
-- Migracja addytywna: same nowe tabele. Żadnych DROP/DELETE, istniejący
-- NewsletterSubscriber zostaje nietknięty (obsługuje zapis ze stopki i ma
-- inną semantykę: jedna globalna lista bez powiązania z kampanią).

-- CreateTable: strona zapisów (jedna na akcję marketingową)
CREATE TABLE "WaitlistPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "highlight" TEXT,
    "description" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Zapisz się',
    "footnote" TEXT,
    "successTitle" TEXT NOT NULL DEFAULT 'Jesteś na liście!',
    "successMessage" TEXT NOT NULL,
    "mailerliteGroupId" TEXT,
    "collectName" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "closedMessage" TEXT,
    "consentText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitlistPage_slug_key" ON "WaitlistPage"("slug");
CREATE INDEX "WaitlistPage_isActive_idx" ON "WaitlistPage"("isActive");

-- CreateTable: pojedynczy zapis na listę
CREATE TABLE "WaitlistSubscriber" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "consentText" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'pending',
    "syncedAt" TIMESTAMP(3),
    "syncError" TEXT,
    "syncAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistSubscriber_pkey" PRIMARY KEY ("id")
);

-- Ta sama osoba nie dubluje się w jednej kampanii, ale może zapisać się na kilka.
CREATE UNIQUE INDEX "WaitlistSubscriber_pageId_email_key" ON "WaitlistSubscriber"("pageId", "email");
-- Pod zapytanie crona o zaległe wysyłki do MailerLite.
CREATE INDEX "WaitlistSubscriber_syncStatus_syncAttempts_idx" ON "WaitlistSubscriber"("syncStatus", "syncAttempts");
-- Pod listę zapisów i licznik w panelu.
CREATE INDEX "WaitlistSubscriber_pageId_createdAt_idx" ON "WaitlistSubscriber"("pageId", "createdAt");

ALTER TABLE "WaitlistSubscriber"
    ADD CONSTRAINT "WaitlistSubscriber_pageId_fkey"
    FOREIGN KEY ("pageId") REFERENCES "WaitlistPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
