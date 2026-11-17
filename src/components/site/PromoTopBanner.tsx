"use client";

import { usePathname } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import type { PromoBannerData } from "@/lib/promo-banner";

const EASE = [0.16, 1, 0.3, 1] as const;

const content: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const piece: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};

/**
 * Sam wygląd paska. Używa go strona główna i podgląd w formularzu przeceny —
 * admin widzi dokładnie to, co zobaczą klientki.
 *
 * Styl promocyjny (Black Week): czarne tło, tekst wersalikami, termin w kolorze akcentu.
 * Zwykły tekst, bez odliczania — tak ustalone z klientką.
 *
 * ANIMACJA: sam pasek stoi od pierwszej klatki w pełnej wysokości (żadnego
 * „rozwijania” — to przesuwałoby stronę w dół, czyli skok układu / CLS).
 * Animuje się wyłącznie treść: wejście tekstu, przelatujący połysk
 * (`promo-bar-shine`) i pulsująca kropka. Wszystko to transform/opacity.
 */
export const PromoBannerBar = ({
  text,
  dateLabel,
  animated = false,
}: {
  text: string;
  dateLabel: string | null;
  /** Wejście tekstu przy załadowaniu strony; podgląd w panelu stoi. */
  animated?: boolean;
}) => (
  <div className="relative w-full overflow-hidden bg-black px-4 py-2.5 text-center text-sm text-white">
    {/* Połysk przelatujący co kilka sekund — czysty CSS na warstwie GPU. */}
    <span aria-hidden className="promo-bar-shine" />
    {/* Delikatna poświata akcentu przy krawędziach. */}
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#c5e96b]/10 to-transparent"
    />
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#c5e96b]/10 to-transparent"
    />

    <motion.div
      variants={content}
      initial={animated ? "hidden" : false}
      animate="visible"
      className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5"
    >
      <motion.span variants={piece} className="flex items-center gap-2.5">
        <span aria-hidden className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="font-bold uppercase tracking-[0.2em]">{text}</span>
      </motion.span>
      {dateLabel && (
        <>
          <motion.span
            variants={piece}
            aria-hidden
            className="text-white/40 max-[420px]:hidden"
          >
            |
          </motion.span>
          <motion.span
            variants={piece}
            className="whitespace-nowrap font-semibold text-accent"
          >
            {dateLabel}
          </motion.span>
        </>
      )}
    </motion.div>
  </div>
);

/** Pasek nad nawigacją — wyłącznie na stronie głównej. */
export const PromoTopBanner = ({ data }: { data: PromoBannerData | null }) => {
  const pathname = usePathname();
  if (!data || pathname !== "/") return null;

  return (
    <PromoBannerBar text={data.text} dateLabel={data.dateLabel} animated />
  );
};
