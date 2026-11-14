"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowUpRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { formatPln } from "@/lib/pricing";
import type { PromoBannerData } from "@/lib/promo-banner";

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

// --- LICZNIK ---

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remainingUntil(target: number, now: number): Remaining | null {
  const diff = target - now;
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/** Tyka co sekundę tylko wtedy, gdy popup jest otwarty. */
function useCountdown(targetIso: string | null, active: boolean) {
  const target = targetIso ? new Date(targetIso).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || target === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, target]);

  return target === null ? null : remainingUntil(target, now);
}

/** Jedna cyfra licznika — nowa wartość wjeżdża z góry, stara wyjeżdża w dół. */
const CountdownUnit = ({ value, label }: { value: number; label: string }) => {
  const text = String(value).padStart(2, "0");
  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl bg-white/[0.06] px-2 py-3 ring-1 ring-white/10">
      <div className="relative h-9 w-full overflow-hidden text-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={text}
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="absolute inset-0 text-3xl font-black tabular-nums leading-9 text-white"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>
    </div>
  );
};

// --- FORMULARZ „POWIADOM MNIE” ---

type FormState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

const NotifyForm = ({
  slug,
  consentText,
}: {
  slug: string;
  consentText: string;
}) => {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<FormState>({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setState({
        kind: "error",
        message: "Zaznacz zgodę, żeby dostać powiadomienie.",
      });
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email, consent: true, website }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          kind: "error",
          message: json.message ?? "Nie udało się zapisać. Spróbuj ponownie.",
        });
        return;
      }
      setState({
        kind: "done",
        message:
          json.status === "already_subscribed"
            ? "Ten adres jest już na liście — dam Ci znać, gdy ruszy promocja."
            : "Gotowe! Dam Ci znać mailem, gdy tylko ruszy promocja.",
      });
    } catch {
      setState({
        kind: "error",
        message: "Brak połączenia. Spróbuj ponownie.",
      });
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state.kind === "done" ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="flex items-start gap-3 rounded-2xl bg-[#c5e96b]/15 p-4 ring-1 ring-[#c5e96b]/40"
          role="status"
        >
          <motion.span
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 14,
              delay: 0.1,
            }}
          >
            <CheckCircle2 className="h-6 w-6 shrink-0 text-[#c5e96b]" />
          </motion.span>
          <p className="text-sm font-semibold text-white">{state.message}</p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={submit}
          noValidate
          exit={{ opacity: 0, y: -8 }}
          className="space-y-3"
        >
          <div className="flex flex-col gap-2.5">
            <label htmlFor="promo-email" className="sr-only">
              Adres e-mail
            </label>
            <input
              id="promo-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj@email.pl"
              className="w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3.5 text-sm text-white outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-white/35 focus:border-[#c5e96b] focus:ring-4 focus:ring-[#c5e96b]/20"
            />
            <button
              type="submit"
              disabled={state.kind === "sending"}
              className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#c5e96b] px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-black transition-all duration-200 hover:bg-white hover:shadow-[0_12px_30px_-10px_rgba(197,233,107,0.8)] active:scale-[0.98] disabled:opacity-70"
            >
              {state.kind === "sending" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BellRing className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              )}
              Powiadom mnie
            </button>
          </div>

          {/* Pułapka na boty — niewidoczna i poza nawigacją klawiaturą. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed text-white/55">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#c5e96b]"
            />
            <span>
              {consentText}{" "}
              <Link
                href="/polityka-prywatnosci"
                className="underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                Polityka prywatności
              </Link>
            </span>
          </label>

          <AnimatePresence>
            {state.kind === "error" && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                role="alert"
                className="text-xs font-semibold text-red-300"
              >
                {state.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.form>
      )}
    </AnimatePresence>
  );
};

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

const piece: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const PromoPopup = ({ data }: { data: PromoBannerData }) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const isLive = data.status === "live";
  const countdown = useCountdown(isLive ? data.endsAt : data.startsAt, open);
  const hasDiscount = data.promoPrice < data.regularPrice;

  useEffect(() => {
    // `?popup=1` w adresie wymusza pokazanie mimo wcześniejszego zamknięcia —
    // do podglądu i do sprawdzania zmian bez czyszczenia danych przeglądarki.
    const forced = new URLSearchParams(window.location.search).has("popup");
    if (!forced && wasDismissed(data.saleId)) return;
    const id = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(id);
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
              <motion.div variants={piece} className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c5e96b] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c5e96b]" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#c5e96b]">
                  {isLive ? "Promocja trwa" : "Już wkrótce"}
                </span>
              </motion.div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <motion.h2
                    id="promo-popup-title"
                    variants={piece}
                    className="text-[2.6rem] font-black uppercase leading-[0.95] tracking-tight max-[520px]:text-[2.1rem]"
                  >
                    {data.text}
                  </motion.h2>
                  {data.dateLabel && (
                    <motion.p
                      variants={piece}
                      className="mt-3 flex items-center gap-2 text-sm font-semibold text-white/70"
                    >
                      <CalendarDays className="h-4 w-4 text-[#c5e96b]" />
                      {data.dateLabel}
                    </motion.p>
                  )}
                </div>
                {data.discountLabel && (
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: -6 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 14,
                      delay: 0.55,
                    }}
                    className="mr-8 mt-1 shrink-0 rounded-2xl bg-[#c5e96b] px-3.5 py-2 text-xl font-black text-black shadow-[0_10px_30px_-8px_rgba(197,233,107,0.7)] max-[520px]:mr-9"
                  >
                    {data.discountLabel}
                  </motion.span>
                )}
              </div>

              {/* LICZNIK */}
              {countdown && (
                <motion.div variants={piece} className="mt-6">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
                    {isLive ? "Do końca promocji" : "Start promocji za"}
                  </p>
                  <div
                    className="flex gap-2"
                    role="timer"
                    aria-label={`${countdown.days} dni, ${countdown.hours} godzin, ${countdown.minutes} minut`}
                  >
                    <CountdownUnit value={countdown.days} label="dni" />
                    <CountdownUnit value={countdown.hours} label="godz" />
                    <CountdownUnit value={countdown.minutes} label="min" />
                    <CountdownUnit value={countdown.seconds} label="sek" />
                  </div>
                </motion.div>
              )}

              {hasDiscount && (
                <motion.p
                  variants={piece}
                  className="mt-5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1"
                >
                  <span className="text-sm text-white/55">
                    E-book w promocji:
                  </span>
                  <span className="text-2xl font-extrabold tabular-nums text-[#c5e96b]">
                    {formatPln(data.promoPrice)}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-white/40 line-through">
                    {formatPln(data.regularPrice)}
                  </span>
                </motion.p>
              )}
              {hasDiscount && data.lowestPrice30d !== null && (
                <motion.p
                  variants={piece}
                  className="mt-1 text-[11px] text-white/45"
                >
                  Najniższa cena z 30 dni przed obniżką:{" "}
                  <span className="font-semibold tabular-nums text-white/70">
                    {formatPln(data.lowestPrice30d)}
                  </span>
                </motion.p>
              )}

              <motion.div variants={piece} className="mt-6">
                {isLive ? (
                  <Link
                    href="/zakup"
                    onClick={close}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c5e96b] px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-black transition-all duration-200 hover:bg-white hover:shadow-[0_12px_30px_-10px_rgba(197,233,107,0.8)] active:scale-[0.98]"
                  >
                    Kup e-booka
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ) : data.notify ? (
                  <>
                    <p className="mb-3 text-sm text-white/70">
                      Zostaw e-mail — przypomnę Ci, gdy promocja wystartuje.
                    </p>
                    <NotifyForm
                      slug={data.notify.slug}
                      consentText={data.notify.consentText}
                    />
                  </>
                ) : (
                  // Bez podpiętej listy przed startem nie odsyłamy do koszyka —
                  // klientka zapłaciłaby jeszcze pełną cenę.
                  <Link
                    href="/#o-ebooku"
                    onClick={close}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c5e96b] px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-black transition-all duration-200 hover:bg-white active:scale-[0.98]"
                  >
                    Zobacz e-booka
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
