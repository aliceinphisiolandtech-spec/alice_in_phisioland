"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils/cn";

/**
 * Nagłówek każdej podstrony panelu — jedna karta w kolorach marki zamiast
 * pięciu różnych wariantów „ikonka + h1” rozsianych po stronach.
 *
 * `icon` to gotowy element (np. `<BellRing size={22} />`), a nie komponent:
 * strony panelu są server componentami, a przez granicę serwer → klient da
 * się przekazać wyrenderowany element, ale nie funkcję.
 *
 * Wszystkie animacje to opacity + transform. Dekoracyjna poświata dryfuje
 * czystym CSS (`admin-glow`), wyłączanym przy „ogranicz ruch”.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE,
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
};

const child: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const iconPop: Variants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -12 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 380, damping: 18 },
  },
};

export interface PageHeaderProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Mała etykieta nad tytułem, np. „Sprzedaż”. */
  eyebrow?: string;
  /** Akcje lub statystyki po prawej stronie. */
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({
  icon,
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) => (
  <motion.header
    variants={container}
    initial="hidden"
    animate="visible"
    className={cn(
      "relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0c493e] via-[#0e5547] to-[#093a31] p-7 text-white shadow-[0_24px_60px_-30px_rgba(12,73,62,0.8)] max-[640px]:rounded-3xl max-[640px]:p-5",
      className,
    )}
  >
    {/* Dekoracje: poświata w kolorze akcentu + delikatna siatka. */}
    <div
      aria-hidden
      className="admin-glow pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#c5e96b] opacity-25 blur-3xl"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-[#2bb39a] opacity-20 blur-3xl"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
    />

    <div className="relative flex items-center justify-between gap-6 max-[760px]:flex-col max-[760px]:items-start">
      <div className="flex min-w-0 items-center gap-4">
        <motion.div
          variants={iconPop}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#c5e96b] ring-1 ring-white/20 backdrop-blur-sm max-[640px]:h-12 max-[640px]:w-12"
        >
          {icon}
        </motion.div>
        <div className="min-w-0">
          {eyebrow && (
            <motion.p
              variants={child}
              className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c5e96b]/90"
            >
              {eyebrow}
            </motion.p>
          )}
          <motion.h1
            variants={child}
            className="text-2xl font-extrabold leading-tight tracking-tight max-[640px]:text-xl"
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              variants={child}
              className="mt-1 max-w-2xl text-sm text-white/70"
            >
              {description}
            </motion.p>
          )}
        </div>
      </div>

      {actions && (
        <motion.div variants={child} className="relative shrink-0">
          {actions}
        </motion.div>
      )}
    </div>
  </motion.header>
);
