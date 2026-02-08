"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Button } from "../ui/Button";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import {
  ChevronDown,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

const navLinks = [
  { name: "Strona główna", href: "/" },
  { name: "O e-booku", href: "/" },
  { name: "Strefa pacjenta", href: "/" },
  { name: "Strefa fizjoterapeuty", href: "/" },
  { name: "Kursy", href: "/" },
];

interface NavbarProps {
  session: Session | null;
}

export const Navbar = ({ session }: NavbarProps) => {
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

  // --- LOGIKA RESPONSYWNOŚCI ---
  // Jeśli jest sesja -> mobile menu włącza się poniżej 1080px
  // Jeśli brak sesji -> mobile menu włącza się poniżej 890px
  const desktopMenuClass = session ? "min-[1080px]:flex" : "min-[890px]:flex";
  const mobileToggleClass = session
    ? "min-[1080px]:hidden"
    : "min-[890px]:hidden";
  const desktopButtonClass = session
    ? "max-[1080px]:hidden"
    : "max-[890px]:hidden";

  return (
    <>
      {/* --- NAVBAR (z-100) --- */}
      <nav
        className={`${
          isHome && "absolute"
        } top-0 z-[100] w-full pt-4 transition-all duration-300`}
      >
        <div className="mx-auto flex h-20 w-full custom-container items-center justify-between max-[1200px]:px-3">
          {/* --- LOGO --- */}
          <Link
            href="/"
            className="relative shrink-0 ml-24 max-[1110px]:ml-12 max-[920px]:ml-6 max-[860px]:ml-0 pointer-cursor"
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
            className={cn(
              "hidden items-center rounded-full border border-white/5 bg-white/5 p-1 backdrop-blur-sm",
              desktopMenuClass, // Dynamiczna klasa responsywności
            )}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {navLinks.map((link, idx) => (
              <Link
                key={link.name}
                href={link.href}
                onMouseEnter={() => setHoveredIndex(idx)}
                className="relative z-10 px-6 py-2.5 text-[14px] font-medium transition-colors duration-300 pointer-cursor"
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
                    transition={{
                      type: "spring",
                      stiffness: 180,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* --- DESKTOP BUTTON / PROFILE --- */}
          <div
            className={cn(
              "flex shrink-0 items-center gap-4",
              desktopButtonClass,
            )}
          >
            {session ? (
              <NavbarProfile session={session} />
            ) : (
              <Button href="/logowanie" className="pointer-cursor">
                Zaloguj
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* --- TOGGLE BUTTON (Mobile) --- */}
      <div
        className={cn(
          "absolute top-0 z-[150] w-full pt-4 pointer-events-none",
          mobileToggleClass,
        )}
      >
        <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-end px-2">
          <motion.button
            layout
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ WebkitTapHighlightColor: "transparent" }}
            className={cn(
              "pointer-events-auto flex items-center justify-center transition-colors outline-none focus:outline-none ring-0 pointer-cursor",
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

      {/* --- MOBILE MENU OVERLAY --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "fixed inset-0 z-[110] backdrop-blur-md bg-black/20 pointer-cursor",
                mobileToggleClass, // Używamy tej samej klasy hidden co toggle button
              )}
            />

            <motion.div
              initial="hidden"
              animate="show"
              exit="exit"
              variants={containerVariants}
              className={cn(
                "fixed inset-0 z-[120] flex flex-col justify-center pointer-events-none",
                mobileToggleClass, // Używamy tej samej klasy hidden co toggle button
              )}
            >
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.name}
                  variants={itemVariants}
                  className={cn(
                    "flex w-full justify-end pointer-events-auto",
                    "pr-6",
                  )}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={cn(
                      "inline-block rounded-full bg-black px-8 py-4 text-lg font-medium text-white shadow-2xl transition-transform outline-none focus:outline-none pointer-cursor",
                      "hover:scale-105 active:scale-95 border border-white/10 mb-4",
                    )}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                variants={itemVariants}
                className="flex w-full justify-end pr-6 pointer-events-auto mt-2"
              >
                {session ? (
                  <Link
                    href={
                      session.user.role === "admin"
                        ? "/admin"
                        : "/?coming-soon=true"
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-full px-12 py-4 transition-transform active:scale-95 outline-none focus:outline-none pointer-cursor",
                      "bg-[#0c493e] shadow-2xl shadow-[#0c493e]/20 border border-white/10",
                      "text-lg font-medium text-white",
                      "hover:bg-[#0c493e]/90",
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Twój Panel
                  </Link>
                ) : (
                  <Link
                    href="/logowanie"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={cn(
                      "flex items-center justify-center rounded-full px-12 py-4 transition-transform active:scale-95 outline-none focus:outline-none pointer-cursor",
                      "bg-primary shadow-2xl shadow-primary/20",
                      "text-lg font-medium text-white",
                      "hover:bg-primary/90",
                    )}
                  >
                    Zaloguj się
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// --- KOMPONENT PROFILU ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NavbarProfile = ({ session }: { session: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const user = session.user;

  const dashboardLink = user.role === "admin" ? "/admin" : "/?coming-soon=true";

  const getInitials = (name?: string | null) => {
    if (!name) return "AW";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className="group relative flex items-center gap-3 cursor-pointer p-1 pr-3 rounded-full bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 select-none pointer-cursor z-50"
    >
      {/* Avatar */}
      <div
        className={`h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md transition-transform duration-300 relative ${
          isExpanded ? "scale-90 ring-2 ring-[#0c493e]/20" : ""
        }`}
      >
        {user.image ? (
          <Image src={user.image} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-[#0c493e] flex items-center justify-center text-white font-bold text-sm">
            {getInitials(user.name)}
          </div>
        )}
      </div>

      {/* Kontener na Teksty */}
      <div className="relative w-[130px] h-[38px] overflow-hidden">
        {/* WARSTWA 1: Dane Użytkownika */}
        <div
          className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isExpanded
              ? "opacity-0 -translate-y-full pointer-events-none"
              : "opacity-100 translate-y-0"
          }`}
        >
          <span className="text-sm font-bold text-gray-800 leading-tight truncate px-1">
            {user.name || "Użytkownik"}
          </span>
          <span className="text-[10px] text-gray-500 truncate px-1">
            {user.email}
          </span>
        </div>

        {/* WARSTWA 2: Przyciski Akcji */}
        <div
          className={`absolute inset-0 flex items-center justify-between gap-1 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isExpanded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-full pointer-events-none"
          }`}
        >
          {/* Link do Panelu */}
          <Link
            href={dashboardLink}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[#0c493e] hover:bg-[#0c493e]/10 transition-colors pointer-cursor"
            onClick={(e) => e.stopPropagation()}
            title="Przejdź do panelu"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Panel
            </span>
          </Link>

          {/* Wyloguj */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              signOut({ callbackUrl: "/" });
            }}
            className="flex items-center justify-center p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors pointer-cursor"
            title="Wyloguj"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ikona Chevron */}
      <div className="relative h-5 w-5 flex items-center justify-center">
        <ChevronDown
          className={`absolute h-4 w-4 text-gray-400 transition-all duration-300 ${
            isExpanded
              ? "rotate-180 opacity-0 scale-50"
              : "rotate-0 opacity-100 scale-100"
          }`}
        />
        <ChevronLeft
          className={`absolute h-4 w-4 text-[#0c493e] transition-all duration-300 ${
            isExpanded
              ? "rotate-0 opacity-100 scale-100"
              : "-rotate-90 opacity-0 scale-50"
          }`}
        />
      </div>
    </div>
  );
};
