"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { markChapterAsReadAction } from "@/app/actions/progress";
import {
  OFFLINE_ENABLED,
  readPendingProgress,
  writePendingProgress,
} from "@/lib/offline";

interface OfflineSupportProps {
  userId: string;
  /** Strony panelu i rozdziały, które zapisujemy z wyprzedzeniem. */
  warmUrls: string[];
}

/**
 * Tryb offline panelu:
 * - rejestruje service worker (public/sw.js) ze scope'em samego panelu,
 * - przekazuje mu, czyje to konto i co zapisać z wyprzedzeniem,
 * - wysyła postęp czytania zebrany bez sieci, gdy połączenie wróci,
 * - pokazuje, że kursantka ogląda zapisaną wersję.
 */
export const OfflineSupport = ({ userId, warmUrls }: OfflineSupportProps) => {
  const [isOffline, setIsOffline] = useState(false);
  const warmKey = warmUrls.join("|");

  useEffect(() => {
    if (!OFFLINE_ENABLED || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/panel-kursanta" })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        if (cancelled || !navigator.onLine) return;
        registration.active?.postMessage({
          type: "sync",
          userId,
          urls: warmKey.split("|").filter(Boolean),
        });
      })
      .catch((error) => {
        console.error("Nie udało się włączyć trybu offline:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, warmKey]);

  useEffect(() => {
    const flushProgress = async () => {
      const pending = readPendingProgress();
      if (pending.length === 0) return;

      const failed: string[] = [];
      for (const slug of pending) {
        try {
          const result = await markChapterAsReadAction(slug);
          if (result.error) failed.push(slug);
        } catch {
          failed.push(slug);
        }
      }
      writePendingProgress(failed);
    };

    const update = () => {
      setIsOffline(!navigator.onLine);
      if (navigator.onLine) void flushProgress();
    };

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full bg-[#103830] px-4 py-2 text-xs font-bold text-white shadow-lg max-w-[calc(100vw-32px)]"
    >
      <WifiOff size={14} className="shrink-0" />
      <span className="truncate">Tryb offline — widzisz zapisaną wersję</span>
    </div>
  );
};
