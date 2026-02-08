"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HeroData } from "@/lib/types/landing";
import React from "react";

// ... (Twoje stałe STATIC_AVATARS, STATIC_HERO_IMAGES, STATIC_BLOB bez zmian) ...
const STATIC_AVATARS = [
  "https://images.pexels.com/photos/35967884/pexels-photo-35967884.jpeg?auto=compress&cs=tinysrgb&w=128",
  "https://images.pexels.com/photos/6030282/pexels-photo-6030282.jpeg?auto=compress&cs=tinysrgb&w=128",
  "https://images.pexels.com/photos/16845064/pexels-photo-16845064.jpeg?auto=compress&cs=tinysrgb&w=128",
];

const STATIC_HERO_IMAGES = [
  "/landing-assets/hero-image-01.webp",
  "/landing-assets/hero-image-02.webp",
  "/landing-assets/hero-image-03.webp",
];
const STATIC_BLOB = "/landing-assets/hero-blob.svg";

interface HeroProps {
  data: HeroData;
}

export const Hero = ({ data }: HeroProps) => {
  // FUNKCJA POMOCNICZA DO RENDEROWANIA NAGŁÓWKA
  const renderHeadline = () => {
    const { headline, highlight } = data;

    // 1. Jeśli nie ma zdefiniowanego highlightu lub nie ma go w tekście -> wyświetl zwykły tekst
    if (!highlight || !headline.includes(highlight)) {
      return headline;
    }

    // 2. Dzielimy tekst w miejscu wystąpienia frazy
    // Używamy split, który usunie frazę, więc musimy ją wstawić ręcznie w <span>
    const parts = headline.split(highlight);

    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {/* Dodajemy wyróżnienie tylko pomiędzy częściami (nie na końcu) */}
            {index < parts.length - 1 && (
              <span className="text-highlight relative inline-block">
                {highlight}
              </span>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <section className="custom-container relative bg-white pt-[172px] pb-55">
      <div className="flex flex-row ml-24 max-w-[70%] max-[1110px]:ml-12 max-[920px]:ml-6 max-[920px]:max-w-[75%] max-[860px]:flex-col max-[860px]:max-w-full max-[860px]:ml-0 max-[860px]:px-3 max-[550px]:overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col justify-center gap-8 max-[1024px]:w-full"
        >
          {/* UŻYCIE FUNKCJI RENDERUJĄCEJ */}
          <h1 className="heading mb-[-12px] max-w-[80%] max-[1070px]:max-w-[90%] max-[960px]:max-w-[110%] max-[860px]:self-center max-[860px]:text-center">
            {renderHeadline()}
          </h1>

          <p className="paragraph max-w-[60%] max-[860px]:max-w-full max-[860px]:px-12 max-[860px]:text-center max-[480px]:px-3">
            {data.description}
          </p>

          {/* ... Reszta przycisków i avatarów bez zmian ... */}
          <div className="flex flex-row gap-4 max-[860px]:justify-center flex-wrap">
            <Button
              href={"/"}
              icon={<ArrowUpRight size={14} strokeWidth={1} />}
            >
              {data.buttons.secondary.label}
            </Button>
            <Button bgColor="bg-primary" href={"/"}>
              {data.buttons.primary.label}
            </Button>
          </div>

          {/* ... Social Proof ... */}
          <div className="flex items-center gap-4 max-[860px]:self-center">
            {/* ... kod avatarów i statystyk bez zmian ... */}
            <div className="flex -space-x-4">
              {STATIC_AVATARS.map((src, i) => (
                <div
                  key={i}
                  className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-gray-200"
                >
                  <Image
                    src={src}
                    alt={`User ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-black">
                {data.socialProof.stats.count}
              </span>
              <span className="text-sm font-medium text-gray-500">
                {data.socialProof.stats.labelLine1} <br />
                {data.socialProof.stats.labelLine2}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ... Prawa strona z obrazkami (blob) bez zmian ... */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative ml-12 flex items-center justify-center max-[860px]:ml-0 max-[860px]:mt-12 max-[860px]:w-full"
        >
          {/* ... Tu wklej zawartość prawej kolumny (Images) z poprzedniego kodu ... */}
          <div className="absolute -left-58 max-[960px]:-left-64 max-[960px]:top-18 max-[860px]:relative max-[860px]:left-auto max-[860px]:top-auto max-[860px]:w-full max-[860px]:max-w-[450px] max-[860px]:flex max-[860px]:justify-center">
            <div className="relative flex h-full min-w-max flex-row items-center gap-3 max-[860px]:min-w-0 max-[860px]:w-full max-[860px]:items-center max-[860px]:justify-center max-[860px]:gap-[2%]">
              <Image
                height={471}
                width={442}
                src={STATIC_BLOB}
                alt=""
                className="absolute left-[50px] top-[50px] z-10 shrink-0 max-w-none w-[442px] h-[471px] max-[860px]:left-[60%] max-[860px]:top-[70%] max-[860px]:-translate-x-1/2 max-[860px]:-translate-y-1/2 max-[860px]:w-[100%] max-[860px]:h-auto max-[860px]:z-0"
              />
              <Image
                height={320}
                width={156}
                src={STATIC_HERO_IMAGES[0]}
                alt="Hero 1"
                className="mt-[0px] z-20 shrink-0 max-w-none relative max-[860px]:w-[34%] max-[860px]:h-auto"
              />
              <Image
                height={320}
                width={140}
                src={STATIC_HERO_IMAGES[1]}
                alt="Hero 2"
                className="mt-[120px] mr-[15px] z-20 shrink-0 max-w-none relative max-[860px]:w-[30%] max-[860px]:h-auto max-[860px]:mr-0 max-[860px]:mt-[25%]"
              />
              <Image
                height={320}
                width={127}
                src={STATIC_HERO_IMAGES[2]}
                alt="Hero 3"
                className="mt-[20px] z-20 shrink-0 max-w-none relative max-[860px]:w-[28%] max-[860px]:h-auto max-[860px]:mt-[4%]"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
