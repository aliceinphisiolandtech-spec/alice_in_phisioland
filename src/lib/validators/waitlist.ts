import { z } from "zod";

/**
 * Walidacja zapisu na listę oczekujących.
 *
 * Komunikaty są po polsku i pisane wprost do użytkownika — front pokazuje je
 * bez tłumaczenia, dlatego `noValidate` na formularzu (patrz WaitlistForm):
 * chodzi o to, żeby zamiast angielskich dymków przeglądarki lecieli nasi.
 */

export const WaitlistEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Podaj swój adres e-mail.")
  .max(254, "Ten adres e-mail jest za długi.")
  // Przykład celowo z gmail.com — formularz i tak prosi o konto Google, więc
  // podpowiedź w komunikacie o błędzie nie powinna sugerować czegoś innego.
  .email("Wpisz poprawny adres e-mail (np. jan.kowalski@gmail.com).");

export const WaitlistNameSchema = z
  .string()
  .trim()
  .min(2, "Imię musi mieć minimum 2 znaki.")
  .max(60, "Imię może mieć maksymalnie 60 znaków.");

export const SubscribeToWaitlistSchema = z.object({
  /** Której kampanii dotyczy zapis — slug ze ścieżki /zapisy/<slug>. */
  slug: z.string().trim().min(1),

  email: WaitlistEmailSchema,

  /**
   * Imię jest opcjonalne na poziomie schematu, bo o tym, czy jest wymagane,
   * decyduje ustawienie `collectName` konkretnej strony — a to wiemy dopiero
   * po odczycie z bazy. Twardy warunek dokłada endpoint.
   */
  name: WaitlistNameSchema.optional(),

  consent: z.literal(true, {
    message: "Zaznacz zgodę, żeby dokończyć zapis.",
  }),

  /**
   * Pułapka na boty (honeypot). Pole jest ukryte wizualnie i wyłączone
   * z nawigacji klawiaturą, więc człowiek nie ma jak go wypełnić — jeśli
   * cokolwiek w nim jest, to automat.
   *
   * Schemat przyjmuje TU DOWOLNY tekst i celowo niczego nie odrzuca.
   * Decyzję podejmuje dopiero endpoint: odpowiada sukcesem i nic nie zapisuje.
   * Walidacja typu „to pole musi być puste" byłaby tu błędem — bot dostawałby
   * komunikat wprost mówiący, że istnieje ukryte pole i jak je obejść.
   */
  website: z.string().max(500).optional(),
});

export type SubscribeToWaitlistInput = z.infer<
  typeof SubscribeToWaitlistSchema
>;

/**
 * Slug kampanii — to jest widoczny fragment linku wklejanego w post, więc
 * dopuszczamy wyłącznie znaki bezpieczne w URL-u, bez polskich liter.
 */
export const WaitlistSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Adres musi mieć minimum 3 znaki.")
  .max(60, "Adres może mieć maksymalnie 60 znaków.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Adres może zawierać tylko małe litery, cyfry i myślniki (np. promocja-lato).",
  );

/**
 * Slugi zarezerwowane — nazwy, które kolidowałyby z istniejącymi ścieżkami
 * albo z przyszłymi podstronami sekcji `/zapisy`. Blokujemy je w kreatorze,
 * bo kolizja objawiłaby się dopiero jako dziwnie zachowujący się link
 * wklejony już do posta.
 */
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "new",
  "nowa",
  "edit",
  "edytuj",
  "podglad",
  "preview",
  "zapisy",
]);

/**
 * Adres, który nie może być slugiem kampanii.
 *
 * Wydzielone jako gotowy schemat, bo używa go i kreator (Etap 2), i szybka
 * edycja z listy (Etap 1). Gdyby każde miejsce miało własną kopię reguły,
 * jedno z nich prędzej czy później przepuściłoby adres, którego drugie
 * zabrania — a kolizja wychodzi dopiero jako dziwnie działający link
 * wklejony już do posta.
 */
export const CampaignSlugSchema = WaitlistSlugSchema.refine(
  (value) => !RESERVED_SLUGS.has(value),
  "Ten adres jest zarezerwowany — wybierz inny.",
);

/** Nazwa robocza kampanii — widoczna wyłącznie w panelu. */
export const CampaignNameSchema = z
  .string()
  .trim()
  .min(3, "Nazwa robocza musi mieć minimum 3 znaki.")
  .max(120, "Nazwa robocza może mieć maksymalnie 120 znaków.");

/** Nagłówek widoczny na stronie kampanii. */
export const CampaignHeadlineSchema = z
  .string()
  .trim()
  .min(3, "Nagłówek jest wymagany.")
  .max(160, "Nagłówek może mieć maksymalnie 160 znaków.");

