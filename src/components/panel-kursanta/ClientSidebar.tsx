"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  GraduationCap,
  BookOpen,
  Bell,
  User,
  LogOut,
  LucideIcon, // Import LucideIcon type
} from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";

interface ClientSidebarProps {
  session: Session | null;
}

// 1. Define the interface for a menu item
interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean; // Make external optional
}

// 2. Apply the interface to the array
const menuItems: MenuItem[] = [
  { label: "Pulpit", href: "/panel-kursanta", icon: Home },
  {
    label: "Moje Kursy",
    href: "/panel-kursanta/kursy",
    icon: GraduationCap,
    // No external property here, which is fine because it's optional
  },
  { label: "Czytnik E-booka", href: "/panel-kursanta/czytnik", icon: BookOpen },
  { label: "Aktualności", href: "/panel-kursanta/aktualnosci", icon: Bell },
  { label: "Mój Profil", href: "/panel-kursanta/profil", icon: User },
];

export default function ClientSidebar({ session }: ClientSidebarProps) {
  const pathname = usePathname();
  const user = session?.user;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white flex flex-col justify-between border-r border-gray-100 max-[1024px]:hidden z-50">
      {/* --- LOGO --- */}
      <div className="px-8 py-8">
        <div className="flex items-center gap-3">
          {/* Logo AW */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center relative rounded-xl bg-[#103830]">
            {/* Używamy Twojego logo SVG */}
            <Image
              src="/AW-logo-negatyw.svg"
              alt="Logo"
              fill
              className="object-contain p-2"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#103830] leading-tight">
              Alicja Wójcik
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Panel Kursanta
            </span>
          </div>
        </div>
      </div>

      {/* --- NAWIGACJA --- */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-8">
          <p className="mb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Menu
          </p>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;

              // Obsługa linków zewnętrznych i wewnętrznych
              const LinkComponent = item.external ? "a" : Link;
              // Fix: Explicitly type or cast props to avoid TS errors with 'target' on Link
              const linkProps = item.external
                ? {
                    href: item.href,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }
                : { href: item.href };

              return (
                <li key={item.href}>
                  <LinkComponent
                    {...linkProps}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 pointer-cursor
                      ${
                        isActive
                          ? "text-[#103830] bg-[#D4F0C8]/30"
                          : "text-gray-500 hover:bg-gray-50 hover:text-[#103830]"
                      }`}
                  >
                    {/* Zielony pasek aktywnego elementu */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#103830]" />
                    )}

                    <item.icon
                      className={`h-5 w-5 transition-colors ${
                        isActive
                          ? "text-[#103830]"
                          : "text-gray-400 group-hover:text-[#103830]"
                      }`}
                    />
                    {item.label}

                    {/* Ikonka strzałki dla linków zewnętrznych */}
                    {item.external && (
                      <span className="ml-auto text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">
                        EXT
                      </span>
                    )}
                  </LinkComponent>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* --- WIDGET UŻYTKOWNIKA (Dół) --- */}
      <div className="p-6">
        <div className="rounded-2xl bg-[#103830] p-4 text-white relative overflow-hidden shadow-lg shadow-[#103830]/20">
          {/* Dekoracja tła */}
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#D4F0C8] opacity-20 blur-xl"></div>

          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="h-10 w-10 rounded-full border-2 border-white/20 overflow-hidden relative bg-white/10">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-bold">
                  {user?.name?.charAt(0) || "K"}
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm truncate">
                {user?.name || "Kursant"}
              </h4>
              <p className="text-[10px] text-white/70 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-xs font-bold hover:bg-white/20 transition-colors pointer-cursor border border-white/5"
          >
            <LogOut className="h-4 w-4" />
            Wyloguj się
          </button>
        </div>
      </div>
    </aside>
  );
}
