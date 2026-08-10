import type { WaitlistLayout, WaitlistTheme } from "@/lib/waitlist-appearance";

/**
 * Kształt danych przekazywanych z serwera do komponentów klienckich kreatora.
 *
 * Daty są napisami ISO, nie obiektami `Date` — granica serwer/klient w Next
 * serializuje je i tak, a jawny typ `string` chroni przed pomyłką w drugą
 * stronę (próbą wywołania metody `Date` na czymś, co nią już nie jest).
 * Tak samo robi panel rabatów, patrz `admin/rabaty/types.ts`.
 */
export interface WaitlistPageRow {
  id: string;
  slug: string;
  name: string;

  headline: string;
  highlight: string | null;
  description: string;
  ctaLabel: string;
  footnote: string | null;

  successTitle: string;
  successMessage: string;
  consentText: string;

  mailerliteGroupId: string | null;
  collectName: boolean;

  layoutVariant: WaitlistLayout;
  theme: WaitlistTheme;
  heroImageUrl: string | null;
  ogImageUrl: string | null;
  backgroundImageUrl: string | null;
  overlayOpacity: number;

  isActive: boolean;
  opensAt: string | null;
  closesAt: string | null;
  maxSignups: number | null;
  closedMessage: string | null;

  createdAt: string;

  // --- Statystyki ---
  /** Wszystkie zebrane kontakty. */
  subscriberCount: number;
  /**
   * PIERWSZA STRONA zapisanych osób, od najnowszej — tyle, ile mieści
   * `SUBSCRIBERS_PER_PAGE`. Kolejne strony panel dobiera sam, z trasy
   * `/api/admin/waitlist/[id]/subscribers`.
   */
  subscribers: WaitlistSubscriberRow[];
  /** Kontakty z ostatnich 7 dni — pokazuje, czy kampania jeszcze żyje. */
  recentCount: number;
  /** Liczba zapisów per dzień, ostatnie 30 dni (od najstarszego). */
  dailySignups: DailySignups[];
  /** Ile kontaktów czeka na przekazanie do MailerLite albo się nie udało. */
  unsyncedCount: number;
}

/**
 * Ile zapisanych osób mieści jedna strona listy w panelu.
 *
 * Stała siedzi TUTAJ, a nie przy zapytaniach: tę samą liczbę musi znać serwer
 * (żeby wyciąć właściwy zakres) i przeglądarka (żeby policzyć, ile jest stron).
 * Dwie kopie rozjechałyby się przy pierwszej zmianie i ostatnia strona
 * wychodziłaby pusta albo niedostępna.
 */
export const SUBSCRIBERS_PER_PAGE = 20;

/**
 * Jedna zapisana osoba na liście w panelu.
 *
 * Świadomie BEZ treści zgody, adresu IP i przeglądarki, choć baza je trzyma:
 * na ekranie te dane nie pomagają w niczym, co panel ma robić, a każde ich
 * wyświetlenie to kolejne miejsce, w którym mogą wyciec. Komplet wymagany
 * przy RODO wychodzi eksportem do CSV — świadomą decyzją, a nie samym
 * otwarciem strony.
 */
export interface WaitlistSubscriberRow {
  id: string;
  email: string;
  name: string | null;
  /** ISO — patrz uwaga o datach na górze pliku. */
  createdAt: string;
  /** "pending" | "synced" | "failed" | "skipped" */
  syncStatus: string;
}

export interface DailySignups {
  /** "RRRR-MM-DD" w czasie warszawskim. */
  date: string;
  /** Skrócona etykieta na oś wykresu, np. "07.08". */
  label: string;
  count: number;
}

/* -------------------------------------------------------------------------- */
/* Stan kreatora                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Kształt edytowanej kampanii w kreatorze.
 *
 * Wszystko jest napisem albo wartością logiczną — także daty, które kalendarz
 * trzyma jako czas lokalny („RRRR-MM-DDTGG:MM", patrz `lib/date-input`).
 * Pola opcjonalne są tu pustymi napisami, nie `null`: pole tekstowe w Reakcie
 * nie może dostać `null` bez przełączenia się w tryb niekontrolowany.
 * Zamianę na `null` robi walidator przy zapisie.
 */
