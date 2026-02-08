"use client";

import "ldrs/react/Pulsar.css";
import React from "react";
import { cn } from "@/lib/utils/cn";
import { Pulsar } from "ldrs/react";
import { motion, AnimatePresence } from "framer-motion";

// Ten import jest bezpieczny, ldrs sprawdza dostępność window wewnętrznie
if (typeof window !== "undefined") {
  import("ldrs/pulsar");
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

export const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  LoadingButtonProps
>(
  (
    { className, children, isLoading, variant = "primary", disabled, ...props },
    ref,
  ) => {
    const variants = {
      primary:
        "bg-[#0c493e] hover:bg-[#0a3b32] text-white shadow-md shadow-[#0c493e]/10 border border-transparent",
      secondary:
        "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
      outline:
        "bg-transparent border border-[#0c493e] text-[#0c493e] hover:bg-[#0c493e]/5",
      ghost:
        "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    };

    const spinnerColor = variant === "primary" ? "white" : "#0c493e";
    const buttonSize = 44; // Stała wysokość i szerokość (w stanie loading)

    return (
      <motion.button
        ref={ref}
        disabled={isLoading || disabled}
        initial={false}
        animate={{
          // Kiedy loading: szerokość = 44px (idealny kwadrat). Kiedy nie: auto.
          width: isLoading ? buttonSize : "auto",
          // Usuwamy padding, żeby nie rozciągał kwadratu
          paddingLeft: isLoading ? 0 : 24,
          paddingRight: isLoading ? 0 : 24,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={cn(
          // BAZA:
          "relative inline-flex cursor-pointer items-center justify-center font-medium overflow-hidden rounded-lg",

          // WYMIARY:
          "h-11", // Stała wysokość (44px)
          "min-w-[44px]", // Blokuje zwężanie poniżej kwadratu

          // ZACHOWANIE TEKSTU:
          "whitespace-nowrap", // Tekst nie zawija się podczas zwężania

          variants[variant],
          disabled && "opacity-80 cursor-not-allowed",
          className,
        )}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
      >
        {/* 1. TREŚĆ (Tekst) */}
        <motion.span
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          {children}
        </motion.span>

        {/* 2. LOADER (Absolute) */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Pulsar
                size="20" // Pasuje idealnie do 44px
                speed="1.2"
                color={spinnerColor}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  },
);

LoadingButton.displayName = "LoadingButton";
