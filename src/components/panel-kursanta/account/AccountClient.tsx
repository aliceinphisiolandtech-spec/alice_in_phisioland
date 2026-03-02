"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import OneSignal from "react-onesignal";
import Link from "next/link";
import {
  LogOut,
  BellRing,
  Download,
  User,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface AccountClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AccountClient({ user }: AccountClientProps) {
  // --- STANY ---
  const [pushPermission, setPushPermission] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // --- EFEKTY (OneSignal + PWA) ---
  useEffect(() => {
    // 1. Sprawdź status OneSignal
    if (typeof window !== "undefined") {
      // Drobne opóźnienie, by OneSignal zdążył się załadować
      setTimeout(() => {
        const hasPermission = OneSignal.Notifications?.permission;
        setPushPermission(!!hasPermission);
      }, 1000);
    }

    // 2. Wykryj iOS
    const isIosDevice = /iphone|ipad|ipod/.test(
      window.navigator.userAgent.toLowerCase(),
    );
    const setToIosDevice = () => {
      setIsIOS(isIosDevice);
    };
    setToIosDevice();
    // 3. Sprawdź czy aplikacja już zainstalowana (Standalone)
    const checkStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;

    const setToStandalone = () => {
      setIsStandalone(checkStandalone);
    };
    setToStandalone();
    // 4. Przechwyć event instalacji (Android/Desktop)
    const installHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", installHandler);

    return () =>
      window.removeEventListener("beforeinstallprompt", installHandler);
  }, []);

  // --- HANDLERY ---

  const handlePushToggle = async () => {
    if (pushPermission) {
      alert(
        "Powiadomienia są już aktywne. Możesz je wyłączyć w ustawieniach przeglądarki.",
      );
      return;
    }

    try {
      const accepted = await OneSignal.Notifications.requestPermission();
      setPushPermission(accepted);
      if (accepted) alert("Powiadomienia zostały włączone!");
    } catch (error) {
      console.error(error);
      alert("Wystąpił błąd podczas aktywacji powiadomień.");
    }
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      alert(
        "Aby zainstalować na iOS:\n1. Kliknij 'Udostępnij' na dole przeglądarki\n2. Wybierz 'Do ekranu początkowego'",
      );
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        "Twoja przeglądarka nie zgłasza możliwości instalacji lub aplikacja jest już zainstalowana.",
      );
    }
  };

  const handleLogout = () => {
    if (confirm("Czy na pewno chcesz się wylogować?")) {
      signOut({ callbackUrl: "/logowanie" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 pt-8">
      <div className="mx-auto max-w-2xl px-4 md:px-8">
        {/* NAGŁÓWEK */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#103830]">Twoje Konto</h1>
          <p className="mt-2 text-gray-500">
            Zarządzaj ustawieniami aplikacji.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {/* 1. KARTA PROFILU */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-6 rounded-3xl bg-white p-6 shadow-sm border border-gray-100"
          >
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#D4F0C8] text-[#103830] text-3xl font-bold shadow-inner">
              {user.image ? (
                <img
                  src={user.image}
                  alt="Avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User size={36} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {user.name || "Użytkownik"}
              </h2>
              <p className="text-sm text-gray-500 break-all">{user.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#f0fdf4] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#103830]">
                <CheckCircle2 size={12} /> Konto Aktywne
              </div>
            </div>
          </motion.div>

          {/* 2. POWIADOMIENIA */}
          <motion.div
            variants={itemVariants}
            className="overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100"
          >
            <div className="border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BellRing size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Powiadomienia</h3>
                  <p className="text-xs text-gray-500">
                    Status subskrypcji PUSH
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50/50 p-6">
              <div className="text-sm font-medium text-gray-600">
                {pushPermission
                  ? "Powiadomienia są włączone"
                  : "Powiadomienia są wyłączone"}
              </div>
              <button
                onClick={handlePushToggle}
                disabled={pushPermission}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  pushPermission
                    ? "cursor-default bg-green-100 text-green-700"
                    : "bg-[#103830] text-white hover:bg-[#0a2923] shadow-lg shadow-[#103830]/20"
                }`}
              >
                {pushPermission ? "Aktywne" : "Włącz"}
              </button>
            </div>
          </motion.div>

          {/* 3. INSTALACJA APLIKACJI */}
          {!isStandalone && (
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100"
            >
              <div className="border-b border-gray-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">
                      Aplikacja mobilna
                    </h3>
                    <p className="text-xs text-gray-500">
                      Zainstaluj na pulpicie
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 bg-gray-50/50 p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
                  {isIOS
                    ? "Na iPhone instalacja jest możliwa tylko ręcznie przez menu Safari."
                    : "Pobierz aplikację, aby mieć szybszy dostęp do materiałów."}
                </p>
                <button
                  onClick={handleInstallClick}
                  className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                >
                  <Download size={16} />
                  {isIOS ? "Instrukcja" : "Zainstaluj"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 4. WYLOGUJ */}
          <motion.div variants={itemVariants} className="mt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600 transition-all hover:bg-red-100 hover:shadow-inner font-bold"
            >
              <LogOut size={20} />
              Wyloguj się
            </button>
            <p className="mt-4 text-center text-xs text-gray-400">
              Wersja aplikacji: 1.2.0 • Build: Production
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
