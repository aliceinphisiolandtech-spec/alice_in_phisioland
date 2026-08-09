import type { WaitlistPage, WaitlistSubscriber } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  isAccountLevelFailure,
  isMailerliteConfigured,
  isRetryable,
  subscribeToMailerlite,
} from "@/lib/mailerlite";
import { isWaitlistFull } from "@/lib/waitlist-status";

/**
 * Logika listy oczekujących — wspólna dla publicznego endpointu zapisu
 * i dla dobowego crona, który dosyła zaległości do MailerLite.
 *
 * Zasada nadrzędna: **najpierw baza, potem MailerLite.** Zapis do naszej bazy
 * decyduje o tym, czy użytkownik zobaczy sukces. Wysyłka do MailerLite jest
 * krokiem drugim i jej niepowodzenie nie może kosztować nas kontaktu —
 * rekord zostaje wtedy w stanie „do dosłania" i wraca w cronie.
 */

/** Po tylu nieudanych próbach cron przestaje ponawiać i zostawia sprawę adminowi. */
const MAX_SYNC_ATTEMPTS = 5;

/** Ile zaległych zapisów dosyłamy w jednym przebiegu crona. */
const SYNC_BATCH_LIMIT = 100;

/* -------------------------------------------------------------------------- */
/* Okno zapisów                                                                */
/* -------------------------------------------------------------------------- */

// Sama reguła siedzi w osobnym, czystym module (bez Prismy), żeby dała się
// przetestować bez bazy. Tutaj tylko ją udostępniamy dalej, aby reszta kodu
// miała jeden import „wszystkiego o liście oczekujących".
// Sprawdzamy ją w dwóch miejscach — przy renderowaniu strony i ponownie przy
// zapisie — bo między wyświetleniem a kliknięciem kampania mogła się zamknąć.
export {
  resolveWaitlistPageStatus,
  isWaitlistFull,
  type WaitlistPageStatus,
} from "@/lib/waitlist-status";

export async function getWaitlistPageBySlug(
  slug: string,
): Promise<WaitlistPage | null> {
  return prisma.waitlistPage.findUnique({
    where: { slug: slug.trim().toLowerCase() },
  });
}

/* -------------------------------------------------------------------------- */
/* Zapis                                                                       */
/* -------------------------------------------------------------------------- */

export type SubscribeOutcome =
  /** Nowy kontakt trafił na listę. */
  | { status: "subscribed" }
  /** Ten adres był już zapisany na tę kampanię — dla użytkownika to też sukces. */
  | { status: "already_subscribed" }
  /** Pula miejsc wyczerpana — nowy kontakt się nie mieści. */
  | { status: "full" };

interface RecordSubscriptionArgs {
  page: WaitlistPage;
  email: string;
  name?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Ile miejsc zajęto w danej kampanii. */
export async function countWaitlistSignups(pageId: string): Promise<number> {
  return prisma.waitlistSubscriber.count({ where: { pageId } });
}

/**
 * Zapisuje kontakt i próbuje od razu wysłać go do MailerLite.
 *
 * Ponowny zapis tego samego adresu nie jest błędem — użytkownik widzi ten sam
 * ekran „jesteś na liście". Przy okazji korzystamy z okazji i ponawiamy wysyłkę,
 * jeśli poprzednim razem nie doszła: ktoś, kto zapisuje się drugi raz, zwykle
 * właśnie dlatego, że nie dostał obiecanego maila.
 *
 * Twardy limit miejsc sprawdzamy TU, a nie tylko przy renderowaniu strony:
 * formularz mógł zostać otwarty, gdy miejsca jeszcze były.
 *
 * Świadome ograniczenie: między zliczeniem a zapisem jest okno, w którym dwa
 * równoczesne zgłoszenia mogą przekroczyć limit o jeden lub dwa. Domknięcie go
 * wymagałoby blokady wiersza w transakcji interaktywnej, a te bywają zawodne
 * przez pooler (PgBouncer/Neon). Przy liście oczekujących nie ma to znaczenia:
 * limit służy zatrzymaniu zbierania, a nie sprzedaży dokładnie N miejsc —
 * i lepiej przyjąć o jedną osobę za dużo niż zgubić potwierdzony zapis.
 */
export async function recordWaitlistSubscription({
  page,
  email,
  name,
  ipAddress,
  userAgent,
}: RecordSubscriptionArgs): Promise<SubscribeOutcome> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name?.trim() || null;

