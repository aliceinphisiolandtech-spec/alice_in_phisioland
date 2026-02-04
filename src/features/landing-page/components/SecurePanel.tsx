"use client";

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

// Cechy bezpieczeństwa z ikonami
const securityFeatures = [
  {
    title: "Brak pobierania",
    description:
      "Treści są streamowane w bezpiecznym playerze, bez możliwości zapisu na dysk.",
    icon: FileX,
  },
  {
    title: "Dynamiczny Watermark",
    description:
      "Twoje dane są wyświetlane w losowych miejscach, co zniechęca do nagrywania ekranu.",
    icon: Fingerprint,
  },
  {
    title: "Blokada kopiowania",
    description:
      "Tekst i materiały w panelu są zabezpieczone przed skrótami Ctrl+C / Ctrl+V.",
    icon: ShieldAlert,
  },
  {
    title: "Kontrola wydruku",
    description:
      "Inteligentne blokady uniemożliwiają drukowanie materiałów chronionych prawem autorskim.",
    icon: Printer,
  },
];

export const SecurePanel = () => {
  return (
    <section className="bg-[#103830] py-24 text-white max-[1024px]:py-16">
      <div className="custom-container px-4">
        <div className="flex flex-row items-center gap-16 max-[1024px]:flex-col-reverse max-[1024px]:gap-12">
          {/* --- LEFT COLUMN: IMAGE (MOCKUP) --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative w-[50%] max-[1024px]:w-full max-[1024px]:flex max-[1024px]:justify-center"
          >
            {/* Dekoracyjna poświata pod obrazkiem */}
            <div className="absolute left-1/2 top-1/2 -z-10 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4F0C8]/20 blur-[80px]" />

            {/* Obrazek w "oknie przeglądarki" */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
              {/* Pasek tytułowy przeglądarki (dekoracja) */}
              <div className="flex h-8 items-center gap-2 border-b border-white/10 bg-white/5 px-4">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
              </div>

              {/* Właściwy obrazek */}
              <Image
                src="/landing-assets/image_865524.png" // Podmień na właściwą ścieżkę do obrazka panelu
                alt="Panel Wiedzy"
                width={600}
                height={400}
                className="h-auto w-full object-cover"
              />
            </div>
          </motion.div>

          {/* --- RIGHT COLUMN: TEXT & GRID --- */}
          <div className="flex w-[50%] flex-col gap-8 max-[1024px]:w-full max-[1024px]:text-center max-[1024px]:items-center">
            {/* Nagłówki */}
            <div className="flex flex-col gap-4">
              <h2 className="heading text-white">
                Twój Zabezpieczony <br />
                <span className="text-[#D4F0C8]">Panel Wiedzy</span>
              </h2>
              <p className="paragraph text-gray-300">
                To praktyczne uzupełnienie studiów, które wypełnia lukę między
                dyplomem a pierwszym pacjentem. Poznasz proces diagnostyki i
                otrzymasz dostęp do unikalnych materiałów w bezpiecznym
                środowisku.
              </p>
            </div>

            {/* Grid 2x2 z funkcjami bezpieczeństwa */}
            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1 max-[640px]:w-full">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10 text-left"
                >
                  <feature.icon className="text-[#D4F0C8]" size={24} />
                  <div>
                    <h4 className="font-bold text-white text-[15px] mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Button
                href="/checkout"
                bgColor="bg-[#D4F0C8]"
                textColor="text-[#103830]"
                className="hover:bg-white"
                icon={<ArrowUpRight size={18} />}
              >
                Zarejestruj się
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
