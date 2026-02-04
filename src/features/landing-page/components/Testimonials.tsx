"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ArrowRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const testimonials = [
  {
    id: 1,
    name: "Tomasz Kowalski",
    role: "Fizjoterapeuta",
    rating: 5,
    headline: "Absolutny game-changer",
    text: "System diagnostyki różnicowej Alicji zmienił moją pracę w gabinecie. Zobaczyłem, że nie muszę zgadywać, a mogę opierać się na twardych danych. To absolutny game-changer w mojej praktyce.",
    image:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
  },
  {
    id: 2,
    name: "Sebastian Piasecki",
    role: "Student Fizjoterapii",
    rating: 5,
    headline: "Koniec z laniem wody",
    text: "Niesamowita dawka wiedzy. Ebook jest konkretny, bez lania wody. Czerwone flagi omówione w sposób, który daje mi spokój ducha przy każdym pacjencie. Egzaminy stały się prostsze.",
    image:
      "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
  },
  {
    id: 3,
    name: "Anna Nowak",
    role: "Osteopata",
    rating: 4.5,
    headline: "Podejście oparte na EBM",
    text: "W końcu ktoś zebrał to w jedną całość. Algorytmy postępowania to złoto. Polecam każdemu, kto czuje się niepewnie w diagnostyce. Bardzo podoba mi się podejście oparte na EBM.",
    image:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
  },
  {
    id: 4,
    name: "Katarzyna Wójcik",
    role: "Fizjoterapeuta",
    headline: "Pewność trafnej hipotezy",
    rating: 5,
    text: "Sprawdź, jak system diagnostyki różnicowej zmienia codzienną pracę. Zamieniłam paraliż decyzyjny na pewność trafnej hipotezy klinicznej. Pacjenci to widzą i doceniają.",
    image:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
  },
];

export const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTestimonial = testimonials[activeIndex];

  return (
    <section className="bg-[#F9FAFB] py-24 max-[1024px]:py-16">
      <div className="custom-container px-4">
        {/* --- HEADER --- */}
        <div className="mb-16 text-center">
          <h2 className="heading text-[#103830]">
            Zaufanie budowane na <br />
            <span className="text-highlight ">
              rzetelnej wiedzy
              <span className="absolute bottom-1 left-0 -z-10 h-3 w-full bg-[#D4F0C8]/40" />
            </span>
          </h2>
        </div>

        {/* --- MAIN CONTENT SPLIT --- */}
        <div className="flex flex-row items-stretch gap-8 max-[1024px]:flex-col">
          {/* --- LEWA STRONA: GŁÓWNA SCENA --- */}
          <div className="relative flex w-[60%] flex-col justify-between rounded-3xl bg-[#103830] p-10 text-white shadow-xl max-[1024px]:w-full max-[640px]:p-6">
            <Quote
              className="absolute right-6 top-6 text-white/10 max-[450]:w-[50px] max-[450]:top-1"
              size={80}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial.id}
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
                          i < Math.floor(activeTestimonial.rating)
                            ? "fill-[#F59E0B] text-[#F59E0B]"
                            : "fill-white/20 text-white/20",
                        )}
                      />
                    ))}
                  </div>

                  <h3 className="text-2xl font-bold text-[#D4F0C8] mb-4 max-[640px]:text-xl max-[450]:text-lg">
                    &quot;{activeTestimonial.headline}&quot;
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-200 max-[640px]:text-[16px] max-[450px]:text-[14px]">
                    {activeTestimonial.text}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-10 pt-6 border-t border-white/10">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#D4F0C8]">
                    <Image
                      src={activeTestimonial.image}
                      alt={activeTestimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">
                      {activeTestimonial.name}
                    </p>
                    <p className="text-sm text-[#D4F0C8]/80 uppercase tracking-wider">
                      {activeTestimonial.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* --- PRAWA STRONA: LISTA WYBORU --- */}
          <div className="flex w-[40%] flex-col gap-4 max-[1024px]:w-full">
            {testimonials.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "group relative flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-300 overflow-hidden",
                    // Usunąłem border-l-4, teraz border jest stały i przezroczysty, żeby nic nie skakało
                    isActive
                      ? "bg-white shadow-md scale-[1.02]"
                      : "bg-white/50 hover:bg-white hover:shadow-sm",
                  )}
                >
                  {/* --- MAGICZNY PASEK (SLIDING INDICATOR) --- */}
                  {/* To jest ten element, który się przesuwa między kafelkami */}
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
                      src={item.image}
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
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
