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
  FilePenLine,
  BellRing,
  Lock, // <--- IMPORT KŁÓDKI
  PlayCircle, // <--- IMPORT IKONY DLA KURSÓW WIDEO
} from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";

interface AdminSidebarProps {
  adminName?: string | null;
}

const menuItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, locked: false },
  { label: "Aktualności", href: "/admin/news", icon: BellRing, locked: false },
  { label: "CMS", href: "/admin/cms", icon: FilePenLine, locked: false },
  { label: "Newsletter", href: "#", icon: MailboxIcon, locked: true },
  // NOWA ZAKŁADKA
  { label: "Kursy Video", href: "#", icon: PlayCircle, locked: true },
];

export default function AdminSidebar({ adminName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white flex flex-col justify-between border-r border-gray-100 max-[980px]:hidden z-50">
      {/* --- LOGO --- */}
      <div className="px-8 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center relative justify-center rounded-xl bg-[#0c493e] text-white font-bold text-lg">
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
              // Dodatkowe zabezpieczenie: element zablokowany nie może być aktywny
              const isActive = pathname === item.href && !item.locked;

              return (
                <li key={item.label}>
                  {" "}
                  {/* Zmiana klucza na label, bo href może się powtarzać np. "#" */}
                  <Link
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300
                      ${item.locked ? "pointer-events-none opacity-50 grayscale" : ""} 
                      ${
                        isActive
                          ? "text-[#0c493e] bg-[#c5e96b]/20"
                          : "text-gray-500 hover:bg-gray-50 hover:text-[#0c493e]"
                      }`}
                  >
                    {/* Zielony pasek aktywnego elementu */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#0c493e]" />
                    )}

                    <item.icon
                      className={`h-5 w-5 ${isActive ? "text-[#0c493e]" : "text-gray-400 group-hover:text-[#0c493e]"}`}
                    />

                    {item.label}

                    {/* IKONA KŁÓDKI - Wyrównana do prawej dzięki ml-auto */}
                    {item.locked && (
                      <Lock className="ml-auto h-4 w-4 text-gray-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* --- WIDGET NA DOLE --- */}
      <div className="p-6">
        <div className="rounded-2xl bg-[#0c493e] p-4 text-white relative overflow-hidden">
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
      </div>
    </aside>
  );
}
