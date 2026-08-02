"use client";

import React from "react";
import { motion } from "framer-motion";
// Importujemy ikony tutaj, wewnątrz komponentu wyświetlającego
import { FileText, Shirt, Coffee, CircleHelp } from "lucide-react";
import {
  fadeUp,
  staggerContainer,
  staggerFast,
  revealOnScroll,
} from "@/lib/animations";

// Mapa ikon dostępnych dla CMS
const ICON_MAP: Record<string, any> = {
  FileText: FileText,
  Shirt: Shirt,
  Coffee: Coffee,
};

export const PreparationSection = ({ content }: { content: any }) => {
  return (
    <section className="bg-[#0c493e] pt-44 pb-44 relative overflow-hidden">
      {/* --- TŁO: Rozmyte elementy (Glow) pod szkłem --- */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#d4f0c8] rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#00cca3] rounded-full blur-[100px] opacity-10 pointer-events-none" />

      <div className="custom-container px-4 relative z-10">
        {/* Nagłówek */}
        <motion.div
          variants={staggerContainer}
          {...revealOnScroll}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.span
            variants={fadeUp}
            className="text-[#d4f0c8] font-bold tracking-widest uppercase text-xs mb-3 block opacity-80"
          >
            {content.badge}
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="text-4xl font-bold text-white mb-6 max-[768px]:text-3xl"
          >
            {content.title}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-white/70 leading-relaxed font-light text-lg"
          >
            {content.description}
          </motion.p>
        </motion.div>

        {/* --- KROKI (GLASS CARDS) --- */}
        <motion.div
          variants={staggerFast}
          {...revealOnScroll}
          className="grid grid-cols-3 gap-8 max-[1024px]:grid-cols-1 max-[1024px]:gap-6"
        >
          {content.steps.map((item: any, index: number) => {
            // Wybieramy ikonę na podstawie stringa z CMS
            // Jeśli string nie pasuje do klucza w ICON_MAP, używamy CircleHelp jako fallback
            const IconComponent = ICON_MAP[item.icon] || CircleHelp;

            return (
              <motion.div key={index} variants={fadeUp} className="relative group">
                {/* Ikona w tle */}
                <div className="absolute -top-6 -right-6 text-[#d4f0c8] opacity-5 group-hover:opacity-10 transition-opacity duration-500 rotate-12 pointer-events-none">
                  <IconComponent className="w-32 h-32" />
                </div>

                {/* Karta Frosted Glass */}
                <div className="h-full bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 flex flex-col items-start gap-6 shadow-xl pointer-cursor">
                  {/* Numer kroku i Ikona */}
                  <div className="flex justify-between items-start w-full">
                    <div className="w-14 h-14 rounded-2xl bg-[#d4f0c8]/10 flex items-center justify-center text-[#d4f0c8] border border-[#d4f0c8]/20 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <span className="text-5xl font-bold text-contrast font-mono select-none">
                      {item.step}
                    </span>
                  </div>

                  {/* Treść */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#d4f0c8] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Opcjonalnie: Linia łącząca na dole */}
        <div className="mt-16 flex justify-center opacity-30">
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4f0c8] to-transparent rounded-full" />
        </div>
      </div>
    </section>
  );
};
