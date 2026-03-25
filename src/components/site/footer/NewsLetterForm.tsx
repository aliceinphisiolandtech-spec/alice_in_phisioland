"use client";

import React, { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Ręczna walidacja: Czy pole nie jest puste
    if (!email.trim()) {
      toast.error("Proszę wpisać adres e-mail.");
      return;
    }

    // 2. Ręczna walidacja: Czy to poprawny format e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Wprowadź poprawny adres e-mail (np. jan@kowalski.pl).");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Coś poszło nie tak");
      }

      toast.success(data.message);
      setEmail(""); // Wyczyszczenie pola po sukcesie
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate // <--- TO WYŁĄCZA ANGIELSKIE Dymki PRZEGLĄDARKI
      className="flex w-full max-w-[400px] items-center gap-2 max-[500px]:flex-col"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        placeholder="Twój adres email"
        className="min-h-[48px] w-full flex-1 rounded-[8px] border-none bg-white px-4 text-[14px] text-black outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#c5e1a5] disabled:opacity-70"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="group flex h-[48px] items-center justify-center gap-2 rounded-[8px] bg-[#c5e1a5] px-6 text-[14px] font-bold text-[#0e3f2d] transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-70 max-[500px]:w-full"
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            Zapisz się
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </>
        )}
      </button>
    </form>
  );
};
