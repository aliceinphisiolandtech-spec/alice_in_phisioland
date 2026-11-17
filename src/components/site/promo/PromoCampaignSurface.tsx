"use client";

import React from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import type { PromoBannerData } from "@/lib/promo-banner";
import { PromoContent } from "./PromoContent";

const EASE = [0.16, 1, 0.3, 1] as const;

const card: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 220,
      damping: 24,
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
};

/**
 * Strona zapisów w stylu promocji (popup / czarny pasek) — dla list
 * podpiętych pod przecenę z paskiem, np. /zapisy/black-friday.
 *
 * Całe okno w czerni z poświatami w kolorach marki, na środku ta sama karta
 * co w popupie (PromoContent), tylko w większej typografii. Nawigacja leży
 * przezroczyście na tle (jak w zwykłych kampaniach), a pod kartą są linki
 * prawne — zgoda w formularzu odsyła do polityki prywatności.
 */
export function PromoCampaignSurface({
  promo,
  intro,
  navbar,
}: {
  promo: PromoBannerData;
  intro?: string;
  navbar: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#070707] text-white">
      {/* --- Tło: poświaty, siatka, połysk --- */}
      <span
        aria-hidden
        className="admin-glow pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#c5e96b] opacity-[0.18] blur-[120px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-40 h-[560px] w-[560px] rounded-full bg-[#0c493e] opacity-70 blur-[120px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      {/* Ten sam czarny pasek co na stronie głównej — spójny początek ścieżki. */}
      <div className="relative z-10 w-full overflow-hidden border-b border-white/10 bg-black px-4 py-2.5 text-center text-sm">
        <span aria-hidden className="promo-bar-shine" />
        <span className="relative font-bold uppercase tracking-[0.2em]">
          {promo.text}
        </span>
        {promo.dateLabel && (
          <>
            <span aria-hidden className="relative mx-3 text-white/40">
              |
            </span>
            <span className="relative whitespace-nowrap font-semibold text-[#c5e96b]">
              {promo.dateLabel}
            </span>
          </>
        )}
      </div>

      <div className="relative z-10">{navbar}</div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-14 pt-6 max-[520px]:px-3 max-[520px]:pt-2">
        <motion.section
          variants={card}
          initial="hidden"
          animate="visible"
          aria-labelledby="promo-page-title"
          className="relative w-full max-w-[560px] overflow-hidden rounded-[32px] bg-[#0b0b0b]/90 shadow-[0_50px_140px_-40px_rgba(0,0,0,0.95)] ring-1 ring-white/10 backdrop-blur-xl max-[520px]:rounded-[26px]"
        >
          <span
            aria-hidden
            className="admin-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c5e96b] opacity-25 blur-3xl"
          />
          <span aria-hidden className="promo-bar-shine" />

          <div className="relative px-10 pb-10 pt-10 max-[520px]:px-5 max-[520px]:pb-7 max-[520px]:pt-8">
            <PromoContent
              data={promo}
              active
              titleId="promo-page-title"
              size="page"
              intro={intro}
            />
          </div>
        </motion.section>
      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6, ease: EASE }}
        className="relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pb-8 text-xs text-white/40"
      >
        <Link href="/" className="transition-colors hover:text-white">
          Strona główna
        </Link>
        <Link
          href="/polityka-prywatnosci"
          className="transition-colors hover:text-white"
        >
          Polityka prywatności
        </Link>
        <Link href="/regulamin" className="transition-colors hover:text-white">
          Regulamin
        </Link>
      </motion.footer>
    </div>
  );
}
