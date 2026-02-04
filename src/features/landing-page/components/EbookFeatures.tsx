"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Plus } from "lucide-react"; // Używamy tylko Plus i obracamy go
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

const faqData = [
  {
    question: "Dla kogo jest ebook?",
    answer:
      "Został stworzony z myślą o studentach i świeżo upieczonych fizjoterapeutach, którzy czują stres przed samodzielną pracą z pacjentem i chcą usystematyzować swoją wiedzę diagnostyczną.",
  },
  {
    question: "W jakim formacie otrzymam plik?",
    answer:
      "E-book jest dostępny w formacie PDF, co pozwala na wygodne korzystanie z niego na komputerze, tablecie oraz smartfonie.",
  },
  {
    question: "Czy wiedza w nim zawarta jest czysto teoretyczna?",
    answer:
      "Nie. E-book skupia się na praktycznym zastosowaniu wiedzy, zawierając gotowe algorytmy postępowania i kliniczne przykłady.",
  },
  {
    question: "Czy otrzymam aktualizacje e-booka?",
    answer:
      "Tak, kupując e-booka otrzymujesz dożywotni dostęp do wszystkich przyszłych aktualizacji tego wydania.",
  },
  {
    question: "Czy e-book zastępuje kursy manualne?",
    answer:
      "E-book jest doskonałym uzupełnieniem kursów, porządkującym wiedzę teoretyczną i proces diagnostyczny, ale nie zastępuje praktycznej nauki technik manualnych.",
  },
];

export const EbookFeatures = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Wspólna funkcja renderująca itemy, aby nie powielać kodu animacji
  const renderFAQItem = (item: (typeof faqData)[0], index: number) => {
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
            !isOpen && "border-b border-gray-200", // Linia tylko gdy zamknięte, żeby nie ciąć "karty"
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
            animate={{ rotate: isOpen ? 135 : 0 }} // Obrót Plusa o 135deg tworzy "X"
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
      {/* --- MAIN FLEX CONTAINER --- */}
      <div className="flex flex-row items-start justify-between gap-8 max-[1130px]:justify-center max-[1130px]:gap-24 max-[750px]:flex-col">
        {/* --- LEFT COLUMN (TEXT) --- */}
        <div className="flex w-[33%] flex-col gap-6 max-[1130px]:w-[395px] max-[750px]:text-center max-[750px]:w-[80%] max-[750px]:self-center max-[415px]:w-full">
          <h2 className="heading">
            Wiedza w <br />
            zasięgu <span className="text-highlight">twojej</span>
            <br />
            ręki
          </h2>

          <p className="paragraph text-gray-600">
            Zamień stres przed pierwszym pacjentem na pewność trafnej diagnozy.
            Ten e-book to gotowe algorytmy i testy kliniczne, które wypełniają
            lukę między teorią ze studiów a realną pracą w gabinecie.
          </p>
        </div>

        {/* --- CENTER COLUMN (IMAGE & CTA) --- */}
        <div className="flex w-[30%] flex-col items-center justify-center relative max-[1130px]:w-[300px] max-[750px]:self-center">
          {/* Tablet Image */}
          <div className="relative w-full flex justify-center">
            <Image
              src="/landing-assets/E-book-presentation.webp"
              alt="Fizjoterapeutyczna Diagnostyka Różnicowa"
              width={500}
              height={700}
              className="h-auto object-contain drop-shadow-2xl max-[750px]:w-[80%]"
            />
          </div>

          {/* Decorative Arrow (SVG) */}
          <Image
            height={60}
            width={60}
            src={"/landing-assets/E-book-presentation-arrow.svg"}
            alt="decorative"
            className="absolute bottom-8 -left-4 max-[975]:w-[50px]"
          />

          {/* CTA Button */}
          <div className="mt-16">
            <Button bgColor="bg-primary" className="">
              Otrzymaj dostęp
            </Button>
          </div>
        </div>

        {/* --- RIGHT COLUMN (ACCORDION) | DESKTOP --- */}
        <div className="flex w-[30%] flex-col gap-3 max-[1130px]:hidden">
          <h3 className="mb-4 text-lg font-bold text-black">
            Dla kogo jest ebook?
          </h3>
          <div className="flex flex-col gap-3">
            {faqData.map((item, index) => renderFAQItem(item, index))}
          </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN (ACCORDION) | MOBILE & TABLET --- */}
      <div className="flex-col gap-3 hidden max-[1130px]:flex mx-24 max-[750px]:mx-3">
        <h3 className="text-3xl font-bold text-black text-center mt-36 mb-12">
          Dla kogo jest{" "}
          <span className="text-highlight after:h-1 after:bottom-[3px]">
            ebook?
          </span>
        </h3>

        <div className="flex flex-col gap-3">
          {faqData.map((item, index) => renderFAQItem(item, index))}
        </div>
      </div>
    </section>
  );
};
