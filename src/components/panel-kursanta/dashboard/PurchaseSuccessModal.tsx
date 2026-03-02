/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import OneSignal from "react-onesignal";
import { BellRing, X, CheckCircle2 } from "lucide-react";
import { LoadingButton } from "@/components/ui/LoadingButton";
import confetti from "canvas-confetti"; // Opcjonalnie: npm install canvas-confetti @types/canvas-confetti

export const PurchaseSuccessModal = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Sprawdź czy to powrót po zakupie
    const isAfterPurchase =
      searchParams.get("redirect_status") === "succeeded" ||
      searchParams.get("success") === "true";

    if (isAfterPurchase && typeof window !== "undefined") {
      // 2. Sprawdź czy user ma już powiadomienia
      setTimeout(() => {
        // W OneSignal v16 'permission' to boolean (true = ma zgodę, false = nie ma)
        const hasPermission = OneSignal.Notifications?.permission;

        // Jeśli NIE ma permissions (jest false lub undefined), pokazujemy modal
        if (!hasPermission) {
          setIsOpen(true);
          triggerConfetti();
        }
      }, 1000);
    }
  }, [searchParams]);

  // Funkcja konfetti (opcjonalna)
  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };

    const random = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // @ts-ignore
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 },
        }),
      );
      // @ts-ignore
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 },
        }),
      );
    }, 250);
  };

  const handleEnable = async () => {
    setIsLoading(true);
    console.log("🚀 Rozpoczynamy procedurę OneSignal...");

    try {
      // 1. Zabezpieczenie: Czy skrypt w ogóle jest?
      if (!OneSignal.Notifications) {
        throw new Error("OneSignal nie załadowany (AdBlock?)");
      }

      console.log("⏳ Wywołuję requestPermission...");

      // 2. TIMEOUT: Jeśli OneSignal nie odpowie w 3 sekundy, wyrzuć błąd
      // To zapobiega wiecznemu kręceniu się kółeczka
      await Promise.race([
        OneSignal.Notifications.requestPermission(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout: OneSignal nie odpowiada")),
            3000,
          ),
        ),
      ]);

      console.log("✅ Proces zakończony sukcesem!");
      handleClose();
    } catch (error) {
      console.error("❌ Błąd:", error);
      // Opcjonalnie: Pokaż alert, żebyś wiedziała co się stało
      // alert("Błąd: Sprawdź czy nie masz włączonego AdBlocka.");

      // Mimo błędu zamykamy modal, żeby nie blokować usera
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };
  const handleClose = () => {
    setIsOpen(false);
    // WAŻNE: Czyścimy URL, żeby po odświeżeniu strony modal nie wyskoczył znowu
    // Używamy replace, żeby nie psuć historii przeglądarki
    const params = new URLSearchParams(searchParams.toString());
    params.delete("redirect_status");
    params.delete("payment_intent");
    params.delete("success");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* TŁO (Backdrop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* KARTA */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Dekoracyjny nagłówek */}
            <div className="bg-[#0c493e] px-6 py-8 text-center relative overflow-hidden">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4F0C8] text-[#0c493e] shadow-lg mb-4 relative z-10">
                <CheckCircle2 size={32} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-white relative z-10">
                Dziękujemy za zakup!
              </h2>
              <p className="text-[#D4F0C8] text-sm mt-1 relative z-10">
                Twój dostęp jest już aktywny.
              </p>
            </div>

            {/* Treść */}
            <div className="p-6 text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-800">
                  Nie przegap nowych materiałów
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Włącz powiadomienia, abyśmy mogli dać Ci znać o nowościach w
                  kursie i ważnych aktualizacjach. Zero spamu.
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <LoadingButton
                  onClick={handleEnable}
                  isLoading={isLoading}
                  className="w-full bg-[#0c493e] hover:bg-[#0a3b32] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#0c493e]/20 flex items-center justify-center gap-2"
                >
                  <BellRing size={18} />
                  Włącz powiadomienia
                </LoadingButton>

                <button
                  onClick={handleClose}
                  className="text-gray-400 text-xs font-medium hover:text-gray-600 py-2 transition-colors"
                >
                  Nie teraz, może później
                </button>
              </div>
            </div>

            {/* Przycisk zamknięcia w rogu */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
