"use client";

import React, { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// --- CUSTOMOWE KOMPONENTY I IKONY ---

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
      fill="#FFC107"
    />
    <path
      d="M3.15295 7.3455L6.4385 9.755C7.3275 7.554 9.4805 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.159 2 4.828 4.1685 3.15295 7.3455Z"
      fill="#FF3D00"
    />
    <path
      d="M12 22C14.664 22 17.034 20.934 18.7995 19.2315L15.6025 16.6575C14.5805 17.5165 13.3445 18 12 18C9.3625 18 7.13 16.3015 6.2995 13.9395L3.0645 16.427C4.7335 19.7425 8.0935 22 12 22Z"
      fill="#4CAF50"
    />
    <path
      d="M21.8055 10.0415H21V10H12V14H17.6515C17.257 15.108 16.5465 16.036 15.6025 16.6575L18.7995 19.2315C20.659 17.5105 21.8055 14.978 21.8055 12C21.8055 11.3295 21.931 10.675 21.8055 10.0415Z"
      fill="#1976D2"
    />
  </svg>
);

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74s2.57-.99 3.87-.74c.79.15 2.17.62 2.87 1.74-2.52 1.3-2.06 4.98.54 6.13-.53 1.6-1.34 3.09-2.36 5.1zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const LogoAW = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 32L14 8L20 32"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 8L28 32L34 8"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 24H18"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

// Przycisk logowania / rejestracji
const SocialButton = ({
  icon: Icon,
  label,
  provider,
}: {
  icon: React.ElementType;
  label: string;
  provider: string;
}) => (
  <button
    onClick={() => signIn(provider, { callbackUrl: "/dashboard" })}
    className="group relative flex w-full items-center justify-start gap-4 cursor-pointer rounded-xl border border-gray-100 bg-gray-50 px-6 py-4 transition-all duration-300 hover:border-[#0c493e]/30 hover:bg-white hover:shadow-lg active:scale-[0.99] max-[980px]:justify-center"
  >
    <div className="flex h-6 w-6 items-center justify-center">
      <Icon className="h-5 w-5 text-gray-700" />
    </div>
    <span className="font-semibold text-gray-600 group-hover:text-[#0c493e]">
      Kontynuuj przez {label}
    </span>
  </button>
);

export default function LoginPage() {
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

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      // GŁÓWNY KONTENER
      className="flex w-full h-[80%] overflow-hidden rounded-[30px] bg-white shadow-2xl justify-self-center max-[980px]:w-fit "
    >
      {/* --- LEWA KOLUMNA (40% szerokości) --- */}
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
                  <SocialButton
                    provider="apple"
                    label="Apple"
                    icon={AppleIcon}
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
      <div className="w-[60%] bg-[#0c493e] relative flex flex-col items-center justify-center items-  overflow-hidden max-[980px]:hidden">
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

        {/* Treść górna */}
        <div className="relative z-10 self-center ">
          <h2 className="heading heading-sm font-extrabold text-white leading-[1.15]">
            Witaj w Świecie <br />
            <span className="text-[#c5e96b]">Rzetelnej Fizjoterapii</span>
          </h2>
          <p className="mt-6 max-w-md text-white/80 text-lg leading-relaxed">
            System diagnostyki, który uporządkuje Twoje badanie w gabinecie.
            Dołącz do nas i zacznij działać skutecznie.
          </p>
          <div className="mt-6 font-semibold text-[#c5e96b]">
            Ponad 500+ zadowolonych kursantów.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
