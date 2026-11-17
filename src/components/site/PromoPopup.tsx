"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { X } from "lucide-react";
import { PromoContent } from "@/components/site/promo/PromoContent";
import type { PromoBannerData } from "@/lib/promo-banner";
import { CONSENT_EVENT, isConsentPending } from "@/lib/consent";

/**
 * Popup promocji — wyskakuje 2 s po wejściu na stronę główną.
 *
 * Zawiera licznik (do startu, a w trakcie promocji — do końca) i, przed
 * startem, formularz „Powiadom mnie”. Formularz wysyła adres istniejącą
 * ścieżką /api/waitlist — tą samą co strony zapisów — więc zgoda RODO,
 * synchronizacja z MailerLite, limit prób i pułapka na boty działają bez
 * żadnej nowej logiki po stronie serwera.
 *
 * Zasady, żeby nie irytował:
 * - raz na sesję przeglądarki dla danej przeceny (sessionStorage),
 * - nie pokazujemy go osobom, które już mają e-book (decyduje strona),
 * - zamyka się krzyżykiem, klawiszem Esc i kliknięciem w tło.
 *
 * Licznik rusza dopiero po otwarciu popupu, w przeglądarce — popup nie jest
 * renderowany na serwerze, więc tykający czas nie powoduje błędu hydracji.
 */

const DELAY_MS = 2000;
const EASE = [0.16, 1, 0.3, 1] as const;

const storageKey = (saleId: string) => `aip-promo-popup-${saleId}`;

function wasDismissed(saleId: string): boolean {
  try {
    return sessionStorage.getItem(storageKey(saleId)) === "1";
  } catch {
    return false; // tryb prywatny / zablokowane dane — po prostu pokazujemy
  }
}

function markDismissed(saleId: string) {
  try {
    sessionStorage.setItem(storageKey(saleId), "1");
  } catch {
    /* brak dostępu do storage — popup wróci po odświeżeniu, trudno */
  }
}

// --- POPUP ---

const card: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
      staggerChildren: 0.07,
      delayChildren: 0.15,
    },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.96,
    transition: { duration: 0.2, ease: EASE },
  },
};

export const PromoPopup = ({ data }: { data: PromoBannerData }) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // `?popup=1` w adresie wymusza pokazanie mimo wcześniejszego zamknięcia —
    // do podglądu i do sprawdzania zmian bez czyszczenia danych przeglądarki.
    const forced = new URLSearchParams(window.location.search).has("popup");
    if (!forced && wasDismissed(data.saleId)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(() => setOpen(true), DELAY_MS);
    };

    // Dwa okna naraz (baner cookies + popup) to chaos — popup czeka, aż
    // odwiedzający odpowie na baner, i dopiero wtedy odlicza swoje 2 s.
    if (!isConsentPending()) {
      schedule();
      return () => clearTimeout(timer);
    }
    const onDecided = () => schedule();
    window.addEventListener(CONSENT_EVENT, onDecided, { once: true });
    return () => {
      window.removeEventListener(CONSENT_EVENT, onDecided);
      clearTimeout(timer);
    };
  }, [data.saleId]);

  const close = useCallback(() => {
    setOpen(false);
    markDismissed(data.saleId);
  }, [data.saleId]);

  // Esc zamyka, a fokus wskakuje na krzyżyk — klawiatura i czytnik ekranu
  // od razu wiedzą, że na stronie pojawiło się okno.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="promo-popup"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 max-[520px]:items-end max-[520px]:p-3"
          initial={{ opacity: 1 }}
          exit={{ opacity: 1 }}
        >
          {/* Tło */}
          <motion.div
            aria-hidden
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />

          {/* Karta */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-popup-title"
            variants={card}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[460px] overflow-y-auto overflow-x-hidden rounded-[28px] bg-[#0b0b0b] text-white shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10 scrollbar-hide"
          >
            {/* Dekoracje: poświaty + połysk jak na pasku. */}
            <span
              aria-hidden
              className="admin-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c5e96b] opacity-25 blur-3xl"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#0c493e] opacity-60 blur-3xl"
            />
            <span aria-hidden className="promo-bar-shine" />

            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Zamknij"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/80 outline-none transition-all duration-200 hover:rotate-90 hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-[#c5e96b]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative px-8 pb-8 pt-9 max-[520px]:px-5 max-[520px]:pb-6 max-[520px]:pt-7">
              <PromoContent
                data={data}
                active={open}
                onNavigate={close}
                titleId="promo-popup-title"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
