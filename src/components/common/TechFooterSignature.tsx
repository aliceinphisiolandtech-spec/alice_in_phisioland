"use client";

import React from "react";
// Upewnij się, że ścieżka do GridScan jest poprawna w Twoim projekcie
import { GridScan } from "../GridScan";
import ColorBends from "../ColorBends";

export const TechFooterSignature = () => {
  return (
    <div className="flex justify-center items-center absolute right-2 top-0 max-[600px]:top-10 max-[600px]:left-1/2 max-[600px]:-translate-x-1/2 max-[600px]:w-full ">
      <a
        href="https://kocikdev.com"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative isolate flex items-center gap-4 px-6 py-3 transition-all duration-300 max-[360px]:px-0"
      >
        {/* --- TŁO: CZARNE + CANVAS 3D --- */}
        <div
          className="absolute inset-0 -z-10 overflow-hidden bg-black
                     opacity-0 scale-95 transition-all duration-500 ease-out
                     group-hover:opacity-100 group-hover:scale-100
                     rounded-xl shadow-lg group-hover:shadow-[0_0_20px_-5px_rgba(123,47,247,0.5)]"
        >
          {/* Zaktualizowano kolory na #7b2ff7 */}
          <ColorBends
            colors={["#7b2ff7", "#7b2ff7"]}
            rotation={0}
            speed={0.2}
            scale={1}
            frequency={1}
            warpStrength={1}
            mouseInfluence={1}
            parallax={0.5}
            noise={0.1}
            transparent
            autoRotate={0}
          />
        </div>

        {/* --- ZAWARTOŚĆ --- */}
        <div className="relative z-10 flex items-center gap-4">
          {/* LOGO */}
          <div className="relative h-8 w-8">
            <svg
              className="w-full h-full"
              viewBox="0 0 500 327"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* ZMIANA: Usunięto fill="#fff" na rzecz klas Tailwind.
                  Teraz logo jest białe, a na hover zmienia się na Twój fiolet. */}
              <path
                d="M186.131 135.949L46.5328 253.684V18.2137L186.131 135.949Z"
                className="fill-white transition-colors duration-300 "
              />
              <path
                opacity="0.9"
                d="M313.869 135.949L453.467 18.2139V253.684L313.869 135.949Z"
                className="fill-white transition-colors duration-300 "
              />
              <path
                d="M116.787 266.423C116.787 266.423 156.827 268.845 174.269 284.671C188.084 297.207 197.079 326.642 197.079 326.642C197.079 326.642 154.506 327.815 136.86 311.131C122.953 297.982 116.787 266.423 116.787 266.423Z"
                className="fill-white transition-colors duration-300 "
              />
              <path
                d="M383.211 266.423C383.211 266.423 343.172 268.845 325.73 284.671C311.914 297.207 302.92 326.642 302.92 326.642C302.92 326.642 345.492 327.815 363.138 311.131C377.045 297.982 383.211 266.423 383.211 266.423Z"
                className="fill-white transition-colors duration-300 "
              />
            </svg>
          </div>

          {/* TEKST */}
          <p className="font-inter text-[15px] font-medium text-gray-300">
            Projekt i wykonanie {/* Zmiana koloru tekstu na #7b2ff7 */}
            <span className="font-bold text-white transition-colors duration-300  group-hover:drop-shadow-[0_0_8px_rgba(123,47,247,0.5)]">
              KocikDev
            </span>
          </p>
        </div>
      </a>
    </div>
  );
};
