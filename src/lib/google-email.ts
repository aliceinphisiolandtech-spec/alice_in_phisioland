/**
 * Rozpoznanie, czy adres e-mail nadaje się na konto Google.
 *
 * Dostęp do materiałów działa wyłącznie przez logowanie Google, więc adres
 * podany przy zapisie musi dać się użyć jako login Google. Problem w tym, że
 * z samego adresu NIE DA SIĘ tego stwierdzić na pewno: gabinet z własną domeną
 * w Google Workspace ma adresy w rodzaju `anna@klinika.pl` — wyglądają jak
 * dowolna inna poczta, a logują się do Google normalnie.
 *
 * Dlatego to NIE jest walidacja, tylko podpowiedź dla formularza: rozstrzyga,
 * czy warto dopytać „na pewno ten adres?", a nie czy zapis wolno przyjąć.
 * Twarda blokada odcięłaby realne klientki z Workspace, a zapis na listę jest
 * jednorazową szansą — kto odbije się od komunikatu „zły adres", ten zwykle
 * nie wraca.
 */

/**
 * Co wiemy o dostawcy poczty:
 * - `google` — na pewno konto Google (gmail.com i spółka),
 * - `foreign` — na pewno NIE Google (znany dostawca poczty, np. wp.pl),
 * - `unknown` — własna domena; może być Workspace, może nie być.
 */
export type EmailProviderVerdict = "google" | "foreign" | "unknown";

/** Domeny konsumenckie Google. `googlemail.com` to ten sam Gmail w Niemczech. */
const GOOGLE_DOMAINS = ["gmail.com", "googlemail.com", "google.com"];

/**
 * Znani dostawcy poczty, którzy z Google nie mają nic wspólnego.
 *
 * Lista jest po to, żeby móc powiedzieć wprost „adres w wp.pl nie jest kontem
 * Google" zamiast miękkiego „nie wygląda na". Nie musi być kompletna —
 * czego tu nie ma, wpada do `unknown` i dostaje łagodniejszy komunikat.
 */
const FOREIGN_DOMAINS = [
  // Polska
  "wp.pl",
  "o2.pl",
  "onet.pl",
  "onet.eu",
  "interia.pl",
  "interia.eu",
  "gazeta.pl",
  "op.pl",
  "go2.pl",
  "tlen.pl",
  "vp.pl",
  "poczta.fm",
  "spoko.pl",
  "buziaczek.pl",
  "autograf.pl",
  "wp.eu",
  // Reszta świata
  "outlook.com",
  "outlook.pl",
  "hotmail.com",
  "hotmail.pl",
  "live.com",
  "live.pl",
  "msn.com",
  "yahoo.com",
  "yahoo.pl",
  "yahoo.co.uk",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.de",
  "web.de",
  "mail.ru",
  "yandex.ru",
  "seznam.cz",
  "zoho.com",
  "fastmail.com",
  "tuta.com",
  "tutanota.com",
];

/**
 * Domena z adresu, sprowadzona do małych liter. `null`, gdy adresu nie da się
 * rozłożyć na część przed i po `@`.
 *
 * Szukamy OSTATNIEGO `@`, bo tylko on oddziela domenę — wcześniejsze mogą
 * legalnie siedzieć w części lokalnej ujętej w cudzysłów.
 */
export function emailDomain(email: string): string | null {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf("@");

  // Potrzebujemy czegoś po obu stronach `@`.
  if (at < 1 || at === value.length - 1) return null;

  return value.slice(at + 1);
}

/**
 * Czy domena należy do dostawcy z listy — wprost albo jako jego poddomena.
 *
 * Poddomeny liczą się, bo część dostawców rozdaje adresy właśnie tak
 * (`poczta.onet.pl`), a `endsWith` bez kropki dałoby fałszywe trafienie:
 * `niegmail.com` kończy się na `gmail.com`.
 */
function matchesDomain(domain: string, list: string[]): boolean {
  return list.some(
    (candidate) => domain === candidate || domain.endsWith(`.${candidate}`),
  );
}

export function classifyEmailProvider(email: string): EmailProviderVerdict {
  const domain = emailDomain(email);

  // Adres bez sensownej domeny nie jest tematem tego pliku — zatrzyma go
  // walidacja formatu. Tutaj nie ma o co pytać.
  if (!domain) return "unknown";

  if (matchesDomain(domain, GOOGLE_DOMAINS)) return "google";
  if (matchesDomain(domain, FOREIGN_DOMAINS)) return "foreign";

  return "unknown";
}

/** Skrót do warunku „trzeba dopytać". */
export function needsGoogleEmailConfirmation(email: string): boolean {
  return classifyEmailProvider(email) !== "google";
}

/**
 * Stała informacja pod polem e-mail. Widoczna ZAWSZE, także przy poprawnym
 * Gmailu — ma zdążyć przed wpisaniem adresu, a nie tłumaczyć po fakcie.
 */
export const GOOGLE_EMAIL_HINT =
  "Potrzebny adres Google — Gmail albo służbowy w Google Workspace. Na innym nie zalogujesz się do konta z dostępem.";
