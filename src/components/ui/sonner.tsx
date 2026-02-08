"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Wymuszamy font Montserrat z Twoich zmiennych CSS
      style={{
        fontFamily: "var(--font-montserrat), sans-serif",
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl font-sans",
          description: "group-[.toast]:text-gray-500 group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-[#0c493e] group-[.toast]:text-white font-medium",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500",

          // --- STYLIZACJA STANÓW ---

          // SUKCES: Białe tło, delikatna zielona ramka (Primary), zielony tekst
          success:
            "group-[.toaster]:!bg-white group-[.toaster]:!border-[#0c493e]/20 group-[.toaster]:!text-[#0c493e]",

          // BŁĄD: Czerwone tło (bardzo jasne), czerwona ramka
          error:
            "group-[.toaster]:!bg-red-50 group-[.toaster]:!border-red-200 group-[.toaster]:!text-red-800",

          // INFO: Wykorzystujemy Twój kolor Accent (#c5e96b)
          info: "group-[.toaster]:!bg-[#fafff0] group-[.toaster]:!border-[#c5e96b] group-[.toaster]:!text-[#0c493e]",

          warning:
            "group-[.toaster]:!bg-yellow-50 group-[.toaster]:!border-yellow-200 group-[.toaster]:!text-yellow-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
