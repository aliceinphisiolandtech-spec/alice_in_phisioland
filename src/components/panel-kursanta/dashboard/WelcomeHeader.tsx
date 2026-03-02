"use client";

import { motion, Variants } from "framer-motion"; // 1. Importujemy typ Variants
import Image from "next/image";
import { useEffect, useState } from "react";

interface WelcomeHeaderProps {
  userName: string;
}

// 2. Jawnie typujemy obiekt wariantów, żeby naprawić błąd TypeScript
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export const WelcomeHeader = ({ userName }: WelcomeHeaderProps) => {
  const [greeting, setGreeting] = useState("Dzień dobry");

  useEffect(() => {
    // Obliczamy czas tylko po stronie klienta, aby uniknąć błędu Hydration Mismatch
    const currentHour = new Date().getHours();

    // Mała optymalizacja: ustawiamy stan tylko jeśli faktycznie jest wieczór,
    const setUpGreating = () => {
      if (currentHour >= 18 || currentHour < 5) {
        setGreeting("Dobry wieczór");
      }
    };
    setUpGreating();
  }, []);

  return (
    <motion.header
      variants={itemVariants}
      // Jeśli rodzic (DashboardClient) steruje animacją (initial="hidden" animate="visible"),
      // to ten komponent odziedziczy te stany automatycznie.
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#103830]">
          {greeting}, {userName}!
        </h1>
        <p className="text-sm md:text-base text-gray-500 font-medium mt-1">
          Witaj na panelu kursanta!
        </p>
      </div>

      <div className="relative h-12 w-12 md:h-14 md:w-14 shrink-0">
        <Image
          src="/AW-logo.svg"
          alt="Logo"
          fill
          className="object-contain"
          priority // Warto dodać priority dla LCP (największego elementu), jeśli to logo jest widoczne od razu
        />
      </div>
    </motion.header>
  );
};
