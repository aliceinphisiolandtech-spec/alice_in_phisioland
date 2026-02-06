"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Button } from "../ui/Button";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "O e-booku", href: "/" },
  { name: "Strefa pacjenta", href: "/" },
  { name: "Strefa fizjoterapeuty", href: "/" },
  { name: "Kursy", href: "/" },
];

export const Navbar = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  // --- VARIANTS ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
        when: "afterChildren",
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 50, scale: 0.9 },
    show: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 25 },
    },
    exit: {
      opacity: 0,
      x: 50,
      scale: 0.9,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };
  const pathname = usePathname();
  const isHome = pathname === "/";
  console.log(isHome);

  return (
    <>
      {/* --- NAVBAR (z-100) --- */}
      <nav
        className={`${isHome && "absolute"}  top-0 z-[100] w-full pt-4 transition-all duration-300`}
      >
        <div className="mx-auto flex h-20 w-full custom-container items-center justify-between max-[1200px]:px-3">
          {/* --- LOGO --- */}
          <Link
            href="/"
            // ZMIANA: Dodano marginesy (ml-24...), aby logo wyrównało się z tekstem w Hero
            className="relative shrink-0 ml-24 max-[1110px]:ml-12 max-[920px]:ml-6 max-[860px]:ml-0"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Image
              src="/AW-Logo.svg"
              height={50}
              width={50}
              alt="Logo"
              priority
              className="opacity-100 transition-opacity duration-300 hover:opacity-80"
            />
          </Link>

          {/* --- DESKTOP MENU --- */}
          <div
            className="hidden items-center rounded-full border border-white/5 bg-white/5 p-1 backdrop-blur-sm min-[890px]:flex"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {navLinks.map((link, idx) => (
              <Link
                key={link.name}
                href={link.href}
                onMouseEnter={() => setHoveredIndex(idx)}
                className="relative z-10 px-6 py-2.5 text-[14px] font-medium transition-colors duration-300"
              >
                <span
                  className={cn(
                    "relative z-20 transition-colors duration-300",
                    hoveredIndex === idx ? "text-white" : "text-foreground/70",
                  )}
                >
                  {link.name}
                </span>

                {hoveredIndex === idx && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 z-10 rounded-full bg-primary shadow-lg shadow-primary/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 180, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* --- DESKTOP BUTTON --- */}
          <div className="flex shrink-0 items-center gap-4 max-[890px]:hidden">
            <Button href="/logowanie">Zaloguj</Button>
          </div>
        </div>
      </nav>

      {/* --- TOGGLE BUTTON (z-150) --- */}
      <div className="absolute top-0 z-[150] w-full pt-4 pointer-events-none min-[890px]:hidden">
        <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-end px-2">
          <motion.button
            layout
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ WebkitTapHighlightColor: "transparent" }}
            className={cn(
              "pointer-events-auto flex items-center justify-center transition-colors outline-none focus:outline-none ring-0",
              isMobileMenuOpen
                ? "bg-black text-white rounded-full p-0 shadow-2xl border border-white/10"
                : "p-0 bg-transparent text-black",
            )}
            aria-label="Toggle menu"
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* GÓRNA KRESKA */}
              <motion.line
                x1="4"
                y1="8"
                x2="20"
                y2="8"
                animate={{
                  rotate: isMobileMenuOpen ? 45 : 0,
                  y: isMobileMenuOpen ? 4 : 0,
                  stroke: isMobileMenuOpen ? "#ffffff" : "currentColor",
                }}
              />

              {/* DOLNA KRESKA */}
              <motion.line
                x1="10"
                y1="16"
                x2="20"
                y2="16"
                animate={{
                  rotate: isMobileMenuOpen ? -45 : 0,
                  y: isMobileMenuOpen ? -4 : 0,
                  x1: isMobileMenuOpen ? 4 : 10,
                  stroke: isMobileMenuOpen ? "#ffffff" : "currentColor",
                }}
              />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* --- MOBILE MENU OVERLAY (z-110) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[110] backdrop-blur-md bg-black/20 min-[890px]:hidden"
            />

            {/* Menu Container */}
            <motion.div
              initial="hidden"
              animate="show"
              exit="exit"
              variants={containerVariants}
              className="fixed inset-0 z-[120] flex flex-col justify-center pointer-events-none min-[890px]:hidden"
            >
              {/* Links */}
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.name}
                  variants={itemVariants}
                  className={cn(
                    "flex w-full justify-end pointer-events-auto",
                    idx === 0 && "pr-6",
                    idx === 1 && "pr-6",
                    idx === 2 && "pr-6",
                    idx === 3 && "pr-6",
                  )}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={cn(
                      "inline-block rounded-full bg-black px-8 py-4 text-lg font-medium text-white shadow-2xl transition-transform outline-none focus:outline-none",
                      "hover:scale-105 active:scale-95 border border-white/10 mb-4",
                    )}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              {/* Login Button Mobile */}
              <motion.div
                variants={itemVariants}
                className="flex w-full justify-end pr-6 pointer-events-auto mt-2"
              >
                <Link
                  href="/logowanie"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className={cn(
                    "flex items-center justify-center rounded-full px-12 py-4 transition-transform active:scale-95 outline-none focus:outline-none",
                    "bg-primary shadow-2xl shadow-primary/20",
                    "text-lg font-medium text-white",
                    "hover:bg-primary/90",
                  )}
                >
                  Zaloguj się
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
