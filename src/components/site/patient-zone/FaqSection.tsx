"use client";

import { useState, useRef } from "react";
import { ArrowRight, MessageSquare, Quote } from "lucide-react";

export const FaqSection = ({ content }: { content: any }) => {
  const [activeId, setActiveId] = useState<number>(1);
  const answerRef = useRef<HTMLDivElement>(null);

  // Znajdź aktywną odpowiedź
  const activeItem = content.items.find((item: any) => item.id === activeId);

  // Funkcja obsługująca zmianę pytania i scrollowanie
  const handleQuestionClick = (id: number) => {
    setActiveId(id);

    // Logika scrollowania tylko dla widoku kolumnowego (mobile/tablet < 1024px)
    if (window.innerWidth < 1024 && answerRef.current) {
      const yOffset = -120;
      const element = answerRef.current;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <section className="bg-gray-50 py-44 relative overflow-hidden">
      <div className="custom-container px-4">
        {/* Nagłówek */}
        <div className="mb-16">
          <span className="text-[#0c493e] font-bold tracking-widest uppercase text-xs mb-3 block opacity-80">
            {content.badge}
          </span>
          <h2 className="text-4xl font-bold text-[#0c493e] max-[1024px]:text-3xl">
            {content.title}
          </h2>
        </div>

        {/* Layout: Wiersz na desktopie, Kolumna poniżej 1024px */}
        <div className="flex flex-row gap-16 max-[1024px]:flex-col max-[1024px]:gap-8">
          {/* --- LEWA KOLUMNA: Lista Pytań --- */}
          <div className="flex-1 flex flex-col gap-2">
            {content.items.map((item: any) => (
              <button
                key={item.id}
                onClick={() => handleQuestionClick(item.id)}
                className={`group flex items-center cursor-pointer justify-between p-6 rounded-2xl text-left transition-all duration-300 border-2 pointer-cursor ${
                  activeId === item.id
                    ? "bg-white border-[#0c493e] shadow-md scale-[1.02]"
                    : "bg-white border-transparent hover:border-gray-200 hover:bg-white/80 text-gray-600"
                }`}
              >
                <span
                  className={`font-bold text-lg ${
                    activeId === item.id ? "text-[#0c493e]" : "text-gray-500"
                  }`}
                >
                  {item.question}
                </span>

                {/* Strzałka */}
                <ArrowRight
                  className={`w-5 h-5 transition-all duration-300 ${
                    activeId === item.id
                      ? "text-[#0c493e] opacity-100 translate-x-0"
                      : "text-gray-300 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* --- PRAWA KOLUMNA: Karta Odpowiedzi (Sticky) --- */}
          {/* Ref podpięty tutaj do scrollowania */}
          <div className="flex-1" ref={answerRef}>
            <div className="sticky top-32">
              <div className="relative bg-[#0c493e] rounded-[2rem] p-12 shadow-2xl overflow-hidden min-h-[400px] flex flex-col justify-center max-[1024px]:p-8">
                {/* Dekoracje tła */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4f0c8] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#00cca3] opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                <Quote className="absolute top-8 right-8 w-12 h-12 text-[#d4f0c8] opacity-20 rotate-180" />

                {/* Treść odpowiedzi z animacją */}
                <div key={activeId} className="relative z-10 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#d4f0c8]/20 flex items-center justify-center text-[#d4f0c8]">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[#d4f0c8] text-sm font-bold uppercase tracking-wider">
                      Odpowiedź
                    </span>
                  </div>

                  <h3 className="text-3xl font-bold text-white mb-6 leading-tight max-[1024px]:text-2xl">
                    {activeItem?.question}
                  </h3>

                  <p className="text-white/80 text-lg leading-relaxed font-light">
                    {activeItem?.answer}
                  </p>
                </div>

                {/* Dekoracyjna linia na dole */}
                <div
                  className="absolute bottom-0 left-0 h-2 bg-[#d4f0c8] transition-all duration-500 ease-out"
                  style={{
                    width: `${(activeId / content.items.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
