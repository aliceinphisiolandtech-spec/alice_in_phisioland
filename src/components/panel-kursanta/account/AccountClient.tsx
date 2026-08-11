"use client";

import { useEffect, useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import OneSignal from "react-onesignal";
import { toast } from "sonner";

import {
  LogOut,
  BellRing,
  Download,
  User,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteMyAccountAction } from "@/app/actions/account";

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, startDelete] = useTransition();

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

  const handleDeleteAccount = () => {
    startDelete(async () => {
      const result = await deleteMyAccountAction();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Wylogowanie MUSI pójść po stronie przeglądarki. Sesja jest oparta na
      // JWT (patrz auth.ts), więc ciasteczko z tokenem działa dalej, mimo że
      // w bazie nie ma już ani wpisu Session, ani dostępu — dopiero signOut
      // je kasuje. Bez tego kroku osoba zostałaby na ekranie panelu, który
      // przy pierwszym odświeżeniu i tak by ją odrzucił.
      await signOut({ callbackUrl: "/" });
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 pt-8">
      <div className="mx-auto max-w-2xl px-4 md:px-8">
        {/* NAGŁÓWEK */}

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
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#D4F0C8] text-[#103830] text-3xl font-bold shadow-inner relative overflow-hidden">
              {user.image ? (
                <Image src={user.image} alt="Avatar" fill />
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
                className={`rounded-xl cursor-pointer px-4 py-2 text-sm font-bold transition-all ${
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
                  className="shrink-0  cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm"
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600 transition-all hover:bg-red-100 hover:shadow-inner font-bold  cursor-pointer"
            >
              <LogOut size={20} />
              Wyloguj się
            </button>

            {/* 5. USUNIĘCIE KONTA
                Osobna sekcja pod wylogowaniem, a nie kolejny przycisk w rzędzie:
                to jedyna operacja na tym ekranie, której nie da się cofnąć,
                więc nie może wyglądać jak sąsiad „Wyloguj się" ani leżeć na
                wysokości kciuka przy zwykłym wychodzeniu z aplikacji. */}
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-bold text-gray-800">Usuń konto</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                Trwale usuwa Twoje konto i wszystkie dane. Dostęp do e-booka
                przepada bezpowrotnie — tej operacji nie da się cofnąć.
              </p>

              <button
                onClick={() => setConfirmDelete(true)}
                disabled={isDeleting}
                className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} />
                Usuń konto
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-gray-400">
              Wersja aplikacji: 1.2.0 • Build: Production
            </p>
            <p className="mt-4 text-center text-xs text-gray-400">
              Masz problem? <br />
              Napisz na{" "}
              <a
                href="mailto:biuro@kocikdev.com"
                className="text-primary text-md transition-all duration-300 hover:[text-shadow:0_0_0.5px_currentColor]"
              >
                biuro@kocikdev.com
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(false)}
        tone="danger"
        title="Usunąć konto na stałe?"
        description={
          <span className="block space-y-3">
            <span className="block">
              Usuniemy <strong>wszystkie Twoje dane</strong>: konto wraz
              z logowaniem Google, dostęp do e-booka, postęp czytania
              i wystawione opinie. Tej operacji nie da się cofnąć.
            </span>

            <span className="block rounded-lg bg-red-50 p-3 text-red-700">
              <strong>Dostęp do e-booka przepada bezpowrotnie.</strong> Założenie
              konta na ten sam adres go nie przywróci — żeby wrócić do
              materiałów, trzeba kupić je ponownie.
            </span>

            <span className="block text-[13px] text-gray-500">
              Zachowujemy wyłącznie dane z Twoich zamówień i wystawionych
              faktur. Wymagają tego przepisy prawa podatkowego i rachunkowego,
              więc nie możemy ich usunąć nawet na Twoje żądanie — prawo do
              usunięcia danych nie obejmuje informacji, które musimy
              przechowywać na podstawie przepisów. Szczegóły w §6 polityki
              prywatności.
            </span>
          </span>
        }
        confirmLabel="Usuń konto na stałe"
        cancelLabel="Zostaję"
        onConfirm={handleDeleteAccount}
        isPending={isDeleting}
      />
    </div>
  );
}
