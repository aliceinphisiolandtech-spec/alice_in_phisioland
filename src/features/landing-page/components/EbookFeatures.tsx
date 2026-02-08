"use client";

import { useState } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { EbookFeaturesData, FaqItem } from "@/lib/types/landing";

// --- STAŁE ŚCIEŻKI I ZASOBY (Hardcoded in Code) ---
const DECORATIVE_ARROW = "/landing-assets/E-book-presentation-arrow.svg";
const STATIC_IMAGE_SRC = "/landing-assets/E-book-presentation.webp"; // Twoja grafika ebooka
const STATIC_IMAGE_ALT = "Okładka E-booka o diagnostyce"; // Stały tekst alternatywny
const STATIC_BUTTON_URL = "/ebook-landing-page"; // Stały link

interface EbookFeaturesProps {
  data: EbookFeaturesData;
}

export const EbookFeatures = ({ data }: EbookFeaturesProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // 1. Funkcja renderująca nagłówek z kolorem (tak jak w Hero)
  const renderHeadline = () => {
    const { headline, highlight } = data;

    // Jeśli brak highlightu lub nie ma go w tekście -> wyświetl zwykły tekst
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
              <span className="text-highlight relative inline-block">
                {highlight}
              </span>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  const renderFAQItem = (item: FaqItem, index: number) => {
    const isOpen = openIndex === index;

    return (
      <motion.div
        key={index}
        layout
        initial={false}
        onClick={() => setOpenIndex(isOpen ? null : index)}
        className={cn(
          "cursor-pointer overflow-hidden rounded-xl border border-transparent transition-colors duration-300",
          isOpen
            ? "bg-gray-50 border-gray-100"
            : "bg-transparent hover:bg-gray-50/50",
        )}
      >
        <motion.div
          layout="position"
          className={cn(
            "flex w-full items-center justify-between p-4 text-left",
            !isOpen && "border-b border-gray-200",
          )}
        >
          <span className="pr-4 text-[15px] font-medium text-black transition-colors">
            {item.question}
          </span>
          <motion.div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
              isOpen ? "bg-primary text-white" : "bg-primary/10 text-primary",
            )}
            animate={{ rotate: isOpen ? 135 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Plus size={16} />
          </motion.div>
        </motion.div>

        <AnimatePresence initial={false} mode="wait">
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              <div className="px-4 pb-4 pt-0">
                <p className="text-[14px] leading-relaxed text-gray-600">
                  {item.answer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <section className="custom-container relative bg-white py-24 px-4 max-[1130px]:flex max-[1130px]:flex-col">
      <div className="flex flex-row items-start justify-between gap-8 max-[1130px]:justify-center max-[1130px]:gap-24 max-[750px]:flex-col">
        {/* LEWA KOLUMNA: TREŚĆ */}
        <div className="flex w-[33%] flex-col gap-6 max-[1130px]:w-[395px] max-[750px]:text-center max-[750px]:w-[80%] max-[750px]:self-center max-[415px]:w-full">
          {/* Użycie renderHeadline zamiast line1/line2 */}
          <h2 className="heading">{renderHeadline()}</h2>

          <p className="paragraph text-gray-600">{data.description}</p>
        </div>

        {/* ŚRODKOWA KOLUMNA: GRAFIKA I PRZYCISK */}
        <div className="flex w-[30%] flex-col items-center justify-center relative max-[1130px]:w-[300px] max-[750px]:self-center">
          <div className="relative w-full flex justify-center">
            {/* STATIC_IMAGE_SRC - Obrazek na sztywno */}
            <Image
              src={STATIC_IMAGE_SRC}
              alt={STATIC_IMAGE_ALT}
              width={500}
              height={700}
              className="h-auto object-contain drop-shadow-2xl max-[750px]:w-[80%]"
            />
          </div>

          <Image
            height={60}
            width={60}
            src={DECORATIVE_ARROW}
            alt="decorative"
            className="absolute bottom-8 -left-4 max-[975]:w-[50px]"
          />

          <div className="mt-16">
            {/* STATIC_BUTTON_URL - Link na sztywno, Label z CMS */}
            <Button bgColor="bg-primary" href={STATIC_BUTTON_URL}>
              {data.button.label}
            </Button>
          </div>
        </div>

        {/* PRAWA KOLUMNA: FAQ (DESKTOP) */}
        <div className="flex w-[30%] flex-col gap-3 max-[1130px]:hidden">
          <h3 className="mb-4 text-lg font-bold text-black">
            {data.faq.title}
          </h3>
          <div className="flex flex-col gap-3">
            {data.faq.items.map((item, index) => renderFAQItem(item, index))}
          </div>
        </div>
      </div>

      {/* FAQ (MOBILE/TABLET) */}
      <div className="flex-col gap-3 hidden max-[1130px]:flex mx-24 max-[750px]:mx-3">
        {/* Wyświetlamy tytuł prosto z CMS, bez replace */}
        <h3 className="text-3xl font-bold text-black text-center mt-36 mb-12">
          {data.faq.title}
        </h3>

        <div className="flex flex-col gap-3">
          {data.faq.items.map((item, index) => renderFAQItem(item, index))}
        </div>
      </div>
    </section>
  );
};
