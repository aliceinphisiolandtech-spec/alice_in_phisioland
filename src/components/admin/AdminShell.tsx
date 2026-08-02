"use client";

import React, { useEffect, useState } from "react";
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
      />

      {/* Przyciemnione tło (tylko mobile, gdy drawer otwarty) */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm min-[981px]:hidden"
        />
      )}

      <div className="pl-[280px] w-full flex flex-col min-h-screen transition-all duration-300 max-[980px]:pl-0">
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
