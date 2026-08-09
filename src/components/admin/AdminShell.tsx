"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import AdminSidebar from "./Sidebar";
import AdminTopbar from "./Topbar";

interface AdminShellProps {
  adminName?: string | null;
  adminEmail?: string | null;
  adminImage?: string | null;
  children: React.ReactNode;
}

/**
 * Klient-owy "shell" panelu admina. Trzyma w jednym miejscu stan otwarcia
 * mobilnej nawigacji (drawer) i dzieli go między Sidebar (drawer) a Topbar
 * (hamburger). Dzięki temu layout może pozostać server componentem.
 */
export default function AdminShell({
  adminName,
  adminEmail,
  adminImage,
  children,
}: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  /**
   * Zwinięcie nawigacji do kolumny ikon (tylko desktop).
   *
   * Stan siedzi tutaj, a nie w `Sidebar`, bo szerokość nawigacji wpływa na
   * odstęp treści obok niej — obie rzeczy muszą zmieniać się razem.
   *
   * Świadomie bez zapamiętywania w `localStorage`: odczyt z niego przy
   * pierwszym renderowaniu rozjechałby się z tym, co wyrenderował serwer
   * (hydration mismatch). Panel jest aplikacją jednostronicową, więc wybór
   * i tak utrzymuje się przy przechodzeniu między podstronami.
   */
  const [navCollapsed, setNavCollapsed] = useState(false);

  // Gdy drawer otwarty: blokada scrolla tła + zamykanie klawiszem Escape.
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <AdminSidebar
        adminName={adminName}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={navCollapsed}
        onToggleCollapse={() => setNavCollapsed((open) => !open)}
      />

      {/* Przyciemnione tło (tylko mobile, gdy drawer otwarty) */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm min-[981px]:hidden"
        />
      )}

      {/*
        Odstęp podajemy WYŁĄCZNIE klasami z zakresami medialnymi, bez wartości
        bazowej. Zakresy `max-[980px]` i `min-[981px]` się nie pokrywają, więc
        nie ma konfliktu specyficzności — przy wartości bazowej obok wariantu
        o tej samej wadze o wyniku decydowałaby kolejność w wygenerowanym CSS.
      */}
      <div
        className={cn(
          "w-full flex flex-col min-h-screen transition-[padding] duration-300 max-[980px]:pl-0",
          navCollapsed ? "min-[981px]:pl-[76px]" : "min-[981px]:pl-[280px]",
        )}
      >
        <AdminTopbar
          adminName={adminName}
          adminEmail={adminEmail}
          adminImage={adminImage}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-8 max-[980px]:p-4 overflow-x-hidden">
          {children}
        </main>
      </div>
    </>
  );
}
