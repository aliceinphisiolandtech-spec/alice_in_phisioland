"use client";

import Link from "next/link";
import {
  MonitorPlay,
  ArrowLeft,
  MapPin,
  CalendarDays,
  ArrowRight,
} from "lucide-react";

export default function CoursesPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-8">
      {/* 1. Ikona Statusu (Neutralna) */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <MonitorPlay size={32} />
      </div>

      {/* 2. Informacja o niedostępności */}
      <div className="text-center mb-10 max-w-md">
        <h1 className="mb-2 text-xl font-bold text-gray-900">
          Sekcja wideo nieaktywna
        </h1>
        <p className="text-sm text-gray-500">
          Obecnie w Twoim panelu dostępne są wyłącznie materiały e-bookowe.
          Moduł kursów wideo nie został jeszcze udostępniony.
        </p>
      </div>

      {/* 3. Ładniejsze CTA - Karta Promocyjna */}
      <div className="relative w-full max-w-sm min-[1024px]:max-w-2xl overflow-hidden rounded-[24px] bg-[#103830] text-white shadow-xl shadow-[#103830]/20 transition-transform hover:scale-[1.02] duration-300 group">
        {/* Dekoracyjne tło */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#D4F0C8]/10 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-[#D4F0C8]/10 blur-3xl" />

        <div className="relative z-10 p-6 flex flex-col items-center text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D4F0C8] backdrop-blur-md">
            <MapPin size={12} />
            Szkolenie Stacjonarne
          </div>

          <h3 className="mb-2 text-lg font-bold leading-tight">
            Zdobądź praktykę pod moim okiem
          </h3>

          <p className="mb-6 text-xs text-gray-300 leading-relaxed max-w-[260px]">
            Wideo to nie wszystko. Zapraszam Cię na warsztaty na żywo, gdzie
            przećwiczymy techniki manualne w praktyce.
          </p>

          <a
            href="https://zewnetrzna-strona.pl" // Link do zapisów
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4F0C8] py-3 text-sm font-bold text-[#103830] transition-all hover:bg-white pointer-cursor"
          >
            Sprawdź terminy i miejsce
            <ArrowRight
              size={16}
              className="transition-transform group-hover/btn:translate-x-1"
            />
          </a>
        </div>
      </div>

      {/* 4. Przycisk powrotu (Subtelny) */}
    </div>
  );
}
