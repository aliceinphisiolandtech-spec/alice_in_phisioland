"use client";

import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";

export const OneSignalInit = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return; // Zapobiega podwójnemu ładowaniu w trybie deweloperskim

    const runOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!, // Upewnij się, że masz to w .env
          // Jeśli nie masz .env, wklej tu swoje ID w cudzysłowie: "twoje-id-z-panelu"

          allowLocalhostAsSecureOrigin: true, // Ważne dla localhost
          notifyButton: {
            enable: true, // Włącz dzwoneczek testowo
          },
        });

        setInitialized(true);
        console.log("✅ OneSignal został zainicjowany!");
      } catch (error) {
        console.error("❌ Błąd inicjalizacji OneSignal:", error);
      }
    };

    runOneSignal();
  }, [initialized]);

  return null; // Ten komponent nie renderuje nic wizualnego (poza dzwoneczkiem z configu)
};
