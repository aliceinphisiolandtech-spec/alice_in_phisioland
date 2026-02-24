"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Play,
  Download,
  ExternalLink,
  FileText,
  ChevronRight,
  Clock,
  Receipt, // Ikona faktury
  Code,
  MapPin, // Ikona dla XML
} from "lucide-react";

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Dzień dobry");

  useEffect(() => {
    const currentHour = new Date().getHours();
    const setGreatingText = () => {
      setGreeting("Dobry wieczór");
    };
    if (currentHour >= 18 || currentHour < 5) {
      setGreatingText();
    }
  }, []);

  return (
    <div className=" pb-24 flex flex-col gap-12 pt-4">
      {/* 1. POWITANIE I NAGŁÓWEK */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#103830]">{greeting}!</h1>
          <p className="text-sm text-gray-500 font-medium">
            Witaj na panelu kursanta!
          </p>
        </div>

        <div className="relative h-12 w-12 shrink-0">
          <Image
            src="/AW-logo.svg"
            alt="Logo Alicja Wójcik"
            fill
            className="object-contain"
          />
        </div>
      </header>

      {/* 2. GŁÓWNA KARTA: KONTYNUUJ CZYTANIE (HERO) */}
      <section className="relative overflow-hidden rounded-[30px] bg-[#103830] p-6 text-white shadow-xl shadow-[#103830]/20 group">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#D4F0C8]/10 blur-3xl transition-all group-hover:bg-[#D4F0C8]/20" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4F0C8] backdrop-blur-md">
                Postępy
              </span>
              <h2 className="text-xl font-semibold leading-tight">
                Fizjoterapeutyczna diagnostyka zróżnicowana w ujęciu klinicznym
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-sm">
              <FileText size={24} className="text-[#D4F0C8]" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-gray-300">
              <span>Postęp czytania</span>
              <span>42%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[42%] rounded-full bg-[#D4F0C8]" />
            </div>
          </div>

          <Link
            href="/panel-kursanta/czytnik"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4F0C8] py-3.5 text-sm font-bold text-[#103830] transition-transform active:scale-95 pointer-cursor hover:bg-white"
          >
            <Play size={18} fill="currentColor" />
            Wznów czytanie
          </Link>
        </div>
      </section>

      {/* 3. DOKUMENTY ZAKUPOWE (FAKTURY) */}
      <section className="">
        <h3 className="text-lg font-bold text-gray-800 px-1">Dokumenty</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* FAKTURA PDF */}
          {/* FAKTURA PDF */}
          <button className="group flex flex-col relative items-center justify-center gap-3 rounded-[24px] border border-gray-100 bg-white p-5 text-center shadow-sm transition-all hover:shadow-md active:scale-95 pointer-cursor w-full">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
              <Receipt size={20} />
            </div>
            <div className="w-full">
              <p className="text-xs font-bold uppercase text-gray-400">
                Faktura
              </p>
              <p className="flex items-center justify-center gap-1.5 font-bold text-gray-800">
                PDF{" "}
                <span className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 absolute top-4 right-4">
                  <Download size={14} className="text-primary " />
                </span>
              </p>
            </div>
          </button>

          {/* FAKTURA XML */}
          <button className="group flex flex-col relative items-center justify-center gap-3 rounded-[24px] border border-gray-100 bg-white p-5 text-center shadow-sm transition-all hover:shadow-md active:scale-95 pointer-cursor w-full">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
              <Code size={20} />
            </div>
            <div className="w-full">
              <p className="text-xs font-bold uppercase text-gray-400">
                Faktura
              </p>
              <p className="flex items-center justify-center gap-1.5 font-bold text-gray-800">
                XML{" "}
                <div className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 absolute top-4 right-4">
                  <Download size={14} className="text-primary " />
                </div>
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 4. BANER KURSÓW */}
      {/* 4. BANER KURSÓW STACJONARNYCH */}
      <section className="relative overflow-hidden rounded-[24px] bg-[#F2F4F7] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 leading-tight">
              Chcesz zdobyć praktykę? <br />
            </h3>
            <span className="text-[#103830] text-[14px]  font-semibold block !leading-[18px]">
              Zapisz się na szkolenie stacjonarne.
            </span>
            <a
              href="https://zewnetrzna-strona.pl"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#103830] underline decoration-2 underline-offset-4 pointer-cursor"
            >
              Sprawdź terminy i miejsce <ExternalLink size={12} />
            </a>
          </div>

          {/* Ikona lokalizacji/miejsca */}
          <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-full bg-white shadow-sm text-[#103830]">
            <MapPin size={32} />
          </div>
        </div>
      </section>

      {/* 5. OSTATNIA AKTUALNOŚĆ */}
      <section className="">
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-lg font-bold text-gray-800 ">Aktualności</h3>
          <Link
            href="/panel-kursanta/aktualnosci"
            className="text-xs font-bold text-[#103830] pointer-cursor"
          >
            Zobacz wszystkie
          </Link>
        </div>

        <Link
          href="/panel-kursanta/aktualnosci"
          className="flex items-center gap-4 rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm transition-transform active:scale-[0.98] pointer-cursor"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4F0C8]/30 text-[#103830]">
            <Clock size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
              Nowość • 2 dni temu
            </p>
            <p className="truncate text-sm font-bold text-gray-800">
              Dodaliśmy nowy rozdział o diecie!
            </p>
          </div>
          <ChevronRight size={20} className="text-gray-300" />
        </Link>
      </section>
    </div>
  );
}
