"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Printer,
  Fingerprint,
  FileX,
  ArrowUpRight,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SecurePanelData } from "@/lib/types/landing";
import {
  fadeUp,
  fadeUpSm,
  fadeLeft,
  scaleIn,
  staggerContainer,
  revealOnScroll,
} from "@/lib/animations";

// STAŁE ZASOBY (Hardcoded in Code)
const FEATURE_ICONS = [FileX, Fingerprint, ShieldAlert, Printer];
const STATIC_IMAGE_SRC = "/landing-assets/panel_klienta_desktop.webp"; // Twoja grafika
const STATIC_IMAGE_ALT =
  "Panel z wbudowaną aplikacją do bezpiecznego czytanie ebooka";
const STATIC_IMAGE_SRC_MOBILE = "/landing-assets/panel_klienta_mobile.webp"; // Twoja grafika
const STATIC_IMAGE_ALT_MOBILE =
  "Panel z wbudowaną aplikacją do bezpiecznego czytanie ebooka";
const STATIC_BUTTON_URL = "/logowanie";

interface SecurePanelProps {
  data: SecurePanelData;
}

export const SecurePanel = ({ data }: SecurePanelProps) => {
  // Funkcja renderująca nagłówek (standardowa dla całego projektu)
  const renderHeadline = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headlineAny = data.headline as any;

    // Fallback dla starych danych (obiekt)
    if (typeof headlineAny === "object" && headlineAny !== null) {
      return (
        <>
          {headlineAny.line1} <br />
          <span className="text-[#D4F0C8]">{headlineAny.highlight}</span>
        </>
      );
    }

    const { headline, highlight } = data;
    if (typeof headline !== "string") return null;

    if (!highlight || !headline.includes(highlight)) {
      return headline;
    }

    const parts = headline.split(highlight);
    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="text-[#D4F0C8]">{highlight}</span>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <section className="bg-[#103830] py-40 text-white max-[1024px]:py-16">
      <div className="custom-container px-4">
        <div className="flex flex-row items-center gap-16 max-[1024px]:flex-col-reverse max-[1024px]:gap-12">
          {/* LEWA STRONA: GRAFIKA (STATYCZNA) */}
          <motion.div
            variants={scaleIn}
            {...revealOnScroll}
            className="relative w-[50%] max-[1024px]:w-full max-[1024px]:flex max-[1024px]:justify-center"
          >
            <div className="absolute left-1/2 top-1/2 -z-10 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4F0C8]/20 blur-[80px]" />

            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm max-[700px]:hidden">
              <div className="flex h-8 items-center gap-2 border-b border-white/10 bg-white/5 px-4">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
              </div>

              <Image
                src={STATIC_IMAGE_SRC}
                alt={STATIC_IMAGE_ALT}
                width={600}
                height={400}
                className="h-auto w-full object-cover"
              />
            </div>
            {/* WERSJA MOBILNA: Wygląd nowoczesnego smartfona */}
            <div className="relative mx-auto hidden w-[85%] max-w-[380px] flex-col overflow-hidden rounded-[2.5rem] border-[12px] border-[#1a1a1a] bg-white shadow-2xl max-[700px]:flex">
              {/* Wcięcie w ekranie (tzw. notch / dynamic island) */}
              <div className="absolute left-1/2 top-2 z-10 flex h-5 w-28 -translate-x-1/2 items-center justify-center rounded-full bg-[#1a1a1a]">
                {/* Kropka imitująca obiektyw aparatu */}
                <div className="h-2 w-2 rounded-full bg-gray-600/50" />
              </div>

              <Image
                src={STATIC_IMAGE_SRC_MOBILE}
                alt={STATIC_IMAGE_ALT_MOBILE}
                width={600}
                height={1200}
                className="h-auto w-full object-cover pt-2"
              />
            </div>
          </motion.div>

          {/* PRAWA STRONA: TREŚĆ (DYNAMICZNA) */}
          <motion.div
            variants={staggerContainer}
            {...revealOnScroll}
            className="flex w-[50%] flex-col gap-8 max-[1024px]:w-full max-[1024px]:text-center max-[1024px]:items-center"
          >
            <motion.div variants={fadeLeft} className="flex flex-col gap-4">
              <h2 className="heading text-white">{renderHeadline()}</h2>
              <p className="paragraph text-gray-300">{data.description}</p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1 max-[640px]:w-full"
            >
              {data.features.map((feature, index) => {
                const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
                return (
                  <motion.div
                    key={index}
                    variants={fadeUpSm}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10 text-left"
                  >
                    <Icon className="text-[#D4F0C8]" size={24} />
                    <div>
                      <h4 className="font-bold text-white text-[15px] mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div variants={fadeUp} className="pt-4">
              <Button
                href={STATIC_BUTTON_URL}
                bgColor="bg-[#D4F0C8]"
                textColor="text-[#103830]"
                className="hover:bg-white"
                icon={<ArrowUpRight size={18} />}
              >
                {data.button.label}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
