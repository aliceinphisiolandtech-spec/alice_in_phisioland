"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  HelpCircle,
  LogOut,
  MailboxIcon,
  MailPlus, // <--- IKONA DLA STRON ZAPISÓW
  FilePenLine,
  BellRing,
  Lock, // <--- IMPORT KŁÓDKI
  TicketPercent, // <--- IMPORT IKONY DLA RABATÓW
  PlayCircle, // <--- IMPORT IKONY DLA KURSÓW WIDEO
  X, // <--- IMPORT IKONY ZAMKNIĘCIA (mobile)
  PanelLeftClose, // <--- ZWIJANIE NAWIGACJI DO IKON
  PanelLeftOpen,
} from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";

interface AdminSidebarProps {
  adminName?: string | null;
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

const menuItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, locked: false },
  { label: "Aktualności", href: "/admin/news", icon: BellRing, locked: false },
  { label: "CMS", href: "/admin/cms", icon: FilePenLine, locked: false },
  {
    label: "Rabaty",
    href: "/admin/rabaty",
    icon: TicketPercent,
    locked: false,
  },
  { label: "Zapisy na listę", href: "/admin/zapisy", icon: MailPlus, locked: false },
  { label: "Newsletter", href: "#", icon: MailboxIcon, locked: true },
  // NOWA ZAKŁADKA
  { label: "Kursy Video", href: "#", icon: PlayCircle, locked: true },
];

export default function AdminSidebar({
  adminName,
  mobileOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();

  /** Chowa element tylko na desktopie po zwinięciu — na mobile zostaje. */
  const hideWhenCollapsed = collapsed ? "min-[981px]:hidden" : "";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white flex flex-col justify-between border-r border-gray-100 z-50",
        // Mobile: drawer wjeżdżający z lewej; Desktop (>980px): zawsze widoczny.
        "transition-[transform,width] duration-300 ease-out max-[980px]:shadow-2xl",
        "max-[980px]:w-[280px]",
        collapsed ? "min-[981px]:w-[76px]" : "min-[981px]:w-[280px]",
        mobileOpen
          ? "max-[980px]:translate-x-0"
          : "max-[980px]:-translate-x-full",
      )}
    >
      {/* --- LOGO --- */}
      <div
        className={cn("py-8", collapsed ? "min-[981px]:px-4 px-8" : "px-8")}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            collapsed && "min-[981px]:justify-center",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center relative justify-center rounded-xl bg-[#0c493e] text-white font-bold text-lg shrink-0">
              <Image
                src={"/AW-logo-negatyw.svg"}
                fill
                className="p-2"
                alt="decorative"
              />
            </div>
            <span
              className={cn(
                "text-xl font-bold text-[#0c493e] font-montserrat whitespace-nowrap",
                hideWhenCollapsed,
              )}
            >
              Panel Admin
            </span>
          </div>

          {/* Przycisk zamknięcia (tylko mobile) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij menu"
            className="hidden max-[980px]:flex items-center justify-center h-9 w-9 shrink-0 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* --- ZWIJANIE (tylko desktop) --- */}
      <div
        className={cn(
          "flex max-[980px]:hidden",
          collapsed ? "min-[981px]:justify-center px-4" : "justify-end px-6",
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Rozwiń menu" : "Zwiń menu do ikon"}
          aria-label={collapsed ? "Rozwiń menu" : "Zwiń menu do ikon"}
          aria-expanded={!collapsed}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#0c493e]"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      {/* --- NAWIGACJA --- */}
      <div
        className={cn(
          "flex-1 overflow-y-auto py-4",
          collapsed ? "min-[981px]:px-3 px-6" : "px-6",
        )}
      >
        {/* Sekcja MENU */}
        <div className="mb-8">
          <p
            className={cn(
              "mb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider",
              hideWhenCollapsed,
            )}
          >
            Menu
          </p>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              // Dodatkowe zabezpieczenie: element zablokowany nie może być aktywny
              const isActive = pathname === item.href && !item.locked;

              return (
                <li key={item.label}>
                  {" "}
                  {/* Zmiana klucza na label, bo href może się powtarzać np. "#" */}
                  <Link
                    href={item.href}
                    onClick={onClose}
                    // Po zwinięciu etykiety znikają, więc nazwa musi być
                    // dostępna inaczej: `title` daje dymek myszy, a zawinięcie
                    // jej w `sr-only` zostawia ją czytnikom ekranu.
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition-all duration-300",
                      collapsed
                        ? "min-[981px]:justify-center min-[981px]:px-0 px-4"
                        : "px-4",
                      item.locked && "pointer-events-none opacity-50 grayscale",
                      isActive
                        ? "text-[#0c493e] bg-[#c5e96b]/20"
                        : "text-gray-500 hover:bg-gray-50 hover:text-[#0c493e]",
                    )}
                  >
                    {/* Zielony pasek aktywnego elementu */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#0c493e]" />
                    )}

                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive
                          ? "text-[#0c493e]"
                          : "text-gray-400 group-hover:text-[#0c493e]",
                      )}
                    />

                    <span
                      className={cn(
                        "whitespace-nowrap",
                        collapsed && "min-[981px]:sr-only",
                      )}
                    >
                      {item.label}
                    </span>

                    {/* IKONA KŁÓDKI - Wyrównana do prawej dzięki ml-auto */}
                    {item.locked && (
                      <Lock
                        className={cn(
                          "ml-auto h-4 w-4 text-gray-400",
                          hideWhenCollapsed,
                        )}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* --- WIDGET NA DOLE --- */}
      <div className={cn("p-6", collapsed && "min-[981px]:px-3")}>
        <div
          className={cn(
            "rounded-2xl bg-[#0c493e] p-4 text-white relative overflow-hidden",
            hideWhenCollapsed,
          )}
        >
          {/* Dekoracja tła */}
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#c5e96b] opacity-20 blur-xl"></div>

          <h4 className="font-bold relative z-10">{adminName}</h4>
          <p className="text-xs text-white/70 mb-4 relative z-10">
            Admin Account
          </p>

          <button
            onClick={() => signOut({ callbackUrl: "/logowanie" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-sm font-medium hover:bg-white/20 transition-colors pointer-cursor"
          >
            <LogOut className="h-4 w-4" />
            Wyloguj
          </button>
        </div>

        {/*
          Po zwinięciu z widgetu zostaje samo wylogowanie. Karta z nazwiskiem
          nie zmieści się w 76 px, ale wyjście z panelu musi być osiągalne
          bez rozwijania menu — to jedyna akcja, której szuka się w pośpiechu.
        */}
        {collapsed && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/logowanie" })}
            title={`Wyloguj${adminName ? ` (${adminName})` : ""}`}
            aria-label="Wyloguj"
            className="hidden min-[981px]:flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[#0c493e] text-white transition-colors hover:bg-[#0a3b32]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
