"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  ANALYTICS_ENABLED,
  CONSENT_EVENT,
  GA_ID,
  clearAnalyticsCookies,
  readConsent,
  type ConsentState,
} from "@/lib/consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics 4 w trybie „basic consent mode”.
 *
 * Skrypt Google NIE ładuje się w ogóle, dopóki odwiedzający nie zgodzi się
 * na cookies analityczne. Bez zgody do Google nie leci żadne żądanie i nic
 * nie zapisuje się w przeglądarce — to bezpieczniejszy wariant niż „advanced
 * consent mode”, który wysyła anonimowe pingi także bez zgody.
 *
 * Odsłony stron przy nawigacji bez przeładowania (App Router) zlicza samo GA4
 * — „pomiar zaawansowany → zmiany strony na podstawie historii przeglądarki”
 * jest domyślnie włączony, więc nie wysyłamy page_view ręcznie (byłyby
 * podwójne).
 *
 * Panel admina nie jest mierzony: to ruch właścicielki, który tylko
 * zaburzałby statystyki.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(readConsent());

    const onChange = (e: Event) => {
      const next = (e as CustomEvent<ConsentState>).detail;
      setConsent(next);

      if (!next.analytics) {
        // Wycofanie zgody: gtag (jeśli już działał) przestaje zapisywać,
        // a istniejące ciasteczka GA znikają od razu.
        window.gtag?.("consent", "update", { analytics_storage: "denied" });
        clearAnalyticsCookies();
      } else {
        window.gtag?.("consent", "update", { analytics_storage: "granted" });
      }
    };

    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!ANALYTICS_ENABLED || !consent?.analytics) return null;
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            cookie_expires: 34128000,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
    </>
  );
}
