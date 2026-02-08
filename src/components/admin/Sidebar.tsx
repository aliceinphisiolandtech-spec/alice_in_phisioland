"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Settings,
  HelpCircle,
  LogOut,
  FileText,
  PieChart,
  LayoutTemplate,
  FilePenLine,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Zakładam, że masz cn utility, jeśli nie - usuń i użyj template string
import Image from "next/image";
import { signOut } from "next-auth/react";
interface AdminSidebarProps {
  adminName?: string | null;
}
const menuItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "CMS", href: "/admin/cms", icon: FilePenLine },
];

const generalItems = [
  { label: "Ustawienia", href: "/admin/settings", icon: Settings },
  { label: "Pomoc", href: "/admin/help", icon: HelpCircle },
];

export default function AdminSidebar({ adminName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white flex flex-col justify-between border-r border-gray-100 max-[980px]:hidden z-50">
      {/* --- LOGO --- */}
      <div className="px-8 py-8">
        <div className="flex items-center gap-3">
          {/* Proste Logo AW */}
          <div className="flex h-10 w-10 items-center relative  justify-center rounded-xl bg-[#0c493e] text-white font-bold text-lg">
            <Image
              src={"/AW-logo-negatyw.svg"}
              fill
              className="p-2"
              alt="decorative"
            />
          </div>
          <span className="text-xl font-bold text-[#0c493e] font-montserrat">
            Panel Admin
          </span>
        </div>
      </div>

      {/* --- NAWIGACJA --- */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Sekcja MENU */}
        <div className="mb-8">
          <p className="mb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Menu
          </p>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300
                      ${
                        isActive
                          ? "text-[#0c493e] bg-[#c5e96b]/20"
                          : "text-gray-500 hover:bg-gray-50 hover:text-[#0c493e]"
                      }`}
                  >
                    {/* Zielony pasek aktywnego elementu (jak na zdjęciu) */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#0c493e]" />
                    )}
                    <item.icon
                      className={`h-5 w-5 ${isActive ? "text-[#0c493e]" : "text-gray-400 group-hover:text-[#0c493e]"}`}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sekcja GENERAL */}
        <div>
          <p className="mb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
            General
          </p>
          <ul className="space-y-2">
            {generalItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300
                      ${
                        isActive
                          ? "text-[#0c493e] bg-[#c5e96b]/20"
                          : "text-gray-500 hover:bg-gray-50 hover:text-[#0c493e]"
                      }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${isActive ? "text-[#0c493e]" : "text-gray-400 group-hover:text-[#0c493e]"}`}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* --- WIDGET NA DOLE (Jak "Download App" na zdjęciu, ale np. wylogowanie) --- */}
      <div className="p-6">
        <div className="rounded-2xl bg-[#0c493e] p-4 text-white relative overflow-hidden">
          {/* Dekoracja tła */}
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#c5e96b] opacity-20 blur-xl"></div>

          <h4 className="font-bold relative z-10">{adminName}</h4>
          <p className="text-xs text-white/70 mb-4 relative z-10">
            Admin Account
          </p>

          <button
            // 2. Wywołanie funkcji wylogowania z przekierowaniem na stronę główną
            onClick={() => signOut({ callbackUrl: "/logowanie" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-sm font-medium hover:bg-white/20 transition-colors pointer-cursor"
          >
            <LogOut className="h-4 w-4" />
            Wyloguj
          </button>
        </div>
      </div>
    </aside>
  );
}
