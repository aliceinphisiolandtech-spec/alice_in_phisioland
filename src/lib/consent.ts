/**
 * Zgody na pliki cookies — jedno miejsce prawdy dla banera, GA4 i popupu.
 *
 * Kategorie:
 * - niezbędne (sesja logowania) — zawsze, bez pytania (art. 399 ust. 3 PT),
 * - analityczne (Google Analytics 4) — WYŁĄCZNIE po zgodzie.
 *
 * Decyzję trzymamy w localStorage przeglądarki: to ustawienie tej jednej
 * osoby na tym jednym urządzeniu, serwer go nie potrzebuje. `version` pozwala
 * zapytać wszystkich od nowa, gdy zmieni się zakres (np. dojdzie piksel
 * reklamowy) — wystarczy podbić CONSENT_VERSION.
 *
 * Moduł jest czysto przeglądarkowy; każdy dostęp do storage jest w try/catch
 * (tryb prywatny, zablokowane dane strony).
 */

export const CONSENT_VERSION = 1;
const STORAGE_KEY = "aip-consent";
/** Zdarzenie po zmianie decyzji — słuchają go GA4 i popup promocji. */
export const CONSENT_EVENT = "aip:consent-changed";
/** Zdarzenie otwierające ustawienia (link „Ustawienia cookies” w stopce). */
export const OPEN_CONSENT_EVENT = "aip:open-consent";

/** Identyfikator pomiaru GA4. Pusty = analityka wyłączona, baneru nie ma. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const ANALYTICS_ENABLED = /^G-[A-Z0-9]+$/.test(GA_ID);

export interface ConsentState {
  version: number;
  analytics: boolean;
  /** ISO — kiedy zapadła decyzja (rozliczalność, RODO art. 7 ust. 1). */
  decidedAt: string;
}

export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    // Decyzja sprzed zmiany zakresu nie obowiązuje — pytamy ponownie.
    return parsed.version === CONSENT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    analytics,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* bez storage decyzja obowiązuje tylko do odświeżenia — trudno */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  return state;
}

/**
 * Czy odwiedzający ma jeszcze przed sobą baner. Gdy analityka jest wyłączona
 * (brak GA_ID), baneru nie ma i nikt na niego nie czeka.
 */
export function isConsentPending(): boolean {
  return ANALYTICS_ENABLED && readConsent() === null;
}

/**
 * Wycofanie zgody musi być tak proste jak jej udzielenie (RODO art. 7 ust. 3)
 * — i skuteczne: usuwamy ciasteczka GA, które zdążyły powstać.
 */
export function clearAnalyticsCookies() {
  const host = window.location.hostname;
  const domains = [
    "",
    host,
    `.${host}`,
    `.${host.split(".").slice(-2).join(".")}`,
  ];
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (name === "_ga" || name.startsWith("_ga_") || name === "_gid") {
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
      }
    }
  }
}
