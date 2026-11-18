"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, type Variants } from "framer-motion";
import { BookOpen } from "lucide-react";
import type { TableOfContentsData } from "@/lib/types/landing";
import { numberChapters } from "@/lib/table-of-contents";
import {
  VIEWPORT,
  fadeLeft,
  fadeUp,
  revealOnScroll,
  staggerContainer,
} from "@/lib/animations";

const COVER = "/landing-assets/E-book-presentation.webp";
const EASE = [0.21, 0.47, 0.32, 0.98] as const;

const row: Variants = {
  hidden: { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

/**
 * Spis treści e-booka — część sekcji „O e-booku” na stronie głównej.
 *
 * Paleta i język wizualny sekcji „Twój Zabezpieczony Panel Wiedzy”
 * (tło #103830, akcent #D4F0C8, szkło `border-white/10 bg-white/5`).
 *
 * Motyw przewodni: KRĘGOSŁUP — jak na grafice spisu treści w e-booku.
 * Rozdziały wiszą na pionowej linii z „kręgami”; linia wypełnia się kolorem
 * w miarę przewijania (scaleY sterowane scrollem, czysty transform), a kręgi
 * zapalają się, gdy ich rozdział wchodzi w kadr. Duże szeryfowe cyfry
 * rzymskie są przygaszone i rozświetlają się po najechaniu.
 *
 * Treść edytowalna w CMS (zakładka „Spis treści”); numery liczone
 * z kolejności (lib/table-of-contents).
 */
export const TableOfContents = ({ data }: { data: TableOfContentsData }) => {
  const chapters = numberChapters(data.chapters);
  const numberedCount = chapters.filter((c) => c.numeral).length;

  // Postęp przewijania listy -> wypełnienie kręgosłupa (0..1).
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 75%", "end 55%"],
  });
  const spineFill = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  const renderHeadline = () => {
    const { headline, highlight } = data;
    if (!highlight || !headline.includes(highlight)) return headline;
    const parts = headline.split(highlight);
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="text-[#D4F0C8]">{highlight}</span>
        )}
      </React.Fragment>
    ));
  };

  const chapterWord =
    numberedCount === 1
      ? "rozdział"
      : numberedCount % 10 >= 2 &&
          numberedCount % 10 <= 4 &&
          (numberedCount % 100 < 10 || numberedCount % 100 >= 20)
        ? "rozdziały"
        : "rozdziałów";

  return (
    <section
      id="spis-tresci"
      aria-labelledby="spis-tresci-title"
      className="relative overflow-hidden bg-[#103830] py-40 text-white max-[1024px]:py-20"
    >
      {/* Tło: miękkie poświaty w kolorze akcentu + bardzo delikatna siatka. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-40 top-20 h-[460px] w-[460px] rounded-full bg-[#D4F0C8]/10 blur-[110px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-[#D4F0C8]/[0.07] blur-[110px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
      />

      <div className="custom-container relative px-4">
        <div className="flex flex-row items-start gap-20 max-[1024px]:flex-col max-[1024px]:gap-14">
          {/* ================= LEWA: nagłówek + okładka ================= */}
          <motion.div
            variants={staggerContainer}
            {...revealOnScroll}
            className="flex w-[40%] flex-col gap-5 min-[1025px]:sticky min-[1025px]:top-28 max-[1024px]:w-full max-[1024px]:items-center max-[1024px]:text-center"
          >
            {data.badge && (
              <motion.span
                variants={fadeUp}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#D4F0C8] backdrop-blur-sm"
              >
                <BookOpen size={14} />
                {data.badge}
              </motion.span>
            )}
            <motion.h2
              id="spis-tresci-title"
              variants={fadeLeft}
              className="heading text-white"
            >
              {renderHeadline()}
            </motion.h2>
            {data.description && (
              <motion.p
                variants={fadeUp}
                className="paragraph max-w-md text-gray-300"
              >
                {data.description}
              </motion.p>
            )}

            {/* Okładka z poświatą i pływającą etykietą z liczbą rozdziałów —
                jedyną informacją obok okładki (ustalone z klientką). */}
            <motion.div
              variants={fadeUp}
              className="relative mt-8 w-fit self-center max-[1024px]:mt-4"
            >
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 -z-0 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4F0C8]/25 blur-[70px]"
              />
              <div className="group relative transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transform:perspective(1200px)_rotateY(-14deg)_rotateX(4deg)] hover:[transform:perspective(1200px)_rotateY(0deg)_rotateX(0deg)]">
                <Image
                  src={COVER}
                  alt="Okładka e-booka „Fizjoterapeutyczna diagnostyka różnicowa w ujęciu klinicznym. Tom 1”"
                  width={316}
                  height={407}
                  className="relative h-auto w-[250px] drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)] max-[640px]:w-[210px]"
                />
              </div>

              <span className="toc-float absolute -right-10 top-10 flex items-baseline gap-1.5 rounded-2xl border border-white/10 bg-[#103830]/70 px-4 py-2.5 shadow-xl backdrop-blur-md max-[640px]:-right-4">
                <span className="text-2xl font-bold tabular-nums text-[#D4F0C8]">
                  {numberedCount}
                </span>
                <span className="text-xs text-gray-300">{chapterWord}</span>
              </span>
            </motion.div>
          </motion.div>

          {/* ================= PRAWA: kręgosłup z rozdziałami ================= */}
          <ol ref={listRef} className="relative w-[60%] max-[1024px]:w-full">
            {/* Kręgosłup: tor + wypełnienie sterowane przewijaniem. */}
            <span
              aria-hidden
              className="absolute bottom-6 left-[19px] top-6 w-[2px] rounded-full bg-white/10"
            />
            <motion.span
              aria-hidden
              style={{ scaleY: spineFill }}
              className="absolute bottom-6 left-[19px] top-6 w-[2px] origin-top rounded-full bg-gradient-to-b from-[#D4F0C8] via-[#D4F0C8]/80 to-[#D4F0C8]/20 shadow-[0_0_12px_rgba(212,240,200,0.6)]"
            />

            {chapters.map((chapter, index) => (
              <motion.li
                key={`${index}-${chapter.title}`}
                variants={row}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                className="group relative flex items-center gap-6 py-3 max-[640px]:gap-4"
              >
                {/* „Krąg” — zapala się przy wejściu rozdziału w kadr. */}
                <span className="relative z-10 flex w-10 shrink-0 justify-center">
                  {chapter.numeral ? (
                    <motion.span
                      aria-hidden
                      initial={{ backgroundColor: "#103830", scale: 0.7 }}
                      whileInView={{
                        backgroundColor: "#D4F0C8",
                        scale: 1,
                      }}
                      viewport={{ once: true, margin: "0px 0px -45% 0px" }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="block h-3.5 w-6 rounded-[6px] border border-[#D4F0C8]/60 shadow-[0_0_14px_rgba(212,240,200,0.35)] transition-transform duration-300 group-hover:scale-125"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="block h-2.5 w-2.5 rounded-full border border-[#D4F0C8]/50 bg-[#103830]"
                    />
                  )}
                </span>

                {chapter.numeral ? (
                  <div className="flex min-w-0 flex-1 items-center gap-5 rounded-2xl border border-transparent px-5 py-4 transition-all duration-300 group-hover:border-white/10 group-hover:bg-white/5 max-[640px]:gap-3 max-[640px]:px-3 max-[640px]:py-3">
                    {/* Cyfra rzymska szeryfowa (jak na grafice spisu w e-booku) —
                        przygaszona, rozświetla się po najechaniu. */}
                    <span
                      aria-hidden
                      className="w-[84px] shrink-0 text-right font-serif text-[40px] font-bold leading-none tracking-tight text-[#D4F0C8]/35 transition-[color,transform] duration-500 group-hover:-translate-x-1 group-hover:text-[#D4F0C8] max-[640px]:w-[54px] max-[640px]:text-[22px]"
                    >
                      {chapter.numeral}
                    </span>
                    <span className="sr-only">Rozdział {chapter.numeral}:</span>
                    <span className="text-[17px] font-bold leading-snug text-white transition-transform duration-300 group-hover:translate-x-1 max-[640px]:text-[15px]">
                      {chapter.title}
                    </span>
                  </div>
                ) : (
                  <span className="px-5 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 max-[640px]:px-3">
                    {chapter.title}
                  </span>
                )}
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};
