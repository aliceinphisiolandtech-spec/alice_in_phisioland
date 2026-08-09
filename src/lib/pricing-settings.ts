import { prisma } from "@/lib/prisma";
import {
  DEFAULT_BASE_PRICE_GROSZE,
  DEFAULT_REGULAR_PRICE_GROSZE,
} from "@/lib/pricing";

/**
 * Ustawienia cenowe trzymane w bazie — cena sprzedaży, cena regularna
 * i konfiguracja piaskownicy.
 *
 * PIASKOWNICA (tryb testowy admina):
 * - nie wyłącza trwających promocji; wszystko, co powstanie lub zostanie
 *   zmienione przy włączonej piaskownicy, dostaje `isSandbox = true` i działa
 *   wyłącznie na kontach admina,
 * - wyłączenie piaskownicy publikuje te zmiany (zdejmuje flagę),
 * - admin w piaskownicy PRZECHODZI normalną ścieżkę płatności (Stripe w trybie
 *   testowym) — blokady nie ma celowo, bo sens piaskownicy polega na sprawdzeniu
 *   całego zakupu od ceny po nadanie dostępu. Powstałe zamówienie i dostęp są
 *   oznaczone `isSandbox`, więc nie liczą się do statystyk, nie generują faktury
 *   i nie konsumują limitów promocji (patrz /api/checkout/intent i webhook).
 */

export const PRICING_SETTINGS_ID = "singleton";

export interface PricingSettingsData {
  basePriceGrosze: number;
  regularPriceGrosze: number;
  sandboxEnabled: boolean;
  sandboxBasePriceGrosze: number | null;
}

const FALLBACK: PricingSettingsData = {
  basePriceGrosze: DEFAULT_BASE_PRICE_GROSZE,
  regularPriceGrosze: DEFAULT_REGULAR_PRICE_GROSZE,
  sandboxEnabled: false,
  sandboxBasePriceGrosze: null,
};

/**
 * Czyta ustawienia. Gdyby wiersz nie istniał (świeża baza, nieuruchomiony seed),
 * zwraca wartości domyślne zamiast rzucać — koszyk nigdy nie może się wywrócić
 * z powodu braku konfiguracji.
 */
export async function getPricingSettings(): Promise<PricingSettingsData> {
  const row = await prisma.pricingSettings.findUnique({
    where: { id: PRICING_SETTINGS_ID },
  });

  if (!row) return FALLBACK;

  return {
    basePriceGrosze: row.basePriceGrosze,
    regularPriceGrosze: row.regularPriceGrosze,
    sandboxEnabled: row.sandboxEnabled,
    sandboxBasePriceGrosze: row.sandboxBasePriceGrosze,
  };
}

const IS_DEV = process.env.NODE_ENV !== "production";

/** Domena kont zakładanych przez dev login (src/lib/auth.ts). */
const DEV_ACCOUNT_DOMAIN = "@local.dev";

/**
 * Czy dla tego użytkownika obowiązuje tryb piaskownicy.
 *
 * Wchodzą do niej: konta z rolą admina oraz — WYŁĄCZNIE poza produkcją — konta
 * testowe dev loginu. Te drugie pozwalają obejrzeć piaskownicę oczami klientki,
 * a nie tylko z perspektywy admina. Na produkcji `IS_DEV` jest false, więc
 * jedynym wejściem zostaje rola admina i żadna klientka nigdy tu nie trafi.
 */
export function isSandboxActiveFor(
  settings: PricingSettingsData,
  { isAdmin, email }: { isAdmin: boolean; email?: string | null },
): boolean {
  if (!settings.sandboxEnabled) return false;
  if (isAdmin) return true;

  return (
    IS_DEV && (email?.toLowerCase().endsWith(DEV_ACCOUNT_DOMAIN) ?? false)
  );
}

/**
 * Cena bazowa przed rabatami, z uwzględnieniem testowej ceny piaskownicy.
 * Cena piaskownicy ma pierwszeństwo przed ceną testerską — admin, który wpisał
 * kwotę do testów zaokrągleń, ma zobaczyć dokładnie ją.
 */
export function resolveSettingsBasePrice(
  settings: PricingSettingsData,
  sandboxActive: boolean,
): { basePrice: number; usesSandboxPrice: boolean } {
  if (sandboxActive && settings.sandboxBasePriceGrosze !== null) {
    return {
      basePrice: settings.sandboxBasePriceGrosze,
      usesSandboxPrice: true,
    };
  }

  return { basePrice: settings.basePriceGrosze, usesSandboxPrice: false };
}
