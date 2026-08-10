/**
 * Warianty wyglądu stron zapisów — jedno źródło prawdy dla kreatora w panelu
 * i dla strony publicznej.
 *
 * W bazie trzymamy sam KLUCZ (`"card"`, `"forest"`), nigdy gotowe klasy CSS.
 * Gdyby w kolumnie siedziały klasy Tailwinda, każda zmiana designu wymagałaby
 * migracji danych, a kampanie sprzed zmiany wyglądałyby inaczej niż nowe.
 *
 * Klasy są wypisane w całości, bez sklejania w locie (`bg-${color}-500`) —
 * Tailwind skanuje kod statycznie i klasa zbudowana z fragmentów nie trafiłaby
 * do builda. To jest powód, dla którego poniżej jest tyle powtórzeń.
 *
 * Plik jest czysty (bez Prismy i importów serwerowych), więc korzystają z niego
 * zarówno komponenty klienckie kreatora, jak i renderowanie po stronie serwera.
 */

/* -------------------------------------------------------------------------- */
/* Układ                                                                       */
/* -------------------------------------------------------------------------- */

export const WAITLIST_LAYOUTS = [
  {
    value: "card",
    label: "Karta",
    description:
      "Wyśrodkowana karta z formularzem. Uniwersalna, działa zawsze.",
  },
  {
    value: "split",
    label: "Dwie kolumny",
    description: "Tekst po lewej, formularz po prawej. Wymaga dłuższego opisu.",
  },
  {
    value: "hero",
    label: "Pełne tło",
    description: "Grafika na całą szerokość. Wymaga adresu obrazka.",
  },
] as const;

export type WaitlistLayout = (typeof WAITLIST_LAYOUTS)[number]["value"];

const LAYOUT_VALUES = WAITLIST_LAYOUTS.map((layout) => layout.value);

/**
 * Klucz z bazy -> wariant. Nieznana wartość spada na „kartę".
 *
 * Kolumna jest zwykłym tekstem (bez enuma w Postgresie), więc może w niej
 * wylądować cokolwiek — po ręcznej edycji w bazie albo po usunięciu wariantu
 * z kodu. Strona kampanii ma się wtedy wyświetlić, a nie wywalić.
 */
export function resolveLayout(
  value: string | null | undefined,
): WaitlistLayout {
  return LAYOUT_VALUES.includes(value as WaitlistLayout)
    ? (value as WaitlistLayout)
    : "card";
}

/* -------------------------------------------------------------------------- */
/* Motyw kolorystyczny                                                         */
/* -------------------------------------------------------------------------- */

export const WAITLIST_THEMES = [
  { value: "forest", label: "Zielony", description: "Kolory marki." },
  { value: "light", label: "Jasny", description: "Delikatny, na jasnym tle." },
  { value: "ink", label: "Grafitowy", description: "Mocny kontrast, limonka." },
] as const;

export type WaitlistTheme = (typeof WAITLIST_THEMES)[number]["value"];

const THEME_VALUES = WAITLIST_THEMES.map((theme) => theme.value);

export function resolveTheme(value: string | null | undefined): WaitlistTheme {
  return THEME_VALUES.includes(value as WaitlistTheme)
    ? (value as WaitlistTheme)
    : "forest";
}

/** Komplet klas dla jednego motywu. */
export interface ThemeTokens {
  /** Tło całej strony (layout). */
  page: string;
  /** Karta z treścią. */
  surface: string;
  /** Nagłówek. */
  heading: string;
  /** Tekst opisu. */
  body: string;
  /** Drobny tekst (stopka, przypis). */
  muted: string;
  /** Podkreślenie wyróżnionego fragmentu nagłówka. */
  highlight: string;
  /** Główny przycisk. */
  button: string;
  /** Pole formularza. */
  input: string;
  /** Ramka i tło komunikatów (sukces, zapisy zamknięte). */
  notice: string;
  /** Kółko z ikoną w komunikacie. */
  noticeIcon: string;
  /** Linki w stopce layoutu. */
  footerLink: string;
  /**
   * Kolor nakładki kładzionej na zdjęcie w tle strony. Zawsze ciemny — to od
   * niego zależy, czy tekst na zdjęciu da się przeczytać.
   */
  overlay: string;
  /**
   * Wariant logo. Na ciemnym tle potrzebny jest negatyw — logo w kolorze
   * marki zlewa się z tłem i znika.
   */
  logoSrc: string;
}

