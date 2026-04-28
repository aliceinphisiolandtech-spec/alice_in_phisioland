"use client";

import { useEffect } from "react";

export function DisableRightClick() {
  useEffect(() => {
    console.log("Blokuje prawe kliknęcia na całej strony");

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Nasłuchuj kliknięcia na całym dokumencie
    document.addEventListener("contextmenu", handleContextMenu);

    // Sprzątanie po odmontowaniu komponentu
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
  return null; // Ten komponent jest "niewidzialny", działa tylko w tle
}
