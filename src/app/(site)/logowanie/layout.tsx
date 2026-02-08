import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zaloguj się | Alicja Wójcik",
  description: "Dostęp do panelu wiedzy",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen flex">
      <div className="flex  w-full items-center justify-center px-4   font-montserrat text-[#0c493e] antialiased selection:bg-[#c5e96b] selection:text-[#0c493e] custom-container max-[400px]:px-[4px]">
        {children}
      </div>
    </section>
  );
}
