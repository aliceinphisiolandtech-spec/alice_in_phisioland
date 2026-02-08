"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  Mail,
  ChevronDown,
  Menu,
  ChevronLeft,
  Home,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // Do wyświetlania zdjęcia profilowego

// Definicja Propsów
interface AdminTopbarProps {
  adminName?: string | null;
  adminEmail?: string | null;
  adminImage?: string | null;
}

export default function AdminTopbar({
  adminName,
  adminEmail,
  adminImage,
}: AdminTopbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper do inicjałów (np. "Michał Kocik" -> "MK")
  const getInitials = (name?: string | null) => {
    if (!name) return "AD"; // Fallback
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 flex h-[80px] w-full items-center justify-between bg-white/80 backdrop-blur-md px-8 py-4 border-b border-gray-100/50 max-[980px]:bg-white max-[980px]:px-4 transition-all">
      {/* --- LEWA STRONA (Bez zmian) --- */}
      <div className="flex items-center gap-4 flex-1">
        <button className="hidden max-[980px]:flex items-center justify-center p-2 rounded-lg bg-gray-100 text-gray-600">
          <Menu className="h-6 w-6" />
        </button>

        <div className="relative w-full max-w-[400px] max-[980px]:hidden opacity-40 grayscale pointer-events-none select-none">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj zamówienia, klienta..."
            disabled
            className="h-[50px] w-full rounded-2xl border-none bg-gray-50 pl-12 pr-4 text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white px-2 py-1 text-xs font-bold text-gray-400 shadow-sm border border-gray-100">
            ⌘ F
          </div>
        </div>
      </div>

      {/* --- PRAWA STRONA --- */}
      <div className="flex items-center gap-6 max-[980px]:gap-3">
        {/* Ikony (Bez zmian) */}
        <div className="flex items-center gap-2 opacity-40 grayscale pointer-events-none select-none">
          <button className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm">
            <Mail className="h-5 w-5 text-gray-500" />
          </button>
          <button className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm">
            <Bell className="h-5 w-5 text-gray-500" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
          </button>
        </div>

        <div className="h-8 w-[1px] bg-gray-200 max-[980px]:hidden"></div>

        {/* --- PROFIL UŻYTKOWNIKA (DYNAMICZNY) --- */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="group relative flex items-center gap-3 cursor-pointer p-1 pr-3 rounded-full hover:bg-gray-50 transition-all duration-300 select-none border border-transparent hover:border-gray-100"
        >
          {/* Avatar - Logika: Image lub Inicjały */}
          <div
            className={`h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md transition-transform duration-300 relative ${
              isExpanded ? "scale-90 ring-2 ring-[#0c493e]/20" : ""
            }`}
          >
            {adminImage ? (
              <Image
                src={adminImage}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[#0c493e] flex items-center justify-center text-white font-bold text-sm">
                {getInitials(adminName)}
              </div>
            )}
          </div>

          {/* Dane Tekstowe */}
          <div className="relative w-[130px] h-[38px] overflow-hidden max-[980px]:hidden">
            {/* Dane dynamiczne */}
            <div
              className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isExpanded
                  ? "opacity-0 -translate-y-full pointer-events-none"
                  : "opacity-100 translate-y-0"
              }`}
            >
              <span className="text-sm font-bold text-gray-800 leading-tight truncate">
                {adminName || "Administrator"}
              </span>
              <span className="text-[10px] text-gray-500 truncate">
                {adminEmail || "brak@email.com"}
              </span>
            </div>

            {/* Przycisk powrotu (Bez zmian) */}
            <div
              className={`absolute inset-0 flex items-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isExpanded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-full pointer-events-none"
              }`}
            >
              <Link
                href="/"
                className="flex items-center gap-2 text-[#0c493e] hover:text-[#09362e] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Home className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Strona główna
                </span>
              </Link>
            </div>
          </div>

          {/* Strzałki (Bez zmian) */}
          <div className="relative h-5 w-5 flex items-center justify-center max-[980px]:hidden">
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
      </div>
    </header>
  );
}
