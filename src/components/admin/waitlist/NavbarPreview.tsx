"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
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
 * Odwzorowujemy więc sam wygląd stanu spoczynkowego, a listę linków bierzemy
 * z prawdziwego navbara, żeby nie mogła się rozjechać. Wysokość i odstępy
 * odpowiadają `Navbar` przy `isScrolled=false`.
 *
 * Na stronie kampanii navbar jest przezroczysty (`transparent`), więc atrapa
 * też nie maluje tła — prześwituje przez nią tło kanwy, dokładnie jak na
 * stronie prześwituje tło kampanii.
 */
export function NavbarPreview({ onDark = true }: { onDark?: boolean }) {
  return (
    <div
      // Dekoracja podglądu: żadnych linków do klikania i nic do złapania
      // tabulatorem — kanwa ma pokazywać, nie nawigować.
      aria-hidden
      className="relative w-full bg-transparent py-4"
    >
      <div className="custom-container mx-auto flex h-20 w-full items-center justify-between max-[1200px]:px-3">
        <Image
          src={onDark ? "/AW-logo-negatyw.svg" : "/AW-logo.svg"}
          alt=""
          width={120}
          height={40}
          className="h-10 w-auto"
        />

        <div
          className={cn(
            "flex items-center gap-8 text-[14px] font-medium max-[890px]:hidden",
            onDark ? "text-white/80" : "text-[#0c493e]",
          )}
        >
          {navLinks.map((link) => (
            <span key={link.href}>{link.name}</span>
          ))}
        </div>

        <span
          className={cn(
            "rounded-[8px] px-5 py-2.5 text-[14px] font-bold max-[890px]:hidden",
            onDark ? "bg-contrast text-[#0c493e]" : "bg-[#0c493e] text-white",
          )}
        >
          Zaloguj
        </span>

        {/* Hamburger — na wąskich ekranach zastępuje linki, tak jak w oryginale. */}
        <span className="flex flex-col gap-1.5 min-[890px]:hidden">
          <span
            className={cn(
              "h-0.5 w-6 rounded",
              onDark ? "bg-white" : "bg-[#0c493e]",
            )}
          />
          <span
            className={cn(
              "h-0.5 w-6 rounded",
              onDark ? "bg-white" : "bg-[#0c493e]",
            )}
          />
        </span>
      </div>
    </div>
  );
}