export interface CampaignFormState {
  name: string;
  slug: string;
  headline: string;
  highlight: string;
  description: string;
  ctaLabel: string;
  footnote: string;
  successTitle: string;
  successMessage: string;
  consentText: string;
  mailerliteGroupId: string;
  collectName: boolean;
  layoutVariant: WaitlistLayout;
  theme: WaitlistTheme;
  heroImageUrl: string;
  ogImageUrl: string;
  backgroundImageUrl: string;
  overlayOpacity: number;
  isActive: boolean;
  opensAt: string;
  closesAt: string;
  /** Pusty napis = bez limitu. Pole liczbowe w formularzu bywa puste. */
  maxSignups: string;
  closedMessage: string;
}

/** Domyślne treści nowej kampanii — punkt wyjścia, nie puste pola. */
export const CAMPAIGN_DEFAULTS = {
  headline: "Bądź pierwsza w kolejce",
  description:
    "Napisz tutaj, co dostanie osoba, która się zapisze, i dlaczego warto zrobić to teraz.",
  ctaLabel: "Zapisz mnie na listę",
  footnote: "Bez spamu. Wypisujesz się jednym kliknięciem.",
  successTitle: "Jesteś na liście!",
  successMessage:
    "Dam Ci znać mailem, gdy tylko ruszymy.\n\nSprawdź proszę skrzynkę (czasem także folder Oferty lub Spam) i dodaj mój adres do kontaktów.",
  consentText:
    "Zgadzam się na otrzymywanie informacji handlowych na podany adres e-mail. Administratorem danych jest Alicja Wójcik (Alice in Physioland). Zgodę mogę wycofać w każdej chwili, klikając link w stopce wiadomości.",
  closedMessage:
    "Zapisy na tę listę są już zamknięte. Zajrzyj na stronę główną, żeby sprawdzić, co jest aktualnie dostępne.",
} as const;

/** Rekord z bazy (albo jego brak) -> stan kreatora. */
export function initialCampaignState(
  row: WaitlistPageRow | null,
  isoToLocal: (iso: string | null) => string,
): CampaignFormState {
  if (!row) {
    return {
      name: "",
      slug: "",
      headline: CAMPAIGN_DEFAULTS.headline,
      highlight: "",
      description: CAMPAIGN_DEFAULTS.description,
      ctaLabel: CAMPAIGN_DEFAULTS.ctaLabel,
      footnote: CAMPAIGN_DEFAULTS.footnote,
      successTitle: CAMPAIGN_DEFAULTS.successTitle,
      successMessage: CAMPAIGN_DEFAULTS.successMessage,
      consentText: CAMPAIGN_DEFAULTS.consentText,
      mailerliteGroupId: "",
      collectName: false,
      layoutVariant: "card",
      theme: "forest",
      heroImageUrl: "",
      ogImageUrl: "",
      backgroundImageUrl: "",
      overlayOpacity: 50,
      // Nowa kampania startuje WYŁĄCZONA — publikacja to osobny, świadomy klik,
      // tak samo jak przy nowym kodzie rabatowym.
      isActive: false,
      opensAt: "",
      closesAt: "",
      maxSignups: "",
      closedMessage: CAMPAIGN_DEFAULTS.closedMessage,
    };
  }

  return {
    name: row.name,
    slug: row.slug,
    headline: row.headline,
    highlight: row.highlight ?? "",
    description: row.description,
    ctaLabel: row.ctaLabel,
    footnote: row.footnote ?? "",
    successTitle: row.successTitle,
    successMessage: row.successMessage,
    consentText: row.consentText,
    mailerliteGroupId: row.mailerliteGroupId ?? "",
    collectName: row.collectName,
    layoutVariant: row.layoutVariant,
    theme: row.theme,
    heroImageUrl: row.heroImageUrl ?? "",
    ogImageUrl: row.ogImageUrl ?? "",
    backgroundImageUrl: row.backgroundImageUrl ?? "",
    overlayOpacity: row.overlayOpacity,
    isActive: row.isActive,
    opensAt: isoToLocal(row.opensAt),
    closesAt: isoToLocal(row.closesAt),
    maxSignups: row.maxSignups === null ? "" : String(row.maxSignups),
    closedMessage: row.closedMessage ?? "",
  };
}

/** Grupa z konta MailerLite — do listy wyboru w formularzu. */
export interface MailerliteGroupOption {
  id: string;
  name: string;
  activeCount: number;
}

/** Stan pobierania grup. Formularz musi umieć działać w każdym z nich. */
export type GroupsState =
  | { status: "loading" }
  | { status: "ok"; groups: MailerliteGroupOption[] }
  | { status: "not_configured"; message: string }
  | { status: "unavailable"; message: string };
