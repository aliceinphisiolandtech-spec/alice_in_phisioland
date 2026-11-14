"use client";

import { ANALYTICS_ENABLED, OPEN_CONSENT_EVENT } from "@/lib/consent";

/**
 * „Ustawienia cookies” w stopce — zmiana lub wycofanie zgody musi być równie
 * łatwe jak jej udzielenie (RODO art. 7 ust. 3). Otwiera baner z ustawieniami.
 */
export function CookieSettingsLink({ className }: { className?: string }) {
  if (!ANALYTICS_ENABLED) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className={className}
    >
      Ustawienia cookies
    </button>
  );
}