/* -------------------------------------------------------------------------- */
/* Szybka edycja z listy                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Nazwa robocza i adres — pola kampanii edytowalne bez kreatora.
 *
 * Osobny, wąski schemat zamiast `SaveWaitlistPageSchema` nie jest wygodą, tylko
 * zabezpieczeniem: akcja przyjmująca to wejście NIE MA JAK zmienić treści
 * strony, bo tych pól po prostu nie dostaje. Przy pełnym schemacie panel
 * musiałby odsyłać całą kampanię tylko po to, żeby poprawić jedno słowo.
 */
export const EditWaitlistBasicsSchema = z.object({
  name: CampaignNameSchema,
  slug: CampaignSlugSchema,
});

export type EditWaitlistBasicsInput = z.infer<typeof EditWaitlistBasicsSchema>;

/* -------------------------------------------------------------------------- */
/* Zapis kampanii z kreatora                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Adres grafiki. Wymagamy http(s), bo wartość ląduje wprost w `src` obrazka
 * i w tagu `og:image` — a tam adres względny albo `javascript:` nie ma czego
 * szukać.
 */
const ImageUrlSchema = z
  .string()
  .trim()
  .max(2000, "Adres grafiki jest zbyt długi.")
  .refine(
    (value) => value === "" || /^https?:\/\/\S+$/i.test(value),
    "Adres grafiki musi zaczynać się od http:// lub https://",
  )
  // Puste pole i brak pola to dla bazy to samo — normalizujemy do null,
  // żeby w kolumnie nie mieszały się dwa sposoby zapisu „nie ustawiono".
  .transform((value) => (value === "" ? null : value))
  .nullable();

/** Data z kalendarza w panelu: ISO albo brak. Tak samo jak przy rabatach. */
const IsoDateSchema = z
  .string()
  .datetime({ message: "Nieprawidłowa data." })
  .nullable();

export const SaveWaitlistPageSchema = z
  .object({
    slug: CampaignSlugSchema,
    name: CampaignNameSchema,

    // --- Treść ---
    headline: CampaignHeadlineSchema,
    highlight: z
      .string()
      .trim()
      .max(80, "Wyróżniony fragment może mieć maksymalnie 80 znaków.")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    description: z
      .string()
      .trim()
      .min(10, "Opis jest wymagany (minimum 10 znaków).")
      .max(2000, "Opis może mieć maksymalnie 2000 znaków."),
    ctaLabel: z
      .string()
      .trim()
      .min(2, "Napis na przycisku jest wymagany.")
      .max(40, "Napis na przycisku może mieć maksymalnie 40 znaków."),
    footnote: z
      .string()
      .trim()
      .max(160, "Przypis może mieć maksymalnie 160 znaków.")
      .transform((value) => (value === "" ? null : value))
      .nullable(),

    // --- Ekran po zapisaniu ---
    successTitle: z
      .string()
      .trim()
      .min(2, "Tytuł potwierdzenia jest wymagany.")
      .max(80, "Tytuł potwierdzenia może mieć maksymalnie 80 znaków."),
    successMessage: z
      .string()
      .trim()
      .min(5, "Treść potwierdzenia jest wymagana.")
      .max(1000, "Treść potwierdzenia może mieć maksymalnie 1000 znaków."),

    // --- Zgoda ---
    // Bez zgody nie wolno wysyłać informacji handlowych, więc pole jest
    // wymagane i ma sensowną długość minimalną — pusta „zgoda" niczego nie
    // dowodzi, a to jej treść zapisujemy przy każdym kontakcie.
    consentText: z
      .string()
      .trim()
      .min(30, "Treść zgody jest wymagana (minimum 30 znaków).")
      .max(1000, "Treść zgody może mieć maksymalnie 1000 znaków."),

    // --- MailerLite ---
    mailerliteGroupId: z
      .string()
      .trim()
      .max(64)
      .transform((value) => (value === "" ? null : value))
      .nullable(),

    collectName: z.boolean(),

    // --- Wygląd ---
    layoutVariant: z.enum(["card", "split", "hero"], {
      message: "Wybierz układ strony.",
    }),
    theme: z.enum(["forest", "light", "ink"], {
      message: "Wybierz motyw kolorystyczny.",
    }),
    heroImageUrl: ImageUrlSchema,
    ogImageUrl: ImageUrlSchema,
    backgroundImageUrl: ImageUrlSchema,
    // Krycie nakładki nad zdjęciem. Pełny zakres jest dozwolony: 0 (samo
    // zdjęcie) bywa potrzebne przy grafice już przygotowanej pod tekst,
    // a 100 (sam kolor) to szybki sposób na chwilowe wyłączenie zdjęcia
    // bez kasowania adresu.
    overlayOpacity: z
      .number()
      .int("Krycie musi być liczbą całkowitą.")
      .min(0, "Krycie nie może być mniejsze niż 0%.")
      .max(100, "Krycie nie może przekraczać 100%."),

    // --- Okno zapisów ---
    isActive: z.boolean(),
    opensAt: IsoDateSchema,
    closesAt: IsoDateSchema,
    /**
     * Twardy limit liczby zapisów. `null` = bez limitu.
     *
     * Zero jest dozwolone celowo — to poprawny sposób na natychmiastowe
     * zatrzymanie zapisów bez ruszania wyłącznika (strona zostaje pod tym
     * samym adresem i pokazuje komunikat o komplecie).
     */
    maxSignups: z
      .number()
      .int("Limit musi być liczbą całkowitą.")
      .min(0, "Limit nie może być ujemny.")
      .max(1_000_000, "Limit jest zbyt duży.")
      .nullable(),
    closedMessage: z
      .string()
      .trim()
      .max(1000, "Komunikat może mieć maksymalnie 1000 znaków.")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
  })
  .refine(
    (data) =>
      !data.opensAt ||
      !data.closesAt ||
      new Date(data.closesAt) > new Date(data.opensAt),
    {
      message: "Data zakończenia musi być późniejsza niż data rozpoczęcia.",
      path: ["closesAt"],
    },
  )
  .refine(
    // Układ „pełne tło" bez grafiki to pusty ekran — lepiej powiedzieć to
    // w formularzu niż pozwolić opublikować link do niczego.
    (data) => data.layoutVariant !== "hero" || Boolean(data.heroImageUrl),
    {
      message: "Układ „Pełne tło” wymaga adresu grafiki.",
      path: ["heroImageUrl"],
    },
  );

