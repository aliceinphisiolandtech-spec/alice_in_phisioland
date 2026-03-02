"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Wykrywamy czy to iOS
    const isIosDevice = /iphone|ipad|ipod/.test(
      window.navigator.userAgent.toLowerCase(),
    );

    // Ustawiamy flagę iOS
    const setToIosDevice = () => {
      setIsIOS(isIosDevice);
    };
    setToIosDevice();
    // 2. Obsługa Androida / Desktop Chrome
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 3. Sprawdzamy tryb Standalone (czy już zainstalowana)
    // Rzutujemy na 'any', żeby TypeScript nie krzyczał o brak 'standalone'
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;

    // Jeśli to iOS, ale NIE jest w trybie aplikacji (czyli jest w Safari), pokaż instrukcję
    const setToVisible = () => {
      if (isIosDevice && !isStandalone) {
        setIsVisible(true);
      }
    };
    setToVisible();
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Wywołujemy natywne okienko instalacji
    deferredPrompt.prompt();

    // Czekamy na decyzję użytkownika
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
      >
        <div className="bg-[#103830] text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 relative border border-[#D4F0C8]/20">
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-white/60 hover:text-white p-1"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-[#D4F0C8] p-2 rounded-xl text-[#103830]">
              <Download size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm">Zainstaluj aplikację</h4>
              <p className="text-xs text-gray-300">
                Szybszy dostęp do kursów z pulpitu.
              </p>
            </div>
          </div>

          {isIOS ? (
            <div className="text-xs bg-white/10 p-3 rounded-lg border border-white/5">
              <p>Aby zainstalować na iPhone:</p>
              <p className="mt-1 flex items-center gap-1">
                1. Kliknij{" "}
                <span className="text-blue-300 font-bold">Udostępnij</span> (na
                dole)
              </p>
              <p>
                2. Wybierz <strong>&quot;Do ekranu początk.&quot;</strong>
              </p>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full bg-[#D4F0C8] hover:bg-white text-[#103830] font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              Zainstaluj teraz
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