  if (page.maxSignups !== null) {
    // Osoba już zapisana nie zajmuje NOWEGO miejsca, więc komplet jej nie
    // dotyczy — inaczej ktoś, kto klika drugi raz, dostałby „brak miejsc"
    // mimo że jest na liście.
    const alreadyOnList = await prisma.waitlistSubscriber.findUnique({
      where: { pageId_email: { pageId: page.id, email: normalizedEmail } },
      select: { id: true },
    });

    if (!alreadyOnList) {
      const signupCount = await countWaitlistSignups(page.id);

      if (isWaitlistFull({ maxSignups: page.maxSignups, signupCount })) {
        return { status: "full" };
      }
    }
  }

  try {
    const subscriber = await prisma.waitlistSubscriber.create({
      data: {
        pageId: page.id,
        email: normalizedEmail,
        name: normalizedName,
        // Kopia treści zgody z chwili zapisu — treść na stronie może się
        // później zmienić, a wykazać trzeba tę, którą osoba faktycznie widziała.
        consentText: page.consentText,
        ipAddress,
        userAgent,
      },
    });

    await syncSubscriberToMailerlite(subscriber, page);
    return { status: "subscribed" };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;

    const existing = await prisma.waitlistSubscriber.findUnique({
      where: { pageId_email: { pageId: page.id, email: normalizedEmail } },
    });

    // Rekord zniknął między błędem a odczytem (kasowanie w panelu) — nie ma
    // czego naprawiać, a dla użytkownika i tak jest to sukces.
    if (existing) {
      if (existing.syncStatus !== "synced") {
        await syncSubscriberToMailerlite(existing, page);
      }

      // Imię podane dopiero za drugim razem — uzupełniamy, nie nadpisujemy pustym.
      if (normalizedName && !existing.name) {
        await prisma.waitlistSubscriber.update({
          where: { id: existing.id },
          data: { name: normalizedName },
        });
      }
    }

    return { status: "already_subscribed" };
  }
}

/**
 * Czy to kolizja unikalności (P2002).
 *
 * Świadomie BEZ `instanceof PrismaClientKnownRequestError`. Ten sam moduł
 * potrafi zostać zbundlowany dwa razy (inny bundle dla komponentów
 * serwerowych, inny dla route handlerów), a wtedy `instanceof` porównuje dwie
 * różne klasy o tej samej nazwie i zwraca false. Efekt: zapis istniejącego
 * adresu leciał jako błąd 500 zamiast spokojnego „już jesteś na liście".
 * Kod błędu jest zwykłym napisem i przez granicę bundli przechodzi zawsze.
 */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/* -------------------------------------------------------------------------- */
/* Synchronizacja z MailerLite                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Wysyła jeden kontakt do MailerLite i zapisuje wynik przy rekordzie.
 *
 * Nie rzuca wyjątkiem — wywołujący (zapis użytkownika) ma dowieźć sukces
 * niezależnie od tego, co odpowiedział MailerLite.
 *
 * Stany końcowe:
 *   synced  — kontakt jest na liście,
 *   skipped — strona nie ma podpiętej grupy albo brak klucza API (świadoma
 *             konfiguracja, nie awaria — cron nie ma tego ponawiać),
 *   pending — błąd chwilowy, cron spróbuje ponownie,
 *   failed  — błąd trwały (zły klucz, odrzucony adres), ponawianie nic nie da.
 */
