"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Home, LogOut, CalendarDays } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { signOutAndClearOffline } from "@/lib/offline";
import NotificationsBell from "./NotificationsBell";
import { getActiveNavItem } from "./nav";

interface AdminTopbarProps {
  adminName?: string | null;
  adminEmail?: string | null;
  adminImage?: string | null;
  /** Otwiera mobilny drawer nawigacji (hamburger). */
  onMenuClick?: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const getInitials = (name?: string | null) =>
  (name ?? "Admin")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/**
 * Dzisiejsza data liczona dopiero w przeglądarce. Renderowana na serwerze
 * mogłaby różnić się od klienckiej (strefa UTC vs. Polska tuż po północy)
 * i wywołać błąd hydracji.
 */
function useTodayLabel() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(
      new Intl.DateTimeFormat("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    );
  }, []);
  return label;
}

export default function AdminTopbar({
  adminName,
  adminEmail,
  adminImage,
  onMenuClick,
}: AdminTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeItem = getActiveNavItem(usePathname());
  const ActiveIcon = activeItem?.icon;
  const today = useTodayLabel();

  // Zamknięcie menu profilu kliknięciem obok i klawiszem Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 flex h-[76px] w-full items-center justify-between gap-4 border-b border-gray-200/60 bg-white/70 px-8 backdrop-blur-xl backdrop-saturate-150 max-[980px]:px-4">
      {/* --- LEWA: hamburger + tytuł bieżącej zakładki --- */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Otwórz menu"
          className="hidden cursor-pointer items-center justify-center rounded-xl bg-[#0c493e] p-2.5 text-white shadow-sm transition-transform active:scale-95 max-[980px]:flex"
        >
          <Menu className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {activeItem && ActiveIcon && (
            <motion.div
              key={activeItem.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="flex min-w-0 items-center gap-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#c5e96b]/40 to-[#c5e96b]/10 text-[#0c493e] ring-1 ring-[#c5e96b]/50 max-[480px]:hidden">
                <ActiveIcon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold leading-tight text-gray-900">
                  {activeItem.label}
                </p>
                <p className="truncate text-xs font-medium text-gray-400 max-[640px]:hidden">
                  {activeItem.hint}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- PRAWA --- */}
      <div className="flex items-center gap-3">
        {today && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold capitalize text-gray-500 max-[1180px]:hidden"
          >
            <CalendarDays className="h-3.5 w-3.5 text-[#0c493e]" />
            {today}
          </motion.span>
        )}

        <NotificationsBell />

        <div className="h-8 w-px bg-gray-200 max-[980px]:hidden" />

        {/* --- PROFIL --- */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-full border p-1 pr-3 transition-all duration-200 max-[980px]:pr-1",
              menuOpen
                ? "border-[#0c493e]/20 bg-white shadow-sm"
                : "border-transparent hover:border-gray-200 hover:bg-white",
            )}
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0c493e] text-xs font-bold text-white ring-2 ring-white shadow-md">
              {adminImage ? (
                <Image
                  src={adminImage}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                getInitials(adminName)
              )}
            </span>
            <span className="max-w-[140px] truncate text-left text-sm font-bold text-gray-800 max-[980px]:hidden">
              {adminName || "Administrator"}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-300 max-[980px]:hidden",
                menuOpen && "rotate-180 text-[#0c493e]",
              )}
            />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: -6,
                  scale: 0.97,
                  transition: { duration: 0.12 },
                }}
                transition={{ duration: 0.2, ease: EASE }}
                style={{ transformOrigin: "top right" }}
                className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]"
              >
                <div className="px-3 pb-3 pt-2">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {adminName || "Administrator"}
                  </p>
                  <p className="truncate text-xs text-gray-400">{adminEmail}</p>
                </div>
                <div className="h-px bg-gray-100" />
                <Link
                  href="/"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#0c493e]"
                >
                  <Home className="h-4 w-4" />
                  Strona główna
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    signOutAndClearOffline({ callbackUrl: "/logowanie" })
                  }
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Wyloguj
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
