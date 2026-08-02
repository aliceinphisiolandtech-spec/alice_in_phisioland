"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ArrowRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import React from "react";
import {
  fadeUp,
  fadeRight,
  fadeLeft,
  staggerContainer,
  revealOnScroll,
} from "@/lib/animations";

// Zaktualizuj interfejsy (jeśli nie importujesz z lib/types)
interface TestimonialReview {
  id: string;
  rating: number;
  headline: string;
  text: string;
  role: string;
  name: string;
  avatar: string;
}

interface TestimonialsProps {
  data: {
    headline: any;
    highlight?: string;
    reviews?: TestimonialReview[];
  };
}

export const Testimonials = ({ data }: TestimonialsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const reviews = data.reviews || [];
  const activeTestimonial = reviews[activeIndex];

  const renderHeadline = () => {
    // ... logic for headline rendering (bez zmian)
    const headlineAny = data.headline as any;

    if (typeof headlineAny === "object" && headlineAny !== null) {
      return (
        <>
          {headlineAny.line1} <br />
          <span className="text-highlight">
            {headlineAny.line2}
            <span className="absolute bottom-1 left-0 -z-10 h-3 w-full bg-[#D4F0C8]/40" />
          </span>
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
              <span className="text-highlight relative inline-block">
                {highlight}
                <span className="absolute bottom-1 left-0 -z-10 h-3 w-full bg-[#D4F0C8]/40" />
              </span>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  // Zwracamy null tylko jeśli w ogóle nie ma recenzji

  if (reviews.length === 0) return null;

  return (
    <section className="bg-white py-40 ">
      <div className="custom-container px-4">
        <motion.div
          variants={fadeUp}
          {...revealOnScroll}
          className="mb-16 text-center"
        >
          <h2 className="heading text-[#103830]">{renderHeadline()}</h2>
        </motion.div>

        <div className="flex flex-row items-stretch gap-8 max-[1024px]:flex-col">
          {/* LEWA KOLUMNA: Aktywna opinia (Karta) */}
          <motion.div
            variants={fadeRight}
            {...revealOnScroll}
            className="relative flex w-[60%] flex-col justify-between rounded-3xl bg-[#103830] p-10 text-white shadow-xl max-[1024px]:w-full max-[640px]:p-6"
          >
            <Quote
              className="absolute right-6 top-6 text-white/10 max-[450]:w-[50px] max-[450]:top-1"
              size={80}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 h-full flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={cn(
                          i < Math.floor(activeTestimonial?.rating || 5)
                            ? "fill-[#F59E0B] text-[#F59E0B]"
                            : "fill-white/20 text-white/20",
                        )}
                      />
                    ))}
                  </div>

                  <h3 className="text-2xl font-bold text-[#D4F0C8] mb-4 max-[640px]:text-xl max-[450]:text-lg">
                    &quot;{activeTestimonial?.headline}&quot;
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-200 max-[640px]:text-[16px] max-[450px]:text-[14px]">
                    {activeTestimonial?.text}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-10 pt-6 border-t border-white/10">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#D4F0C8]">
                    <Image
                      src={activeTestimonial?.avatar || "/default-avatar.png"} // UŻYWA AVATARA Z GOOGLE
                      alt={activeTestimonial?.name || "Użytkownik"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">
                      {activeTestimonial?.name}
                    </p>
                    <p className="text-sm text-[#D4F0C8]/80 uppercase tracking-wider">
                      {activeTestimonial?.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* PRAWA KOLUMNA: Lista do wyboru */}
          <motion.div
            variants={staggerContainer}
            {...revealOnScroll}
            className="flex w-[40%] flex-col gap-4 max-[1024px]:w-full"
          >
            {reviews.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <motion.div key={item.id} variants={fadeLeft}>
                <button
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "group relative flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-300 overflow-hidden cursor-pointer",
                    isActive
                      ? "bg-white shadow-md scale-[1.02]"
                      : "bg-white/50 hover:bg-white hover:shadow-sm",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#103830]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}

                  <div
                    className={cn(
                      "relative h-12 w-12 shrink-0 overflow-hidden rounded-full transition-all",
                      isActive ? "grayscale-0" : "grayscale",
                    )}
                  >
                    <Image
                      src={item.avatar || "/default-avatar.png"} // UŻYWA AVATARA Z GOOGLE
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h4
                      className={cn(
                        "font-bold transition-colors",
                        isActive
                          ? "text-[#103830]"
                          : "text-gray-600 group-hover:text-[#103830]",
                      )}
                    >
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-500 truncate max-w-[200px] max-[1024px]:max-w-full">
                      {item.headline}
                    </p>
                  </div>

                  <ArrowRight
                    size={20}
                    className={cn(
                      "transition-opacity z-10",
                      isActive
                        ? "opacity-100 text-[#103830]"
                        : "opacity-0 group-hover:opacity-50",
                    )}
                  />
                </button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
