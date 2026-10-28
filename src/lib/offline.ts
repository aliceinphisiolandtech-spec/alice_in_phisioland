"use client";

import { signOut, type SignOutParams } from "next-auth/react";

/**
 * Tryb offline panelu — część po stronie przeglądarki.
 * Sam service worker: public/sw.js. Rejestracja: OfflineSupport w panelu.
 */

/**
 * Service worker poza produkcją psuje odświeżanie kodu w `next dev`
 * (podaje stare skrypty z cache). Do prób lokalnych na buildzie
 * produkcyjnym wystarczy `npm run build && npm start`; w `next dev`
 * można go włączyć przez NEXT_PUBLIC_OFFLINE_DEV=true.
 */
export const OFFLINE_ENABLED =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_OFFLINE_DEV === "true";

const PENDING_PROGRESS_KEY = "aip-pending-progress";

/**
 * Kasuje zapisane strony panelu (zawierają mail kursantki w znaku wodnym).
 * Skrypty, style i obrazki e-booka zostają — nie ma w nich danych osobowych.
 */
export async function clearOfflineData(): Promise<void> {
  try {
    if (typeof caches === "undefined") return;
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith("aip-pages-") || k.startsWith("aip-meta-"))
        .map((k) => caches.delete(k)),
    );
    window.localStorage.removeItem(PENDING_PROGRESS_KEY);
  } catch {
    // Brak dostępu do cache (np. tryb prywatny) nie może blokować wylogowania.
  }
}

/** Wylogowanie razem z usunięciem stron zapisanych do trybu offline. */
export async function signOutAndClearOffline(options?: SignOutParams<true>) {
  await clearOfflineData();
  return signOut(options);
}

// --- POSTĘP CZYTANIA ZAPISANY OFFLINE ---

export function readPendingProgress(): string[] {
  try {
    const raw = window.localStorage.getItem(PENDING_PROGRESS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

export function writePendingProgress(slugs: string[]): void {
  try {
    if (slugs.length === 0) {
      window.localStorage.removeItem(PENDING_PROGRESS_KEY);
    } else {
      window.localStorage.setItem(
        PENDING_PROGRESS_KEY,
        JSON.stringify([...new Set(slugs)]),
      );
    }
  } catch {
    /* bez pamięci postęp po prostu zapisze się przy kolejnym otwarciu online */
  }
}

/** Rozdział przeczytany bez sieci — wyślemy go, gdy wróci połączenie. */
export function queuePendingProgress(slug: string): void {
  writePendingProgress([...readPendingProgress(), slug]);
}
