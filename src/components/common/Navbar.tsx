/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
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

/* Sekcja: Linki nawigacyjne */
const navLinks = [
  { name: "Strona główna", href: "/" },
  { name: "O e-booku", href: "#o-ebooku" },
  { name: "Kursy", href: "#kursy" },
  { name: "Strefa pacjenta", href: "/strefa-pacjenta" },
];

interface NavbarProps {
  session: Session | null;
}

export const Navbar = ({ session }: NavbarProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("/");
  const pathname = usePathname();
  const isZakupPage = pathname === "/zakup";
  /* Sekcja: Logika Scroll Spy (Active Link) */
  useEffect(() => {
    if (pathname !== "/") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSection(pathname);
      return;
    }

    const observerOptions = {
      root: null,
      /* Zmniejszamy ujemny margines górny, aby szybciej wykrywać wejście sekcji */
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        /* Logika: aktywujemy tylko tę sekcję, która właśnie weszła w interakcję i jest widoczna */
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          if (id === "hero") {
            setActiveSection("/");
          } else if (id) {
            setActiveSection(`#${id}`);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    const sectionIds = ["hero", "o-ebooku", "kursy"];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    /* Bezpiecznik dla powrotu na samą górę */
    const handleManualScroll = () => {
      if (window.scrollY < 50) {
        setActiveSection("/");
      }
    };

    window.addEventListener("scroll", handleManualScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleManualScroll);
    };
  }, [pathname]);

  /* Sekcja: Logika Sticky i Scrolla */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const isAbsolutePosition =
    (pathname === "/" || pathname === "/strefa-pacjenta") && !isScrolled;

  const isLightVersion = pathname === "/strefa-pacjenta" && !isScrolled;
  const isDarkVersion = !isLightVersion;

  /* Sekcja: Animacje Framer Motion */
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
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

  /* Sekcja: Responsywność */
  const desktopMenuClass = session ? "min-[1080px]:flex" : "min-[890px]:flex";
  const mobileToggleClass = session
    ? "min-[1080px]:hidden"
    : "min-[890px]:hidden";
  const desktopButtonClass = session
    ? "max-[1080px]:hidden"
    : "max-[890px]:hidden";

  return (
    <>
      <nav
        className={cn(
          "top-0 z-[100] w-full transition-all duration-500 ease-in-out",
          isScrolled && !isZakupPage
            ? "fixed bg-white/80 backdrop-blur-md shadow-sm py-2"
            : "py-4",
          isAbsolutePosition
            ? "absolute"
            : !isScrolled && "relative bg-white border-b border-gray-100 pb-4",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full custom-container items-center justify-between transition-all duration-500",
            isScrolled ? "h-14" : "h-20",
            "max-[1200px]:px-3",
          )}
        >
          {/* --- LOGO --- */}
          <Link
            href="/"
            className="relative shrink-0 pointer-cursor"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Image
              src={isLightVersion ? "/AW-logo-negatyw.svg" : "/AW-logo.svg"}
              height={isScrolled ? 40 : 50}
              width={isScrolled ? 40 : 50}
              alt="Logo"
              priority
              className="opacity-100 transition-all duration-300 hover:opacity-80"
            />
          </Link>

          {/* --- DESKTOP MENU --- */}
          <div
            className={cn(
              "hidden items-center rounded-full border p-1 backdrop-blur-sm transition-colors duration-300",
              isLightVersion
                ? "border-white/10 bg-white/5"
                : isScrolled
                  ? "border-gray-100 bg-gray-50/50"
                  : "border-gray-200 bg-white/60",
              desktopMenuClass,
            )}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {navLinks.map((link, idx) => {
              const isActive = activeSection === link.href;
              const showPill =
                hoveredIndex === idx || (isActive && hoveredIndex === null);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  className="relative z-10 px-6 py-2.5 text-[14px] font-medium transition-colors duration-300 pointer-cursor"
                >
                  <span
                    className={cn(
                      "relative z-20 transition-colors duration-300",
                      isLightVersion
                        ? showPill
                          ? "text-white"
                          : "text-white/80"
                        : showPill
                          ? "text-white"
                          : "text-gray-600",
                    )}
                  >
                    {link.name}
                  </span>

                  {showPill && (
                    <motion.div
                      layoutId="nav-pill"
                      className={cn(
                        "absolute inset-0 z-10 rounded-full shadow-lg",
                        isDarkVersion
                          ? "bg-[#0c493e] shadow-[#0c493e]/20"
                          : "bg-white/10 shadow-none",
                      )}
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
              );
            })}
          </div>

          {/* --- DESKTOP BUTTON / PROFILE --- */}
          <div
            className={cn(
              "flex shrink-0 items-center gap-4",
              desktopButtonClass,
            )}
          >
            {session ? (
              <NavbarProfile
                session={session}
                isLightVersion={isLightVersion}
                isScrolled={isScrolled}
              />
            ) : (
              <Button
                href="/logowanie"
                textColor="text-primary"
                className={cn(
                  "pointer-cursor",
                  isLightVersion &&
                    "bg-contrast hover:bg-contrast/90 border-transparent",
                  isScrolled && "scale-90",
                )}
              >
                Zaloguj
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* --- TOGGLE BUTTON (Mobile) --- */}
      <div
        className={cn(
          "z-[150] w-full pt-4 pointer-events-none transition-all duration-500",
          isScrolled ? "fixed top-0" : "absolute top-0",
          mobileToggleClass,
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-20 w-full max-w-[1200px] items-center justify-end px-2 transition-all duration-500",
            isScrolled ? "h-14" : "h-20",
          )}
        >
          <motion.button
            layout
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "pointer-events-auto flex items-center justify-center transition-colors outline-none focus:outline-none ring-0 pointer-cursor",
              isMobileMenuOpen
                ? "bg-black text-white rounded-full p-0 shadow-2xl border border-white/10"
                : cn(
                    "p-0 bg-transparent",
                    isLightVersion ? "text-white" : "text-black",
                  ),
            )}
          >
            <svg
              width={isScrolled ? "32" : "40"}
              height={isScrolled ? "32" : "40"}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <motion.line
                x1="4"
                y1="8"
                x2="20"
                y2="8"
                animate={{
                  rotate: isMobileMenuOpen ? 45 : 0,
                  y: isMobileMenuOpen ? 4 : 0,
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
                mobileToggleClass,
              )}
            />
            <motion.div
              initial="hidden"
              animate="show"
              exit="exit"
              variants={containerVariants}
              className={cn(
                "fixed inset-0 z-[120] flex flex-col justify-center pointer-events-none",
                mobileToggleClass,
              )}
            >
              {navLinks.map((link) => (
                <motion.div
                  key={link.name}
                  variants={itemVariants}
                  className="flex w-full justify-end pointer-events-auto pr-6"
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-block rounded-full bg-black px-8 py-4 text-lg font-medium text-white shadow-2xl transition-transform pointer-cursor border border-white/10 mb-4"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* Sekcja: Komponent Profilu */
const NavbarProfile = ({ session, isLightVersion, isScrolled }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const user = session.user;
  const getInitials = (name?: string | null) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AW";

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        "group relative flex items-center gap-3 cursor-pointer p-1 pr-3 rounded-full bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 pointer-cursor z-50",
        isLightVersion && "!bg-contrast !text-primary border-0",
        isScrolled && "scale-90",
      )}
    >
      <div
        className={cn(
          "h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md relative",
          isExpanded && "scale-90 ring-2 ring-[#0c493e]/20",
        )}
      >
        {user.image ? (
          <Image src={user.image} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-[#0c493e] flex items-center justify-center text-white font-bold text-sm">
            {getInitials(user.name)}
          </div>
        )}
      </div>
      <div className="relative w-[130px] h-[38px] overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-center transition-all duration-500",
            isExpanded
              ? "opacity-0 -translate-y-full"
              : "opacity-100 translate-y-0",
          )}
        >
          <span className="text-sm font-bold text-gray-800 truncate px-1">
            {user.name || "Użytkownik"}
          </span>
          <span className="text-[10px] text-gray-500 truncate px-1">
            {user.email}
          </span>
        </div>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-between gap-1 transition-all duration-500",
            isExpanded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-full",
          )}
        >
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[#0c493e] hover:bg-[#0c493e]/10 pointer-cursor"
            onClick={(e) => e.stopPropagation()}
          >
            <LayoutDashboard className="h-4 w-4" />{" "}
            <span className="text-xs font-bold uppercase">Panel</span>
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              signOut({ callbackUrl: "/" });
            }}
            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 pointer-cursor"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ChevronDown
        className={cn(
          "h-4 w-4 text-gray-400 transition-all duration-300",
          isExpanded && "rotate-180",
        )}
      />
    </div>
  );
};
