"use client";

import React, { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthPageData } from "@/lib/types/landing";

// Importuj swoje komponenty
import { SocialButton } from "./SocialButton";
import { GoogleIcon } from "./GoogleIcon";
import { AppleIcon } from "lucide-react"; // Zmień jeśli masz własny komponent

interface LoginPageProps {
  data: AuthPageData;
}

export const LoginPage = ({ data }: LoginPageProps) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isLoginMode]);

  // Funkcja do inteligentnego renderowania nagłówka
  const renderHeadline = () => {
    const { heroHeadline, heroHighlight } = data;

    if (!heroHeadline) return null;

    // Jeśli nie ma highlightu lub nie występuje w tekście -> zwróć sam tekst
    if (!heroHighlight || !heroHeadline.includes(heroHighlight)) {
      return <>{heroHeadline}</>;
    }

    // Dzielimy tekst na części
    const parts = heroHeadline.split(heroHighlight);

    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <>
                <br />{" "}
                {/* Dodajemy łamanie linii przed wyróżnieniem, tak jak w projekcie */}
                <span className="text-[#c5e96b]">{heroHighlight}</span>
              </>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      // GŁÓWNY KONTENER
      className="flex w-full h-[80%] overflow-hidden rounded-[30px] bg-white shadow-2xl justify-self-center max-[980px]:w-fit "
    >
      {/* --- LEWA KOLUMNA (40% szerokości) - BEZ ZMIAN --- */}
      <div className="w-[40%]  flex flex-col p-16 bg-white relative max-[1080px]:px-8 max-[980px]:w-full  max-[980px]:p-0 ">
        {/* Nagłówek z Logo */}
        <div className="relative overflow-hidden flex items-center gap-4 max-[768px]:flex-col max-[768px]:text-center max-[980px]:bg-primary max-[980px]:py-3 max-[980px]:justify-center  ">
          {/* Tło Dekoracyjne AW dla Mobile */}
          <div className="absolute top-0 right-0 h-full w-full pointer-events-none opacity-[0.1] hidden max-[980px]:block">
            <svg
              className="h-full w-full object-cover"
              viewBox="0 0 400 400"
              fill="none"
            >
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="1200"
                fontWeight="bold"
                fill="white"
              >
                AW
              </text>
            </svg>
          </div>

          {/* Logo SVG */}
          <svg
            width="50 "
            height="48"
            viewBox="0 0 75 58"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 max-[980px]:fill-white"
          >
            <path
              d="M41.2703 9.30567L38.6351 20.2559L32.5946 0.60166L38.8378 0.481328L41.2703 9.30567Z"
              fill="black"
              className=" max-[980px]:fill-white"
            />
            <path
              d="M50.8378 41.8755L50.8675 41.7705L48.9829 34.5754L52.7258 21.4191L54.4439 29.1276L54.4459 29.1203L58.0541 45.325L68.5135 0H75L61.0541 57.5989H55.0135L50.8378 41.8755Z"
              fill="black"
              className=" max-[980px]:fill-white"
            />
            <path
              d="M6.36486 58H0L14.6351 0.360996H24.2838L35.8784 47.2102L47.9595 0.481328H53.8784L39.7703 58H31.7027L27.8108 41.3541H12.9324L14.7568 33.8534H26.1892L19.3784 5.49516L6.36486 58Z"
              fill="black"
              className=" max-[980px]:fill-white"
            />
          </svg>

          {/* Tekst obok logo */}
          <div className="relative z-10 flex flex-col ">
            <span className="text-[12px] font-bold uppercase  text-black font-montserrat       max-[980px]:text-white">
              Alicja Wójcik
            </span>
            <span className="text-[12px] font-light font-montserrat italic max-[980px]:text-white">
              aliceinphysioland
            </span>
          </div>
        </div>

        {/* Sekcja Logowania / Rejestracji z Animacją */}
        <div className="flex h-full w-full">
          <div className="flex flex-col w-full justify-center text-center max-[980px]:px-8 max-[390px]:px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLoginMode ? "login" : "register"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full flex flex-col items-center"
              >
                <h1 className="mb-4 text-4xl font-extrabold text-[#0c493e]">
                  {isLoginMode ? "Zaloguj się" : "Zarejestruj się"}
                </h1>
                <p className="mb-10 text-gray-500 font-medium">
                  {isLoginMode
                    ? "Wybierz metodę logowania, aby przejść do panelu."
                    : "Dołącz do społeczności i zacznij korzystać z platformy."}
                </p>

                <div className="flex flex-col gap-4 w-full">
                  <SocialButton
                    provider="google"
                    label="Google"
                    icon={GoogleIcon}
                  />
                </div>

                <div className="mt-8 flex items-center flex-col gap-3 justify-center text-md font-medium text-gray-500 w-full">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#0c493e] transition-colors">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#0c493e] focus:ring-[#c5e96b]"
                    />
                    {isLoginMode
                      ? "Zapamiętaj mnie"
                      : "Akceptuję regulamin serwisu"}
                  </label>

                  <div className="text-md text-gray-400">
                    {isLoginMode ? "Nie masz konta? " : "Masz już konto? "}
                    <button
                      onClick={() => setIsLoginMode(!isLoginMode)}
                      className="font-bold text-[#0c493e] hover:underline decoration-[#c5e96b] bg-transparent border-none cursor-pointer p-0"
                    >
                      {isLoginMode ? "Zarejestruj się" : "Zaloguj się"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {/* Stopka lewej kolumny */}
      </div>

      {/* --- PRAWA KOLUMNA (60% szerokości - Zielona) --- */}
      <div className="w-[60%] bg-[#0c493e] relative flex flex-col items-center justify-center overflow-hidden max-[980px]:hidden">
        {/* Tło Dekoracyjne (Duże litery AV w tle) */}
        <div className="absolute top-0 right-0 h-full w-full pointer-events-none opacity-[0.05]">
          <svg
            className="h-full w-full object-cover"
            viewBox="0 0 400 400"
            fill="none"
          >
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize="400"
              fontWeight="bold"
              fill="white"
            >
              AW
            </text>
          </svg>
        </div>

        {/* Treść górna - ZMAPOWANE DANE Z CMS (POPRAWIONE) */}
        <div className="relative z-10 self-center  px-8">
          <h2 className="heading heading-sm font-extrabold text-white leading-[1.15]">
            {/* Tutaj używamy funkcji renderującej */}
            {renderHeadline()}
          </h2>
          <p className="mt-6 max-w-md  text-white/80 text-lg leading-relaxed">
            {data.heroDescription}
          </p>
          <div className="mt-6 font-semibold text-[#c5e96b]">
            {data.badgeText}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