export type SaveWaitlistPageInput = z.infer<typeof SaveWaitlistPageSchema>;

/**
 * Sprowadza tekst do alfabetu adresu: małe litery, cyfry i myślniki.
 *
 * Polskie znaki rozkładamy przez normalizację NFD i usunięcie znaków
 * diakrytycznych. `ł` tego nie łapie (to osobna litera, nie `l` z ogonkiem),
 * więc podmieniamy je jawnie przed normalizacją.
 *
 * Ciąg niedozwolonych znaków schodzi do JEDNEGO myślnika — a że sam myślnik
 * też do nich należy, „lato -- 2026" wychodzi jako „lato-2026" bez osobnej
 * reguły. Myślniki na krańcach zostają: co z nimi zrobić, zależy od tego,
 * czy adres jest właśnie wpisywany, czy już zapisywany.
 */
function toSlugAlphabet(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFD")
      // Zakres łączących znaków diakrytycznych zapisany kodami, nie dosłownie —
      // dosłowny zapis to niewidoczne znaki w źródle, które gubią się przy
      // kopiowaniu pliku i zmianie kodowania.
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
  );
}

/**
 * Zamienia dowolny tekst na GOTOWY adres — kreator podpowiada go z nazwy
 * roboczej, a formularze normalizują nim przy zapisie to, co zostało wpisane.
 */
export function slugifyWaitlistName(value: string): string {
  return (
    toSlugAlphabet(value)
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      // Obcięcie do 60 znaków mogło zostawić myślnik na końcu.
      .replace(/-+$/g, "")
  );
}

/**
 * Normalizacja adresu W TRAKCIE PISANIA.
 *
 * Różni się od `slugifyWaitlistName` jedną rzeczą: nie ucina myślnika z KOŃCA.
 * Brzmi to jak drobiazg, a przesądza o tym, czy da się w ogóle wpisać adres
 * z myślnikiem — przy ucinaniu każdy świeżo wpisany „-" (i każda spacja, która
 * się w niego zamienia) znikał w tej samej chwili, w której powstał, więc
 * „promocja-lato" kończyło się jako „promocjalato".
 *
 * Myślnik z POCZĄTKU ucinamy dalej: adres nie może się od niego zaczynać,
 * a — w odróżnieniu od końcówki — nie jest to stan przejściowy w drodze do
 * poprawnej wartości.
 *
 * Wynik bywa więc chwilowo niezgodny ze schematem (kończy się myślnikiem),
 * dlatego przy zapisie przepuszczamy go jeszcze przez `slugifyWaitlistName`.
 */
export function slugifyWaitlistInput(value: string): string {
  return toSlugAlphabet(value).replace(/^-+/, "").slice(0, 60);
}
