/**
 * Jedyne źródło prawdy o cenie e-booka.
 *
 * Wcześniej cena żyła w dwóch niezależnych miejscach (endpoint tworzący
 * PaymentIntent + tekst w podsumowaniu zamówienia). Przy rabatach taki rozjazd
 * kończy się tym, że klientka widzi na stronie inną kwotę niż realnie pobiera
 * Stripe — dlatego wszystkie kwoty liczymy z tych stałych.
 *
 * Moduł jest celowo wolny od importów serwerowych (prisma, next-auth), żeby mógł
 * być używany również w komponentach klienckich.
 */

/**
 * Ceny startowe. Od czasu wprowadzenia tabeli PricingSettings są to wyłącznie
 * WARTOŚCI DOMYŚLNE — realną cenę czyta się z bazy (src/lib/pricing-settings.ts).
 * Zostają jako bezpiecznik, gdyby wiersz ustawień nie istniał.
 */
export const DEFAULT_REGULAR_PRICE_GROSZE = 14900;
export const DEFAULT_BASE_PRICE_GROSZE = 10900;

/** Cena dla testerów w trakcie zamkniętego tygodnia testowego. */
export const TESTER_PRICE_GROSZE = 8900;

/** Waluta przekazywana do Stripe i zapisywana przy zamówieniu. */
export const CHECKOUT_CURRENCY = "pln";

/**
 * Minimalna kwota, którą Stripe przyjmie dla PLN (2,00 zł).
 * Rabat nigdy nie może zbić ceny poniżej tego progu — inaczej `paymentIntents.create`
 * zwróci błąd i klientka utknie na pustym formularzu płatności.
 */
export const MIN_CHARGE_GROSZE = 200;

/** Lista testerów z zamkniętego okresu testowego (współdzielona przez klienta i serwer). */
export const TESTERS_WHITELIST = [
  "juszczakmat@gmail.com",
  "aleksandra.kozlowska38@gmail.com",
  "mlech.pan@gmail.com",
  "gaskaula9@gmail.com",
  "kosminskanatalia95@gmail.com",
  "biuro@kocikdev.com",
];

export function isTesterEmail(email?: string | null): boolean {
  if (!email) return false;
  return TESTERS_WHITELIST.includes(email.toLowerCase());
}

/**
 * Cena bazowa PRZED rabatem, z uwzględnieniem trybu testowego.
 * Rabat liczymy zawsze od tej kwoty — nigdy od ceny regularnej — żeby tester
 * nie dostał podwójnej obniżki liczonej od innej podstawy.
 *
 * Flagę `isTestingWeek` przekazuje wołający, bo serwer czyta `IS_TESTING_WEEK`,
 * a przeglądarka `NEXT_PUBLIC_IS_TESTING_WEEK`. `basePrice` pochodzi z ustawień
 * w bazie; brak wartości oznacza użycie ceny domyślnej.
 */
export function resolveBaseAmount({
  isTestingWeek,
  isTester,
  basePrice = DEFAULT_BASE_PRICE_GROSZE,
}: {
  isTestingWeek: boolean;
  isTester: boolean;
  basePrice?: number;
}): number {
  if (isTestingWeek && isTester) return TESTER_PRICE_GROSZE;
  return basePrice;
}

/** Formatuje grosze do postaci "109,00 zł". */
export function formatPln(grosze: number): string {
  return (grosze / 100).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

/**
 * Liczba w polskim zapisie ("11 365") — do kwot trzymanych już w złotówkach.
 *
 * Locale podajemy JAWNIE. `toLocaleString()` bez argumentu bierze ustawienie
 * środowiska: Node renderuje wtedy "11,365", a przeglądarka "11 365" — i React
 * wywala błąd hydracji, bo serwerowy HTML nie zgadza się z klienckim.
 */
export function formatNumberPl(value: number): string {
  return value.toLocaleString("pl-PL");
}
