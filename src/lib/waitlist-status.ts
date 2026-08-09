/**
 * Reguła „czy kampania przyjmuje zapisy" — czysta funkcja, bez Prismy i sesji.
 *
 * Wydzielona z `src/lib/waitlist.ts` celowo: to jedyny fragment listy
 * oczekujących, w którym da się zrobić cichą pomyłkę o dużych konsekwencjach
 * (strona pokazuje „zapisy zamknięte" w środku trwającej kampanii). Osobny
 * moduł bez importów serwerowych pozwala go przetestować bez bazy — tak samo
 * jak silnik cenowy, patrz komentarz w vitest.config.ts.
 */

export type WaitlistPageStatus = "open" | "not_started" | "closed" | "full";

/** Minimum, którego potrzebuje reguła — nie cały rekord z bazy. */
export interface WaitlistWindow {
  isActive: boolean;
  opensAt: Date | null;
  closesAt: Date | null;
  /** Twardy limit liczby zapisów. `null`/brak = bez limitu. */
  maxSignups?: number | null;
  /** Ile miejsc już zajęto. Bez limitu nie ma znaczenia. */
  signupCount?: number;
}

/**
 * Kolejność sprawdzeń jest istotna:
 *
 * 1. `isActive` to ręczny włącznik i ma pierwszeństwo przed wszystkim —
 *    wyłączenie kampanii w panelu musi działać natychmiast, nawet gdy okno
 *    czasowe trwa i są wolne miejsca.
 * 2. Start przed końcem — strona sprzed startu ma pokazać „jeszcze nie",
 *    a nie „już po", nawet przy sprzecznie ustawionych datach.
 * 3. Limit NA KOŃCU — gdy kampania jeszcze nie ruszyła albo termin minął,
 *    to jest właściwe wyjaśnienie, a nie „brak miejsc". Komunikat ma mówić
 *    prawdziwy powód, bo od niego zależy, czy ktoś wróci później.
 *
 * Granice są domknięte: dokładnie w sekundzie `opensAt` zapisy są już otwarte,
 * a w sekundzie `closesAt` jeszcze otwarte. Data zamknięcia ustawiana przez
 * kreator wskazuje ostatni moment, w którym zapis ma przejść. Limit domyka się
 * analogicznie: ostatnie wolne miejsce jeszcze wchodzi, dopiero jego zajęcie
 * zamyka listę.
 */
export function resolveWaitlistPageStatus(
  page: WaitlistWindow,
  now: Date = new Date(),
): WaitlistPageStatus {
  if (!page.isActive) return "closed";
  if (page.opensAt && now < page.opensAt) return "not_started";
  if (page.closesAt && now > page.closesAt) return "closed";
  if (isWaitlistFull(page)) return "full";
  return "open";
}

/**
 * Czy pula miejsc jest wyczerpana.
 *
 * Limit 0 traktujemy dosłownie — „zero miejsc" to poprawny sposób na
 * natychmiastowe zatrzymanie zapisów bez ruszania wyłącznika. Brak limitu
 * (`null`) i limit ujemny (ręczna edycja w bazie) znaczą „bez ograniczeń".
 */
export function isWaitlistFull(
  page: Pick<WaitlistWindow, "maxSignups" | "signupCount">,
): boolean {
  const max = page.maxSignups;
  if (max === null || max === undefined || max < 0) return false;

  return (page.signupCount ?? 0) >= max;
}

/** Opis statusu na plakietkę w panelu. */
export interface WaitlistStatusBadge {
  key: WaitlistPageStatus;
  label: string;
  /** Klasy Tailwinda plakietki — wypisane w całości, bo skaner jest statyczny. */
  tone: string;
  /** Kolor lewego paska karty na liście. */
  cardTone: "live" | "warn" | "idle";
}

const STATUS_BADGES: Record<WaitlistPageStatus, WaitlistStatusBadge> = {
  open: {
    key: "open",
    label: "Zbiera zapisy",
    tone: "bg-[#0c493e]/10 text-[#0c493e]",
    cardTone: "live",
  },
  not_started: {
    key: "not_started",
    label: "Zaplanowana",
    tone: "bg-amber-100 text-amber-700",
    cardTone: "warn",
  },
  closed: {
    key: "closed",
    label: "Zamknięta",
    tone: "bg-gray-100 text-gray-500",
    cardTone: "idle",
  },
  full: {
    key: "full",
    label: "Komplet",
    // Akcent marki zamiast szarości: wyczerpany limit to sukces kampanii,
    // a nie to samo co ręcznie wyłączona strona. `cardTone` zostaje jednak
    // neutralny, bo zapisów już nie przyjmuje.
    tone: "bg-[#c5e96b]/40 text-[#0c493e]",
    cardTone: "idle",
  },
};

export function describeWaitlistStatus(
  status: WaitlistPageStatus,
): WaitlistStatusBadge {
  return STATUS_BADGES[status];
}
