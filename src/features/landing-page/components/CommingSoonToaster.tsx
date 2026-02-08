"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function ComingSoonToaster() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Ref zapobiega podwójnemu odpaleniu w React Strict Mode
  const hasShownToast = useRef(false);

  useEffect(() => {
    // Sprawdzamy czy w URL jest parametr 'coming-soon'
    if (searchParams.get("coming-soon") && !hasShownToast.current) {
      hasShownToast.current = true;

      // 1. Wyświetl powiadomienie
      toast.info("Panel kursanta w budowie 🚧", {
        description: "Zostaniesz poinformowany o dostępności materiałów!",
        duration: 8000, // Dłuższy czas wyświetlania
        position: "top-right", // Opcjonalnie: na środku góry
      });

      // 2. Wyczyść URL (żeby po odświeżeniu strony toster nie wyskoczył znowu)
      const newUrl = window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router]);

  return null; // Ten komponent jest niewidzialny
}
