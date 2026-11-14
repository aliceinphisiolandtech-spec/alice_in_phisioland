"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { LogOut, Lock, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Image from "next/image";
import { signOutAndClearOffline } from "@/lib/offline";
import { cn } from "@/lib/utils/cn";
import { adminNavItems, adminNavSections, getActiveNavItem } from "./nav";

interface AdminSidebarProps {
  adminName?: string | null;
  adminImage?: string | null;
  /** Czy mobilny drawer jest otwarty (ignorowane na desktopie). */
  mobileOpen?: boolean;
  /** Zamknięcie mobilnego drawera. */
  onClose?: () => void;
  /**
   * Zwinięcie do kolumny samych ikon. Dotyczy WYŁĄCZNIE desktopu — poniżej
   * 981 px nawigacja jest wysuwanym drawerem na całą szerokość i zwężanie jej
   * do ikon nie miałoby sensu.
   *
   * Dlatego wszystkie klasy zależne od tego stanu są zakwalifikowane
   * `min-[981px]:`, a klasy mobilne `max-[980px]:`. Zakresy się nie pokrywają,
   * więc nie ma konfliktu specyficzności i nie trzeba zgadywać szerokości
   * okna w JavaScripcie.
   */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Pozycje menu wjeżdżają kolejno przy pierwszym wejściu do panelu. */
const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

const getInitials = (name?: string | null) =>
  (name ?? "Admin")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export default function AdminSidebar({
  adminName,
  adminImage,
  mobileOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const activeItem = getActiveNavItem(pathname);

  /** Chowa element tylko na desktopie po zwinięciu — na mobile zostaje. */
  const hideWhenCollapsed = collapsed ? "min-[981px]:hidden" : "";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col justify-between overflow-hidden text-white",
        "bg-gradient-to-b from-[#0c493e] via-[#0a3f35] to-[#062a23]",
        // Mobile: drawer wjeżdżający z lewej (transform, GPU); desktop: stały.
        "transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] max-[980px]:shadow-2xl",
        "max-[980px]:w-[280px]",
        collapsed ? "min-[981px]:w-[84px]" : "min-[981px]:w-[280px]",
        mobileOpen
          ? "max-[980px]:translate-x-0"
          : "max-[980px]:-translate-x-full",
      )}
    >
      {/* Dekoracja tła — statyczna, żeby nie kosztowała klatek. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#c5e96b] opacity-[0.12] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-[#2bb39a] opacity-[0.12] blur-3xl"
      />

      {/* --- LOGO --- */}
      <div
        className={cn(
          "relative pt-7 pb-5",
          collapsed ? "min-[981px]:px-4 px-6" : "px-6",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            collapsed && "min-[981px]:justify-center",
          )}
        >
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 20 }}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"
            >
              <Image src={"/AW-logo-negatyw.svg"} fill className="p-2" alt="" />
            </motion.div>
            <div className={cn("min-w-0", hideWhenCollapsed)}>
              <p className="whitespace-nowrap text-[15px] font-extrabold leading-tight tracking-tight">
                Alicja Wójcik
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c5e96b]">
                Panel admina
              </p>
            </div>
          </Link>

          {/* Przycisk zamknięcia (tylko mobile) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij menu"
            className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white max-[980px]:flex"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* --- NAWIGACJA --- */}
      <nav
        className={cn(
          "relative flex-1 overflow-y-auto overflow-x-hidden pb-4 scrollbar-hide",
          collapsed ? "min-[981px]:px-3 px-4" : "px-4",
        )}
      >
        <motion.div variants={listVariants} initial="hidden" animate="visible">
          {adminNavSections.map((section) => {
            const items = adminNavItems.filter((i) => i.section === section);
            if (items.length === 0) return null;

            return (
              <div key={section} className="mb-5">
                <motion.p
                  variants={itemVariants}
                  className={cn(
                    "mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35",
                    hideWhenCollapsed,
                  )}
                >
                  {section}
                </motion.p>
                {/* Po zwinięciu nagłówki sekcji zastępuje cienka kreska. */}
                {collapsed && (
                  <div className="mx-auto mb-2 hidden h-px w-8 bg-white/10 min-[981px]:block" />
                )}

                <ul className="space-y-1">
                  {items.map((item) => {
                    const isActive = activeItem === item;

                    return (
                      <motion.li key={item.label} variants={itemVariants}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={isActive ? "page" : undefined}
                          aria-disabled={item.locked || undefined}
                          tabIndex={item.locked ? -1 : undefined}
                          // Po zwinięciu etykiety znikają: `title` daje dymek
                          // myszy, a `sr-only` zostawia nazwę czytnikom ekranu.
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold outline-none transition-colors duration-200",
                            "focus-visible:ring-2 focus-visible:ring-[#c5e96b]/60",
                            collapsed
                              ? "min-[981px]:justify-center min-[981px]:px-0 px-3"
                              : "px-3",
                            item.locked && "pointer-events-none opacity-40",
                            isActive
                              ? "text-[#0c493e]"
                              : "text-white/70 hover:text-white",
                          )}
                        >
                          {/* Tło najechania — osobna warstwa, żeby nie
                              walczyło z animowanym tłem aktywnej zakładki. */}
                          {!isActive && (
                            <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors duration-200 group-hover:bg-white/[0.07]" />
                          )}

                          {/*
                            Aktywna zakładka: limonkowa „pigułka” z `layoutId`
                            przesuwa się sprężyście do nowej pozycji przy każdej
                            zmianie strony. Animuje się sam transform (GPU).
                          */}
                          {isActive && (
                            <motion.span
                              layoutId="admin-nav-active"
                              transition={{
                                type: "spring",
                                stiffness: 520,
                                damping: 40,
                                mass: 0.8,
                              }}
                              className="absolute inset-0 rounded-xl bg-[#c5e96b] shadow-[0_8px_24px_-8px_rgba(197,233,107,0.7)]"
                            />
                          )}

                          <item.icon
                            className={cn(
                              "relative h-[18px] w-[18px] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-115",
                              isActive
                                ? "text-[#0c493e]"
                                : "text-white/60 group-hover:text-[#c5e96b]",
                            )}
                          />

                          <span
                            className={cn(
                              "relative whitespace-nowrap transition-transform duration-200 group-hover:translate-x-0.5",
                              collapsed && "min-[981px]:sr-only",
                            )}
                          >
                            {item.label}
                          </span>

                          {item.locked && (
                            <Lock
                              className={cn(
                                "relative ml-auto h-3.5 w-3.5",
                                hideWhenCollapsed,
                              )}
                            />
                          )}
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </motion.div>
      </nav>

      {/* --- DÓŁ: zwijanie + konto --- */}
      <div
        className={cn(
          "relative space-y-3 border-t border-white/10 p-4",
          collapsed && "min-[981px]:px-3",
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Rozwiń menu" : "Zwiń menu do ikon"}
          aria-label={collapsed ? "Rozwiń menu" : "Zwiń menu do ikon"}
          aria-expanded={!collapsed}
          className={cn(
            "flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-xs font-semibold text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white max-[980px]:hidden",
            collapsed && "min-[981px]:justify-center min-[981px]:px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px]" />
          )}
          <span className={hideWhenCollapsed}>Zwiń menu</span>
        </button>

        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5 ring-1 ring-white/10",
            collapsed &&
              "min-[981px]:justify-center min-[981px]:bg-transparent min-[981px]:p-0 min-[981px]:ring-0",
          )}
        >
          <div
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#c5e96b] text-xs font-extrabold text-[#0c493e]",
              collapsed && "min-[981px]:hidden",
            )}
          >
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
          </div>
          <div className={cn("min-w-0 flex-1", hideWhenCollapsed)}>
            <p className="truncate text-sm font-bold">
              {adminName ?? "Administrator"}
            </p>
            <p className="text-[10px] font-medium text-white/45">
              Administrator
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              signOutAndClearOffline({ callbackUrl: "/logowanie" })
            }
            title={`Wyloguj${adminName ? ` (${adminName})` : ""}`}
            aria-label="Wyloguj"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white/60 transition-all duration-200 hover:bg-red-500/20 hover:text-red-200 active:scale-95"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
