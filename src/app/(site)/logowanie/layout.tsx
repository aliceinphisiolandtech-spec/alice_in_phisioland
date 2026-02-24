import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/common/Navbar"; // Upewnij się, że ścieżka jest poprawna
import { getServerSession } from "next-auth"; // 1. Import
import { authOptions } from "@/lib/auth"; // 1. Import

export const metadata: Metadata = {
  title: "Zaloguj się | Alicja Wójcik",
  description: "Dostęp do panelu wiedzy",
};

// 2. Dodajemy 'async' do komponentu
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 3. Pobieramy sesję po stronie serwera
  const session = await getServerSession(authOptions);

  return (
    <>
      {/* 4. Przekazujemy sesję do Navbara */}
      <Navbar session={session} />

      <section className="min-h-screen flex">
        <div className="flex w-full items-center justify-center px-4 font-montserrat text-[#0c493e] antialiased selection:bg-[#c5e96b] selection:text-[#0c493e] custom-container max-[400px]:px-[4px]">
          {children}
        </div>
      </section>
    </>
  );
}
