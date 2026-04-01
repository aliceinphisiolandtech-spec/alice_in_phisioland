"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  AlertTriangle,
  ExternalLink,
  X,
  Smartphone,
  MoreVertical,
  Copy,
} from "lucide-react";

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

export const PWAWarning = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [browserName, setBrowserName] = useState("tej aplikacji");
  const [isAndroid, setIsAndroid] = useState(false);

  // Blokowanie scrolla na stronie pod spodem
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Czyszczenie po odmontowaniu komponentu
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isVisible]);

  useEffect(() => {
    const setStateMounted = () => {
      setMounted(true);
    };
    setStateMounted();
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;

    // Wykrywanie Androida
    if (/android/i.test(userAgent)) {
      const setAndroidTrue = () => {
        setIsAndroid(true);
      };
      setAndroidTrue();
    }

    const browsers = [
      { keys: ["Instagram"], name: "Instagrama" },
      { keys: ["FBAN", "FBAV"], name: "Facebooka" },
      { keys: ["TikTok", "Bytedance"], name: "TikToka" },
      { keys: ["MessengerForiOS"], name: "Messengera" },
      { keys: ["LinkedInApp"], name: "LinkedIn" },
    ];

    let detectedBrowser = null;

    for (const browser of browsers) {
      if (browser.keys.some((rule) => userAgent.includes(rule))) {
        detectedBrowser = browser.name;
        break;
      }
    }

    if (detectedBrowser) {
      const setBrowserNameAndVisibleState = () => {
        setBrowserName(detectedBrowser);
        setIsVisible(true);
      };
      setBrowserNameAndVisibleState();
    }
  }, []);

  // Funkcja wymuszająca otwarcie w Chrome na Androidzie
  const handleOpenInChrome = () => {
    const domainAndPath =
      window.location.host + window.location.pathname + window.location.search;
    const intentUrl = `intent://${domainAndPath}#Intent;scheme=https;package=com.android.chrome;end;`;
    window.location.href = intentUrl;
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // Zmiana klas: overlay jest na sztywno, ale samo jego tło jest scrollowalne
          className="fixed inset-0 z-[10000] overflow-y-auto bg-foreground/10 backdrop-blur-sm"
        >
          {/* Dodatkowy kontener, który dba o min-height i wyśrodkowanie zawartości */}
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <motion.section
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              // Dodałem my-8 (margin-y), żeby na bardzo małych ekranach karta nie przyklejała się do samej góry/dołu krawędzi przy scrollowaniu
              className="relative w-full max-w-2xl my-8 overflow-hidden rounded-3xl bg-background p-6 shadow-2xl shadow-primary/10 border border-primary/10"
            >
              <div className="relative z-10 flex flex-col gap-6">
                {/* GÓRNA BELKA */}
                <div className="flex justify-center items-center relative">
                  <span className="flex items-center gap-2 bg-accent/30 text-primary text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                    <AlertTriangle size={14} />
                    Ważna informacja
                  </span>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="text-foreground/40 hover:text-primary transition-colors p-1 rounded-full hover:bg-contrast/30 absolute right-0"
                    aria-label="Zamknij"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* GŁÓWNA TREŚĆ */}
                <div className="flex flex-col md:flex-row gap-8">
                  {/* LEWA STRONA (Teksty) */}
                  <div className="flex-1 flex flex-col gap-4">
                    <h2 className="text-xl md:text-2xl font-bold leading-tight text-primary text-center md:text-left">
                      Wymagane otwarcie w nowszej przeglądarce
                    </h2>
                    <p className="text-sm text-foreground/80 leading-relaxed text-center md:text-left">
                      Wygląda na to, że przeglądasz aplikację przez wbudowaną
                      przeglądarkę{" "}
                      <strong className="text-primary font-bold">
                        {browserName}
                      </strong>
                      .
                      <br />
                      <br />
                      Nasza aplikacja korzysta z najnowszych technologii w celu
                      zapewnienia szybkości i niezawodności. Niestety, ta
                      przeglądarka{" "}
                      <strong className="text-primary font-semibold">
                        nie obsługuje tej technologii i blokuje możliwość
                        instalacji naszej aplikacji na telefonie
                      </strong>
                      , co może powodować błędy.
                    </p>

                    <div className="flex items-start gap-3 mt-2 bg-contrast/20 border border-primary/10 p-4 rounded-xl text-left">
                      <MoreVertical
                        size={20}
                        className="text-primary shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-primary/90 leading-relaxed">
                        Kliknij w{" "}
                        <strong className="font-bold text-primary">
                          trzy kropki
                        </strong>{" "}
                        w rogu ekranu i wybierz opcję{" "}
                        <strong className="font-bold text-primary">
                          &quot;Otwórz w przeglądarce systemowej&quot;
                        </strong>{" "}
                        (Chrome / Safari), aby zainstalować aplikację.
                      </p>
                    </div>
                  </div>

                  {/* PRAWA STRONA (Przyciski) */}
                  <div className="w-full md:w-64 shrink-0 flex flex-col justify-end gap-3 mt-4 md:mt-0">
                    {/* Przycisk widoczny TYLKO na Androidzie */}
                    {isAndroid && (
                      <button
                        onClick={handleOpenInChrome}
                        className="flex items-center text-sm justify-center gap-2 bg-primary hover:bg-primary/90 text-background font-bold py-3.5 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20 w-full"
                      >
                        <ExternalLink size={16} />
                        Otwórz w Chrome
                      </button>
                    )}

                    {/* Przycisk kopiowania linku - główny dla iOS, pomocniczy dla Androida */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        // toast.success('Skopiowano link!');
                      }}
                      className={`flex items-center text-sm justify-center gap-2 font-bold py-3.5 px-6 rounded-xl transition-all active:scale-95 w-full ${
                        isAndroid
                          ? "bg-transparent border border-primary/20 text-primary hover:bg-primary/5"
                          : "bg-primary hover:bg-primary/90 text-background shadow-lg shadow-primary/20"
                      }`}
                    >
                      <Copy size={16} />
                      Skopiuj link
                    </button>

                    <button
                      onClick={() => setIsVisible(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-transparent px-6 py-3.5 text-sm font-semibold text-primary/60 transition-colors active:scale-95 hover:bg-foreground/5 hover:text-primary mt-2"
                    >
                      <Smartphone size={16} />
                      Zostań tutaj
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
