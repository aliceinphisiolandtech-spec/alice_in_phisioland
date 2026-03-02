/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import OneSignal from "react-onesignal";
import { BellRing, X, CheckCircle2, Download, Smartphone } from "lucide-react";
import { LoadingButton } from "@/components/ui/LoadingButton";
import confetti from "canvas-confetti";

type ModalStep = "notifications" | "install";

export const PurchaseSuccessModal = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [step, setStep] = useState<ModalStep>("notifications");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Otwieranie modala
    const isAfterPurchase =
      searchParams.get("redirect_status") === "succeeded" ||
      searchParams.get("success") === "true";

    if (isAfterPurchase && typeof window !== "undefined") {
      setTimeout(() => {
        // ZAWSZE otwieramy do testów, nawet jak OneSignal nie odpowiada
        setIsOpen(true);
        triggerConfetti();
      }, 1000);
    }

    // 2. Wykrywanie (zostawiamy, ale nie będziemy tego używać do blokowania)
    const isIosDevice = /iphone|ipad|ipod/.test(
      window.navigator.userAgent.toLowerCase(),
    );
    setIsIOS(isIosDevice);

    const installHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", installHandler);
    return () =>
      window.removeEventListener("beforeinstallprompt", installHandler);
  }, [searchParams]);

  // --- LOGIKA KROKU 1: POWIADOMIENIA ---
  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      // Symulujemy oczekiwanie na OneSignal (żebyś widziała spinner)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // --- TESTOWE WYMUSZENIE ---
      // Ignorujemy czy OneSignal zadziałał, czy nie.
      // Ignorujemy czy przeglądarka pozwala na instalację.
      // Po prostu idziemy do kroku 2.
      console.log("🚀 TEST MODE: Wymuszam przejście do kroku instalacji");
      setStep("install");
    } catch (error) {
      console.error(error);
      // W trybie testowym nawet jak jest błąd, to chcemy zobaczyć następny ekran?
      // Jeśli tak, odkomentuj poniższe:
      // setStep("install");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIKA KROKU 2: INSTALACJA ---
  const handleInstallApp = async () => {
    if (isIOS) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        handleClose();
      }
    } else {
      alert(
        "To jest tryb testowy. Na produkcji tutaj wyskoczy okienko przeglądarki.",
      );
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("redirect_status");
    params.delete("payment_intent");
    params.delete("success");
    router.replace(`${pathname}?${params.toString()}`);
    setTimeout(() => setStep("notifications"), 500);
  };

  const triggerConfetti = () => {
    // ... (kod konfetti bez zmian) ...
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };
    const random = (min: number, max: number) =>
      Math.random() * (max - min) + min;
    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <AnimatePresence mode="wait">
              {step === "notifications" ? (
                // WIDOK 1: POWIADOMIENIA
                <motion.div
                  key="step-notify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="bg-[#0c493e] px-6 py-8 text-center relative overflow-hidden">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4F0C8] text-[#0c493e] shadow-lg mb-4 relative z-10">
                      <CheckCircle2 size={32} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-bold text-white relative z-10">
                      Zakup udany!
                    </h2>
                    <p className="text-[#D4F0C8] text-sm mt-1 relative z-10">
                      Zanim zaczniesz...
                    </p>
                  </div>
                  <div className="p-6 text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        Bądź na bieżąco
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Włącz powiadomienia, aby nie przegapić aktualizacji!
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 mt-4 items-center">
                      <LoadingButton
                        onClick={handleEnableNotifications}
                        isLoading={isLoading}
                        className="w-full bg-[#0c493e] cursor-pointer hover:bg-[#0a3b32] text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                      >
                        <BellRing size={18} />
                        Włącz powiadomienia
                      </LoadingButton>

                      {/* PRZYCISK "NIE TERAZ" - TEŻ WYMUSZA PRZEJŚCIE DALEJ */}
                      <button
                        onClick={() => {
                          console.log(
                            "🚀 TEST MODE: Pomijam powiadomienia, idę do instalacji",
                          );
                          setStep("install");
                        }}
                        className="text-gray-400 text-xs py-2 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        Nie teraz, przejdź dalej
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // WIDOK 2: INSTALACJA APLIKACJI
                <motion.div
                  key="step-install"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="bg-[#103830] px-6 py-8 text-center relative overflow-hidden">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-[#D4F0C8] shadow-lg mb-4 relative z-10 border border-[#D4F0C8]/30">
                      <Smartphone size={32} strokeWidth={2} />
                    </div>
                    <h2 className="text-xl font-bold text-white relative z-10">
                      Pobierz aplikację
                    </h2>
                    <p className="text-emerald-200 text-sm mt-1 relative z-10">
                      Ucz się wygodniej z pulpitu.
                    </p>
                  </div>
                  <div className="p-6 text-center space-y-4">
                    {/* ZAWSZE pokazujemy przycisk na dole w teście, nawet jak to nie iOS */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Zainstaluj naszą aplikację, aby mieć szybszy dostęp do
                        kursów.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-4 items-center justify-center ">
                      <button
                        onClick={handleInstallApp}
                        className="w-full cursor-pointer bg-[#D4F0C8] hover:bg-[#c2e6b1] text-[#103830] py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Download size={18} />
                        Zainstaluj teraz
                      </button>

                      <button
                        onClick={handleClose}
                        className="text-gray-400 text-xs py-2 cursor-pointer"
                      >
                        Może później
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/50 cursor-pointer hover:text-white transition-colors z-20"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
