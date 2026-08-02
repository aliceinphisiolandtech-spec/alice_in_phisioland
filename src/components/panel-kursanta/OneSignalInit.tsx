"use client";

import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";

/**
 * Poza produkcją OneSignal nie startuje.
 *
 * Aplikacja w panelu OneSignal jest przypięta do https://aliceinphysioland.pl,
 * więc na localhoście SDK i tak odmawia działania i zostawia w konsoli
 * „Can only be used on: …". Push nie zadziała tu w żadnym wariancie, więc
 * jedyne, co dawała ta inicjalizacja, to szum.
 *
 * Gdyby kiedyś trzeba było sprawdzić integrację lokalnie (np. przez tunel HTTPS
 * na właściwej domenie), wystarczy NEXT_PUBLIC_ONESIGNAL_DEV=true w .env.
 */
const IS_DEV = process.env.NODE_ENV !== "production";
const FORCE_IN_DEV = process.env.NEXT_PUBLIC_ONESIGNAL_DEV === "true";

export const ONESIGNAL_ENABLED = !IS_DEV || FORCE_IN_DEV;

export const OneSignalInit = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || !ONESIGNAL_ENABLED) return;

    const runOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          // TUTAJ JEST ZMIANA:
          notifyButton: {
            enable: false,
          } as any, // <--- Dodaj 'as any', żeby oszukać TypeScript
        });

        setInitialized(true);
        console.log("✅ OneSignal został zainicjowany!");
      } catch (error) {
        console.error("❌ Błąd inicjalizacji OneSignal:", error);
      }
    };

    runOneSignal();
  }, [initialized]);

  return null;
};
