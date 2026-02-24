"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, BookOpen, Bell } from "lucide-react";
import { Session } from "next-auth";
import { cn } from "@/lib/utils/cn";

interface MobileMenuProps {
  session: Session | null;
}

export const MobileMenu = ({ session }: MobileMenuProps) => {
  const pathname = usePathname();

  // Helper function to check if the path is active
  // Using exact match for simplicity, or startsWith for sub-routes if needed
  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 min-[1024px]:hidden pointer-events-none">
      {/* Pasek Nawigacji */}
      <nav className="pointer-events-auto relative flex h-[70px] w-full items-start justify-between bg-white px-0 pt-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-[30px] pb-safe">
        {/* 1. START */}
        <Link
          href="/panel-kursanta"
          className="group flex flex-1 flex-col items-center justify-center gap-1 mt-1 pointer-cursor"
        >
          <Home
            size={24}
            strokeWidth={isActive("/panel-kursanta") ? 2.5 : 2}
            className={cn(
              "transition-colors duration-300",
              isActive("/panel-kursanta")
                ? "text-[#103830]"
                : "text-gray-400 group-hover:text-[#103830]",
            )}
          />
          <span
            className={cn(
              "text-[10px] font-semibold transition-colors",
              isActive("/panel-kursanta") ? "text-[#103830]" : "text-gray-400",
            )}
          >
            Start
          </span>
        </Link>

        {/* 2. KURSY (Zewnętrzny / Wewnętrzny) */}
        <Link
          href="/panel-kursanta/kursy"
          className="group flex flex-1 flex-col items-center justify-center gap-1 mt-1 pointer-cursor"
        >
          <GraduationCap
            size={24}
            strokeWidth={isActive("/panel-kursanta/kursy") ? 2.5 : 2}
            className={cn(
              "transition-colors duration-300",
              isActive("/panel-kursanta/kursy")
                ? "text-[#103830]"
                : "text-gray-400 group-hover:text-[#103830]",
            )}
          />
          <span
            className={cn(
              "text-[10px] font-semibold transition-colors",
              isActive("/panel-kursanta/kursy")
                ? "text-[#103830]"
                : "text-gray-400",
            )}
          >
            Kursy
          </span>
        </Link>

        {/* 3. ŚRODEK: CZYTNIK (Wystający Notch) */}
        {/* This container pushes the button up */}
        <div className="relative flex flex-1 flex-col items-center justify-start -top-7 pointer-events-none">
          <Link
            href="/panel-kursanta/czytnik"
            className={cn(
              "pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full transition-transform pointer-cursor active:scale-95 shadow-lg",
              // Logic for active state vs default state
              isActive("/panel-kursanta/czytnik")
                ? "bg-[#103830] text-white ring-4 ring-white" // Active: Green bg, White icon
                : "bg-black text-white ring-4 ring-white", // Default: Black bg, White icon
            )}
          >
            <BookOpen size={24} fill="currentColor" />
          </Link>
        </div>

        {/* 4. INFO */}
        <Link
          href="/panel-kursanta/aktualnosci"
          className="group flex flex-1 flex-col items-center justify-center gap-1 mt-1 pointer-cursor"
        >
          <Bell
            size={24}
            strokeWidth={isActive("/panel-kursanta/aktualnosci") ? 2.5 : 2}
            className={cn(
              "transition-colors duration-300",
              isActive("/panel-kursanta/aktualnosci")
                ? "text-[#103830]"
                : "text-gray-400 group-hover:text-[#103830]",
            )}
          />
          <span
            className={cn(
              "text-[10px] font-semibold transition-colors",
              isActive("/panel-kursanta/aktualnosci")
                ? "text-[#103830]"
                : "text-gray-400",
            )}
          >
            Aktualności
          </span>
        </Link>

        {/* 5. KONTO */}
        <Link
          href="/panel-kursanta/profil"
          className="group flex flex-1 flex-col items-center justify-center gap-1 mt-1 pointer-cursor"
        >
          <div
            className={cn(
              "relative h-6 w-6 overflow-hidden rounded-full border transition-all",
              isActive("/panel-kursanta/profil")
                ? "border-[#103830] ring-1 ring-[#103830]"
                : "border-gray-200 group-hover:border-[#103830]",
            )}
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Profil"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] font-bold text-gray-500">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <span
            className={cn(
              "text-[10px] font-semibold transition-colors",
              isActive("/panel-kursanta/profil")
                ? "text-[#103830]"
                : "text-gray-400",
            )}
          >
            Konto
          </span>
        </Link>
      </nav>
    </div>
  );
};
