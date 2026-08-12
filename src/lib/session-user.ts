// src/lib/session-user.ts
import { prisma } from "@/lib/prisma";

/**
 * Weryfikacja, czy właściciel tokena JWT nadal istnieje w bazie.
 *
 * PO CO TO JEST
 * Sesja działa w trybie `strategy: "jwt"`, czyli siedzi w podpisanym ciasteczku
 * na urządzeniu użytkownika, a nie w tabeli `Session`. Usunięcie wiersza z `User`
 * nie ma więc żadnego wpływu na to ciasteczko — bez tej weryfikacji skasowane
 * konto zostaje zalogowane aż do wygaśnięcia tokena (30 dni, odnawiane przy
 * aktywności, więc w praktyce w nieskończoność).
 *
 * DLACZEGO Z PAMIĘCIĄ PODRĘCZNĄ
 * Callback `jwt` odpala się przy każdym `getServerSession()`, a pojedyncze
 * wyrenderowanie strony woła go kilka razy (layout + page + akcje serwerowe).
 * Odpytywanie bazy za każdym razem oznaczałoby kilka zapytań na jedno kliknięcie,
 * a stawka jest niska: opóźnienie do minuty między usunięciem konta a realnym
 * wylogowaniem jest w zupełności akceptowalne.
 *
 * Cache jest per instancja procesu. Na serwerless każda instancja ma własny —
 * i dobrze, bo to tylko bufor na odczyty, nie źródło prawdy.
 *
 * ZACHOWANIE PRZY BŁĘDZIE BAZY
 * Świadomie fail-open: chwilowa awaria połączenia NIE wylogowuje wszystkich.
 * Utrzymanie sesji przy niedostępnej bazie jest znacznie mniej szkodliwe niż
 * masowe wyrzucenie zalogowanych użytkowników przy każdym mignięciu sieci.
 */

const CHECK_TTL_MS = 60_000;

/** Zabezpieczenie przed puchnięciem mapy przy dużym ruchu. */
const MAX_CACHE_ENTRIES = 5_000;

export type SessionUserState =
  /** Konto istnieje — `role` jest świeżo odczytana z bazy. */
  | { status: "exists"; role: string }
  /** Konta nie ma albo zostało zanonimizowane — token trzeba unieważnić. */
  | { status: "deleted" }
  /** Nie udało się sprawdzić (błąd bazy) — sesję zostawiamy nietkniętą. */
  | { status: "unknown" };

interface CacheEntry {
  checkedAt: number;
  state: SessionUserState;
}

const cache = new Map<string, CacheEntry>();

export async function verifySessionUser(
  userId: string,
): Promise<SessionUserState> {
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.checkedAt < CHECK_TTL_MS) {
    return cached.state;
  }

  let state: SessionUserState;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    // Dwa warunki, bo konto znika na dwa sposoby. `deleteMyAccountAction`
    // CELOWO nie woła `prisma.user.delete()` — kaskada zabrałaby zamówienia
    // razem z numerami faktur — tylko anonimizuje wiersz (`email: null`).
    // Samo sprawdzenie `!user` przepuściłoby więc konto usunięte z panelu.
    // Pusty e-mail jest tu wiarygodnym sygnałem: konto założone przez Google
    // zawsze ma adres, a `deleteMyAccountAction` zeruje go właśnie po to,
    // by zwolnić go do ponownego użycia.
    if (!user || user.email === null) {
      state = { status: "deleted" };
    } else {
      state = { status: "exists", role: user.role };
    }
  } catch (error) {
    console.error(
      `[SESSION] Nie udało się zweryfikować użytkownika ${userId}:`,
      error,
    );
    // Bez zapisu do cache — następne żądanie spróbuje ponownie.
    return { status: "unknown" };
  }

  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  cache.set(userId, { checkedAt: Date.now(), state });

  return state;
}

/**
 * Wymusza ponowny odczyt z bazy przy najbliższym żądaniu.
 * Do wywołania po usunięciu konta lub zmianie roli, żeby nie czekać na TTL.
 */
export function invalidateSessionUser(userId: string): void {
  cache.delete(userId);
}

/** Czyści całą pamięć podręczną — używane w testach. */
export function clearSessionUserCache(): void {
  cache.clear();
}