export const THEME_TOKENS: Record<WaitlistTheme, ThemeTokens> = {
  forest: {
    page: "bg-primary",
    surface: "bg-white",
    heading: "text-primary",
    body: "text-black/70",
    muted: "text-black/45",
    highlight: "bg-accent/50",
    button: "bg-primary text-white hover:bg-[#0a3b32]",
    input:
      "border-black/10 bg-white text-black placeholder:text-black/35 focus:border-primary focus:ring-accent/50",
    notice: "border-primary/15 bg-contrast/50",
    noticeIcon: "bg-primary text-accent",
    footerLink: "text-white/55 hover:text-accent",
    overlay: "bg-primary",
    logoSrc: "/AW-logo-negatyw.svg",
  },
  light: {
    page: "bg-contrast",
    surface: "bg-white",
    heading: "text-primary",
    body: "text-black/70",
    muted: "text-black/45",
    highlight: "bg-accent/60",
    button: "bg-primary text-white hover:bg-[#0a3b32]",
    input:
      "border-black/10 bg-white text-black placeholder:text-black/35 focus:border-primary focus:ring-accent/50",
    notice: "border-primary/15 bg-contrast/60",
    noticeIcon: "bg-primary text-accent",
    footerLink: "text-primary/60 hover:text-primary",
    overlay: "bg-primary",
    logoSrc: "/AW-logo.svg",
  },
  ink: {
    page: "bg-[#12141a]",
    surface: "bg-[#1b1e26]",
    heading: "text-white",
    body: "text-white/70",
    muted: "text-white/45",
    highlight: "bg-accent/35",
    button: "bg-accent text-[#12141a] hover:bg-[#b6dd5c]",
    input:
      "border-white/15 bg-white/5 text-white placeholder:text-white/35 focus:border-accent focus:ring-accent/40",
    notice: "border-white/10 bg-white/5",
    noticeIcon: "bg-accent text-[#12141a]",
    footerLink: "text-white/45 hover:text-accent",
    overlay: "bg-[#12141a]",
    logoSrc: "/AW-logo-negatyw.svg",
  },
};

/* -------------------------------------------------------------------------- */
/* Treść leżąca na zdjęciu w tle                                               */
/* -------------------------------------------------------------------------- */

/**
 * Nadpisania kolorów dla treści leżącej NA zdjęciu z nakładką.
 *
 * Nakładka jest zawsze ciemna (kolor marki albo grafit), więc treść musi
 * przejść na jasną — niezależnie od motywu. Bez tego nagłówek w motywie
 * „Zielony" byłby ciemnozielonym napisem na ciemnozielonej nakładce.
 *
 * Dotyczy WYŁĄCZNIE treści poza kartą (nagłówek w układzie „dwie kolumny",
 * stopka). Karta ma własne, nieprzezroczyste tło i zostaje przy kolorach
 * motywu — zdjęcie leży pod nią, nie w niej.
 */
const ON_IMAGE_OVERRIDES: Partial<Record<WaitlistTheme, Partial<ThemeTokens>>> =
  {};

/** Wspólna część nadpisań — identyczna dla każdego motywu (nakładka i tak jest ciemna). */
const ON_IMAGE_COMMON = {
  heading: "text-white",
  body: "text-white/80",
  muted: "text-white/60",
  highlight: "bg-accent/60",
  button: "bg-accent text-[#0c493e] hover:bg-[#b6dd5c]",
  input:
    "border-white/25 bg-white/10 text-white placeholder:text-white/50 focus:border-accent focus:ring-accent/40",
  notice: "border-white/20 bg-white/10",
  noticeIcon: "bg-accent text-[#0c493e]",
  // Motyw „Jasny" ma linki stopki w kolorze marki — na ciemnej nakładce
  // zniknęłyby, więc one też przechodzą na jasne.
  footerLink: "text-white/55 hover:text-accent",
} as const;

/**
 * Tokeny dla treści leżącej na tle strony.
 *
 * Bez zdjęcia to zwykłe tokeny motywu. Ze zdjęciem — wersja „na ciemnym".
 * Funkcja istnieje po to, żeby decyzja zapadała w JEDNYM miejscu: strona,
 * kanwa kreatora i formularz pytają o to samo i nie mogą się rozjechać.
 */
export function resolveOnImageTokens(
  tokens: ThemeTokens,
  theme: WaitlistTheme,
  hasBackgroundImage: boolean,
): ThemeTokens {
  if (!hasBackgroundImage) return tokens;

  return {
    ...tokens,
    ...ON_IMAGE_COMMON,
    ...ON_IMAGE_OVERRIDES[theme],
  };
}

/**
 * Typografia treści kampanii — jedno miejsce dla strony i dla kreatora.
 *
 * Kreator wstawia w miejsce nagłówka i opisu pola edytowalne. Muszą mieć
 * CO DO PIKSELA tę samą typografię, inaczej tekst przeskakiwałby przy każdym
 * wejściu w edycję i wyjściu z niej, a długość linii w kreatorze nie mówiłaby
 * nic o długości linii na stronie.
 */
export const HEADLINE_CLASSES =
  "text-[26px] leading-[125%] font-bold sm:text-[38px]";

export const DESCRIPTION_CLASSES =
  "mt-3 text-[14px] leading-[160%] whitespace-pre-line sm:mt-4 sm:text-[15px] sm:leading-[165%]";

/**
 * Miniatura motywu do kreatora — trzy kropki pokazujące tło, powierzchnię
 * i kolor przycisku. Tailwind musi zobaczyć te klasy dosłownie, stąd osobna
 * mapa zamiast wyciągania ich z `THEME_TOKENS` (tam siedzą w dłuższych
 * ciągach razem ze stanami hover i focus).
 */
export const THEME_SWATCHES: Record<WaitlistTheme, [string, string, string]> = {
  forest: ["bg-primary", "bg-white", "bg-accent"],
  light: ["bg-contrast", "bg-white", "bg-primary"],
  ink: ["bg-[#12141a]", "bg-[#1b1e26]", "bg-accent"],
};
