"use client";

import { useState, useEffect } from "react"; // Dodane hooki
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
// Dodajemy ikonę Loader2 do kręcącego się kółka
import { Home, GraduationCap, BookOpen, Bell, Loader2 } from "lucide-react";
import { Session } from "next-auth";
import { cn } from "@/lib/utils/cn";

interface MobileMenuProps {
  session: Session | null;
}

export const MobileMenu = ({ session }: MobileMenuProps) => {
  const pathname = usePathname();
  // Stan przechowujący ścieżkę, która aktualnie się ładuje
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  // Kiedy Next.js zakończy nawigację i zmieni się pathname,
  // automatycznie ukrywamy spinner
  useEffect(() => {
    const setState = () => {
      setLoadingPath(null);
    };
    setState();
  }, [pathname]);

  const isActive = (path: string, exact = true) => {
    if (exact) {
      return pathname === path;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Pomocnicza funkcja do obsługi kliknięcia
  const handleNavigation = (path: string) => {
    // Jeśli klikamy w to, gdzie już jesteśmy, nie pokazuj ładowania
    if (!isActive(path)) {
      setLoadingPath(path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 min-[1024px]:hidden pointer-events-none">
      <nav className="pointer-events-auto relative flex h-[70px] w-full items-start justify-between bg-white px-0 pt-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-[30px] pb-safe">
        {/* 1. START */}
        <Link
          href="/panel-kursanta"
          onClick={() => handleNavigation("/panel-kursanta")}
          className="group flex flex-1 flex-col items-center justify-center gap-1 mt-1 cursor-pointer"
        >
          {loadingPath === "/panel-kursanta" ? (
            <Loader2 size={24} className="animate-spin text-primary" />
          ) : (
            <Home
              size={24}
              strokeWidth={isActive("/panel-kursanta") ? 2.5 : 2}
              className={cn(
                "transition-colors duration-300",
                isActive("/panel-kursanta")
                  ? "text-primary"
                  : "text-gray-400 group-hover:text-primary",
              )}
            />
          )}
          <span
            className={cn(
              "text-[10px] font-semibold transition-colors",
              isActive("/panel-kursanta") ? "text-primary" : "text-gray-400",
            )}
          >
            Start
          </span>
        </Link>

        {/* 2. KURSY */}
        <Link
          href="/panel-kursanta/kursy"
          onClick={() => handleNavigation("/panel-kursanta/kursy")}
          className="group flex flex-1 flex-col items-center justify-center gap-1 mt-1 cursor-pointer"
        >
          {loadingPath === "/panel-kursanta/kursy" ? (
            <Loader2 size={24} className="animate-spin text-primary" />
          ) : (
            <GraduationCap
              size={24}
              strokeWidth={isActive("/panel-kursanta/kursy") ? 2.5 : 2}
              className={cn(
                "transition-colors duration-300",
                isActive("/panel-kursanta/kursy")
                  ? "text-primary"
                  : "text-gray-400 group-hover:text-primary",
              )}
            />
          )}
          <span
            className={cn(
              "text-[10px] font-semibold transition-colors",
              isActive("/panel-kursanta/kursy")
                ? "text-primary"
                : "text-gray-400",
            )}
          >
            Kursy
          </span>
        </Link>

        {/* 3. ŚRODEK: CZYTNIK */}
        <div className="relative flex flex-1 flex-col items-center justify-start -top-7 pointer-events-none">
          <Link
            href="/panel-kursanta/czytnik"
            onClick={() => handleNavigation("/panel-kursanta/czytnik")}
            className={cn(
              "pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full transition-transform cursor-pointer active:scale-95 shadow-lg",
              isActive("/panel-kursanta/czytnik", false)
                ? "bg-contrast text-primary ring-4 ring-white"
                : "bg-primary text-white ring-4 ring-white",
            )}
          >
            {loadingPath === "/panel-kursanta/czytnik" ? (
              <Loader2 size={24} className="animate-spin text-white" />
            ) : (
              <BookOpen size={24} fill="currentColor" />
            )}
          </Link>
        </div>

        {/* 4. INFO */}
        <Link
          href="/panel-kursanta/aktualnosci"
          onClick={() => handleNavigation("/panel-kursanta/aktualnosci")}
          className="group flex flex-1 flex-col items-center justify-center gap-1 mt-1 cursor-pointer"
        >
          {loadingPath === "/panel-kursanta/aktualnosci" ? (
            <Loader2 size={24} className="animate-spin text-primary" />
          ) : (
            <Bell
              size={24}
              strokeWidth={isActive("/panel-kursanta/aktualnosci") ? 2.5 : 2}
              className={cn(
                "transition-colors duration-300",
                isActive("/panel-kursanta/aktualnosci")
                  ? "text-primary"
                  : "text-gray-400 group-hover:text-primary",
              )}
            />
          )}
          <span
            className={cn(
              "text-[10px] font-semibold transition-colors",
              isActive("/panel-kursanta/aktualnosci")
                ? "text-primary"
                : "text-gray-400",
            )}
          >
            Aktualności
          </span>
        </Link>

        {/* 5. KONTO */}
        <Link
          href="/panel-kursanta/profil"
          onClick={() => handleNavigation("/panel-kursanta/profil")}
          className="group flex flex-1 flex-col items-center justify-center gap-1 mt-1 cursor-pointer"
        >
          <div
            className={cn(
              "relative h-6 w-6 overflow-hidden rounded-full border transition-all flex items-center justify-center",
              isActive("/panel-kursanta/profil")
                ? "border-primary ring-1 ring-primary"
                : "border-gray-200 group-hover:border-primary",
            )}
          >
            {loadingPath === "/panel-kursanta/profil" ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : session?.user?.image ? (
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
                ? "text-primary"
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
