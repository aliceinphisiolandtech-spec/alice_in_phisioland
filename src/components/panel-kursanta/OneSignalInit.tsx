"use client";

import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";

export const OneSignalInit = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const runOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          // TUTAJ JEST ZMIANA:
          notifyButton: {
            enable: true,
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
