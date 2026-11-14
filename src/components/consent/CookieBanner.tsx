"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ANALYTICS_ENABLED,
  OPEN_CONSENT_EVENT,
  readConsent,
  saveConsent,
} from "@/lib/consent";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Baner zgód na cookies.
 *
 * Wymogi, które realizuje (RODO + art. 399 Prawa komunikacji elektronicznej):
 * - analityka startuje dopiero po zgodzie — domyślnie wszystko wyłączone,
 * - „Odrzuć” jest tak samo widoczne jak „Akceptuj” (bez dark patterns),
 * - zgodę można zmienić w każdej chwili: link „Ustawienia cookies” w stopce
 *   wysyła zdarzenie OPEN_CONSENT_EVENT i baner wraca z ustawieniami.
 *
 * Bez skonfigurowanego GA4 (NEXT_PUBLIC_GA_ID) nie ma czego zgadzać się —
 * baner nie renderuje się wcale. W panelu admina też go nie ma.
 */
export function CookieBanner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    const existing = readConsent();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!existing) setOpen(true);

    const reopen = () => {
      setAnalytics(readConsent()?.analytics ?? false);
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!ANALYTICS_ENABLED || pathname?.startsWith("/admin")) return null;

  const decide = (value: boolean) => {
    saveConsent(value);
    setOpen(false);
    setDetails(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cookie-banner"
          role="dialog"
          aria-label="Ustawienia plików cookies"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30, transition: { duration: 0.2 } }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.4 }}
          className="fixed inset-x-4 bottom-4 z-[190] mx-auto max-w-[560px] rounded-3xl border border-gray-200/80 bg-white/95 p-5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl max-[520px]:inset-x-3 max-[520px]:bottom-3"
        >
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#c5e96b]/30 text-[#0c493e]">
              <Cookie className="h-5 w-5" />
            </span>
            <div className="min-w-0 text-sm text-gray-600">
              <p className="font-bold text-gray-900">Pliki cookies</p>
              <p className="mt-1 leading-relaxed">
                Używam niezbędnych plików cookies, żeby strona działała. Za
                Twoją zgodą także analitycznych (Google Analytics) — pomagają mi
                zobaczyć, co jest dla Ciebie przydatne.{" "}
                <Link
                  href="/polityka-prywatnosci#cookies"
                  className="font-semibold text-[#0c493e] underline underline-offset-2"
                >
                  Więcej
                </Link>
              </p>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {details && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-2">
                  <CategoryRow
                    title="Niezbędne"
                    text="Logowanie i bezpieczeństwo. Zawsze włączone."
                    checked
                    disabled
                  />
                  <CategoryRow
                    title="Analityczne"
                    text="Google Analytics 4 — anonimowe statystyki odwiedzin."
                    checked={analytics}
                    onChange={() => setAnalytics((v) => !v)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-2">
            {details ? (
              <button
                type="button"
                onClick={() => decide(analytics)}
                className="flex-1 cursor-pointer rounded-xl bg-[#0c493e] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#0a3b32]"
              >
                Zapisz wybór
              </button>
            ) : (
              <>
                {/* Odrzuć i Akceptuj mają tę samą wagę wizualną. */}
                <button
                  type="button"
                  onClick={() => decide(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-[#0c493e] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0c493e] transition-colors hover:bg-[#0c493e]/5"
                >
                  Odrzuć
                </button>
                <button
                  type="button"
                  onClick={() => decide(true)}
                  className="flex-1 cursor-pointer rounded-xl bg-[#0c493e] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#0a3b32]"
                >
                  Akceptuj
                </button>
                <button
                  type="button"
                  onClick={() => setDetails(true)}
                  className="w-full cursor-pointer py-1 text-xs font-semibold text-gray-500 underline-offset-2 transition-colors hover:text-[#0c493e] hover:underline"
                >
                  Ustawienia
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const CategoryRow = ({
  title,
  text,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
}) => (
  <label
    className={cn(
      "flex items-center justify-between gap-4 rounded-2xl border border-gray-200 px-4 py-3",
      disabled ? "bg-gray-50" : "cursor-pointer hover:border-gray-300",
    )}
  >
    <span className="min-w-0">
      <span className="block text-sm font-bold text-gray-900">{title}</span>
      <span className="block text-xs text-gray-500">{text}</span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="h-5 w-5 shrink-0 cursor-pointer accent-[#0c493e] disabled:cursor-not-allowed"
    />
  </label>
);
