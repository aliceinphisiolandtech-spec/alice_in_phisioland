"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  Mail,
  ChevronDown,
  ChevronLeft,
  Home,
  Menu,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Session } from "next-auth";

interface ClientTopbarProps {
  session: Session | null;
}

export default function ClientTopbar({ session }: ClientTopbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const user = session?.user;

  // Helper for initials
  const getInitials = (name?: string | null) => {
    if (!name) return "PK"; // PK = Panel Kursanta
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 hidden h-[80px] w-full items-center justify-between bg-white/80 backdrop-blur-md px-8 py-4 border-b border-gray-100/50 max-[980px]:px-4 transition-all min-[1024px]:flex">
      {/* --- LEFT SIDE: Search (Hidden on Mobile) --- */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Trigger (Optional if you want a sidebar later) */}
        {/* <button className="hidden max-[980px]:flex items-center justify-center p-2 rounded-lg bg-gray-100 text-gray-600">
          <Menu className="h-6 w-6" />
        </button> */}

        {/* Mobile Logo (Visible only on Mobile) */}
        <div className="hidden max-[980px]:flex items-center gap-2">
          <div className="relative h-8 w-8">
            <Image
              src="/AW-logo.svg"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-bold text-[#103830]">Panel Kursanta</span>
        </div>
      </div>

      {/* --- RIGHT SIDE: Notifications & Profile --- */}
      <div className="flex items-center gap-6 max-[980px]:gap-3">
        <div className="h-8 w-[1px] bg-gray-200 max-[980px]:hidden"></div>

        {/* --- USER PROFILE (Dynamic) --- */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="group relative flex items-center gap-3 cursor-pointer p-1 pr-3 rounded-full hover:bg-gray-50 transition-all duration-300 select-none border border-transparent hover:border-gray-100"
        >
          {/* Avatar */}
          <div
            className={`h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md transition-transform duration-300 relative ${
              isExpanded ? "scale-90 ring-2 ring-[#0c493e]/20" : ""
            }`}
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[#0c493e] flex items-center justify-center text-white font-bold text-sm">
                {getInitials(user?.name)}
              </div>
            )}
          </div>

          {/* Text Data (Hidden on Mobile) */}
          <div className="relative w-[130px] h-[38px] overflow-hidden max-[980px]:hidden">
            {/* User Info */}
            <div
              className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isExpanded
                  ? "opacity-0 -translate-y-full pointer-events-none"
                  : "opacity-100 translate-y-0"
              }`}
            >
              <span className="text-sm font-bold text-gray-800 leading-tight truncate">
                {user?.name || "Kursant"}
              </span>
              <span className="text-[10px] text-gray-500 truncate">
                {user?.email || "kursant@email.com"}
              </span>
            </div>

            {/* Back Button (Reveal on Click) */}
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

          {/* Arrows (Desktop Only) */}
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
