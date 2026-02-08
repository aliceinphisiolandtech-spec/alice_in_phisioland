"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function ComingSoonToaster() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const comingSoon = searchParams.get("coming-soon");

    if (comingSoon && !hasShownToast.current) {
      hasShownToast.current = true;

      // FIX: Dodajemy setTimeout, aby przesunąć to na koniec kolejki zdarzeń
      // To daje czas bibliotece Sonner na zainicjowanie się w DOM
      setTimeout(() => {
        toast.info("Panel kursanta w budowie 🚧", {
          description: "Zostaniesz poinformowany o dostępności materiałów!",
          duration: 8000,
          position: "top-center", // Lepiej widoczne na mobile
        });

        // Czyszczenie URL
        const newUrl = window.location.pathname;
        router.replace(newUrl, { scroll: false });
      }, 100); // 100ms opóźnienia wystarczy
    }
  }, [searchParams, router]);

  return null;
}