export async function syncSubscriberToMailerlite(
  subscriber: WaitlistSubscriber,
  page: Pick<WaitlistPage, "mailerliteGroupId">,
): Promise<void> {
  if (!isMailerliteConfigured()) {
    await markSync(subscriber.id, {
      syncStatus: "skipped",
      syncError: "Brak MAILERLITE_API_KEY — kontakt zapisany tylko lokalnie.",
    });
    return;
  }

  const result = await subscribeToMailerlite({
    email: subscriber.email,
    name: subscriber.name,
    groupId: page.mailerliteGroupId,
  });

  if (result.ok) {
    await markSync(subscriber.id, {
      syncStatus: "synced",
      syncedAt: new Date(),
      syncError: null,
    });
    return;
  }

  // Konfiguracja, nie awaria — nie ma sensu ponawiać w kółko.
  if (result.reason === "not_configured") {
    await markSync(subscriber.id, {
      syncStatus: "skipped",
      syncError: result.message,
    });
    return;
  }

  console.error(
    `❌ [waitlist] MailerLite odrzucił zapis ${subscriber.email}:`,
    result.message,
  );

  await markSync(
    subscriber.id,
    {
      syncStatus: isRetryable(result.reason) ? "pending" : "failed",
      syncError: `[${result.reason}] ${result.message}`,
    },
    // Blokada całego konta (wyczerpany plan, limit zapytań) nie jest winą tego
    // kontaktu i nie może zjadać jego puli prób — inaczej po pięciu dobach
    // zablokowanego konta wszystkie zebrane adresy wypadłyby z kolejki crona
    // na stałe, mimo że wystarczyłoby poczekać.
    !isAccountLevelFailure(result.reason),
  );
}

async function markSync(
  subscriberId: string,
  data: {
    syncStatus: string;
    syncedAt?: Date;
    syncError: string | null;
  },
  countsAsAttempt = true,
): Promise<void> {
  try {
    await prisma.waitlistSubscriber.update({
      where: { id: subscriberId },
      data: {
        ...data,
        ...(countsAsAttempt ? { syncAttempts: { increment: 1 } } : {}),
      },
    });
  } catch (error) {
    // Zapis statusu to metadana — jej brak nie może wywrócić zapisu kontaktu.
    console.error("❌ [waitlist] Nie udało się zapisać statusu wysyłki:", error);
  }
}

/**
 * Dosyła do MailerLite zapisy, które nie przeszły za pierwszym razem.
 *
 * Wpięte w dobowy cron (`/api/cron/daily`). Bierze dwa stany:
 *
 *  - „pending" — błąd chwilowy, po prostu próbujemy jeszcze raz;
 *  - „skipped" — kontakt zebrany, zanim konto MailerLite było podpięte.
 *    Do tego zapytania w ogóle nie dochodzimy bez klucza API, więc samo
 *    znalezienie się tutaj oznacza, że powód pominięcia właśnie zniknął.
 *    Bez tego kontakty z okresu przed konfiguracją zostałyby w bazie na
 *    zawsze i ktoś musiałby je przestawiać ręcznie.
 *
 * Pomijamy „failed" — to błąd trwały (odrzucony adres, cofnięty klucz),
 * gdzie ponawianie w kółko niczego nie zmieni.
 */
export async function runWaitlistSync() {
  if (!isMailerliteConfigured()) {
    return { checked: 0, synced: 0, skipped: "Brak MAILERLITE_API_KEY." };
  }

  const pending = await prisma.waitlistSubscriber.findMany({
    where: {
      syncStatus: { in: ["pending", "skipped"] },
      syncAttempts: { lt: MAX_SYNC_ATTEMPTS },
    },
    orderBy: { createdAt: "asc" },
    take: SYNC_BATCH_LIMIT,
    include: { page: { select: { mailerliteGroupId: true } } },
  });

  let synced = 0;

  for (const subscriber of pending) {
    await syncSubscriberToMailerlite(subscriber, subscriber.page);

    const after = await prisma.waitlistSubscriber.findUnique({
      where: { id: subscriber.id },
      select: { syncStatus: true },
    });

    if (after?.syncStatus === "synced") synced += 1;
  }

  return {
    checked: pending.length,
    synced,
    failed: pending.length - synced,
    maxAttempts: MAX_SYNC_ATTEMPTS,
  };
}
