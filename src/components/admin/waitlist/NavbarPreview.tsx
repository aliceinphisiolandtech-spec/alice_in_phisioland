"use client";

import React from "react";
import Image from "next/image";
import { navLinks } from "@/components/common/Navbar";

/**
 * Atrapa nawigacji serwisu na kanwie kreatora.
 *
 * Jedyne miejsce w kreatorze, które NIE jest prawdziwym komponentem strony —
 * i jest ku temu konkretny powód. Prawdziwy `Navbar` po przewinięciu przechodzi
 * w `position: fixed`, a jego menu mobilne blokuje przewijanie całego dokumentu.
 * W ramce podglądu oznaczałoby to pasek wyjeżdżający na panel administracyjny
 * i zablokowany scroll po jednym kliknięciu.
 *
 * Odwzorowujemy więc sam wygląd stanu spoczynkowego (biały pasek z logo
 * i linkami), a listę linków bierzemy z prawdziwego navbara, żeby nie mogła
 * się rozjechać. Wysokość i odstępy odpowiadają `Navbar` przy `isScrolled=false`.
 */
export function NavbarPreview() {
  return (
    <div
      // Dekoracja podglądu: żadnych linków do klikania i nic do złapania
      // tabulatorem — kanwa ma pokazywać, nie nawigować.
      aria-hidden
      className="relative w-full border-b border-gray-100 bg-white py-4"
    >
      <div className="custom-container mx-auto flex h-20 w-full items-center justify-between max-[1200px]:px-3">
        <Image
          src="/AW-logo.svg"
          alt=""
          width={120}
          height={40}
          className="h-10 w-auto"
        />

        <div className="flex items-center gap-8 max-[890px]:hidden">
          {navLinks.map((link) => (
            <span
              key={link.href}
              className="text-[14px] font-medium text-[#0c493e]"
            >
              {link.name}
            </span>
          ))}
        </div>

        <span className="rounded-[8px] bg-[#0c493e] px-5 py-2.5 text-[14px] font-bold text-white max-[890px]:hidden">
          Kup e-book
        </span>

        {/* Hamburger — na wąskich ekranach zastępuje linki, tak jak w oryginale. */}
        <span className="flex flex-col gap-1.5 min-[890px]:hidden">
          <span className="h-0.5 w-6 rounded bg-[#0c493e]" />
          <span className="h-0.5 w-6 rounded bg-[#0c493e]" />
        </span>
      </div>
    </div>
  );
}
