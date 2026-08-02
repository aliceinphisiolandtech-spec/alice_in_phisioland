"use client";

import React from "react";
import { AlertDialog } from "radix-ui";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Okno potwierdzenia zastępujące natywny `window.confirm`.
 *
 * Zbudowane na Radix AlertDialog, a nie na własnym div-ie, bo dostajemy z niego
 * pułapkę focusa, zamykanie Escape, blokadę scrolla tła i poprawne role ARIA
 * (`alertdialog` + powiązane title/description). Świadomie NIE zamyka się
 * kliknięciem w tło — przy potwierdzeniu usunięcia przypadkowy klik obok nie
 * powinien wyglądać jak decyzja.
 */

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** "danger" dla operacji nieodwracalnych (usuwanie). */
  tone?: "danger" | "default";
  onConfirm: () => void;
  /**
   * Trzecie wyjście — dla decyzji, w których „anuluj" i „potwierdź" nie
   * wyczerpują tematu (np. wyłączenie piaskownicy Z publikacją albo BEZ niej).
   * Bursztynowy akcent, bo w panelu ten kolor znaczy „zostaje w piaskownicy".
   */
  altLabel?: string;
  onAlt?: () => void;
  isPending?: boolean;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Anuluj",
  tone = "default",
  onConfirm,
  altLabel,
  onAlt,
  isPending = false,
}: ConfirmDialogProps) => {
  const isDanger = tone === "danger";

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      {/* forceMount + AnimatePresence — bez tego Radix odmontowuje treść
          natychmiast i animacja wyjścia nie ma czego animować. */}
      <AnimatePresence>
        {open && (
          <AlertDialog.Portal forceMount>
            <AlertDialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-[2px]"
              />
            </AlertDialog.Overlay>

            <AlertDialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                // Wyśrodkowanie przez framerowe x/y, a nie klasy -translate-*:
                // framer i tak nadpisuje `transform`, więc klasy by przepadły.
                style={{ x: "-50%", y: "-50%" }}
                className="fixed left-1/2 top-1/2 z-[101] w-[min(92vw,27rem)] rounded-2xl border border-gray-200 bg-white p-6 shadow-xl outline-none"
              >
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                      isDanger
                        ? "bg-red-50 text-red-500"
                        : "bg-amber-50 text-amber-600",
                    )}
                  >
                    {isDanger ? (
                      <AlertTriangle size={20} />
                    ) : (
                      <Info size={20} />
                    )}
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <AlertDialog.Title className="text-base font-bold text-gray-900">
                      {title}
                    </AlertDialog.Title>
                    <AlertDialog.Description className="mt-1.5 text-sm leading-relaxed text-gray-600">
                      {description}
                    </AlertDialog.Description>
                  </div>
                </div>

                {/* Trzy wyjścia nie mieszczą się w jednym rzędzie w oknie tej
                    szerokości, więc rząd musi umieć się złamać. Przy trzech
                    przyciskach centrujemy — dosunięte do prawej wyglądają jak
                    poszarpany schodek. Warianty dwuprzyciskowe zostają przy
                    prawej krawędzi, tak jak wszędzie indziej w panelu. */}
                <div
                  className={cn(
                    "mt-6 flex flex-wrap gap-2",
                    altLabel && onAlt ? "justify-center" : "justify-end",
                  )}
                >
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      disabled={isPending}
                      className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelLabel}
                    </button>
                  </AlertDialog.Cancel>

                  {altLabel && onAlt && (
                    <AlertDialog.Action asChild>
                      <button
                        type="button"
                        onClick={onAlt}
                        disabled={isPending}
                        className="cursor-pointer rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {altLabel}
                      </button>
                    </AlertDialog.Action>
                  )}

                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={isPending}
                      className={cn(
                        "cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                        isDanger
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-[#0c493e] hover:bg-[#0a3b32]",
                      )}
                    >
                      {confirmLabel}
                    </button>
                  </AlertDialog.Action>
                </div>
              </motion.div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        )}
      </AnimatePresence>
    </AlertDialog.Root>
  );
};
