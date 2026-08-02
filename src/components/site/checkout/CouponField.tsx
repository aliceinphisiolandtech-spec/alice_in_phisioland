"use client";

import { useState } from "react";
import { TicketPercent, X, CheckCircle2, Info } from "lucide-react";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { cn } from "@/lib/utils/cn";
import type { PriceResult } from "@/lib/pricing-engine";

export interface CouponApplyResult {
  pricing: PriceResult;
  /** Kod, który realnie wszedł do ceny (null gdy przebity przez promocję). */
  appliedCode: string | null;
  /** Kod tak, jak wpisała go klientka — potrzebny, gdy nie wszedł do ceny. */
  enteredCode: string;
  outranked: boolean;
}

interface CouponFieldProps {
  /** Kod, który realnie wszedł do ceny (null gdy brak albo przebity promocją). */
  appliedCode: string | null;
  /** Kod poprawny, ale nieopłacalny — aktywna promocja daje lepszą cenę. */
  outrankedCode: string | null;
  onApplied: (result: CouponApplyResult) => void;
  onRemoved: () => void;
  disabled?: boolean;
}

/**
 * Pole kodu rabatowego w podsumowaniu zamówienia.
 *
 * Komponent nie liczy żadnych kwot — pyta serwer i pokazuje to, co dostał.
 * Stan wyceny żyje wyżej (CheckoutSection), bo ten sam wynik potrzebny jest
 * podsumowaniu i wywołaniu tworzącemu płatność.
 */
export const CouponField = ({
  appliedCode,
  outrankedCode,
  onApplied,
  onRemoved,
  disabled = false,
}: CouponFieldProps) => {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCode = appliedCode ?? outrankedCode;

  const handleApply = async () => {
    const code = value.trim();

    if (code.length < 3) {
      setError("Wpisz kod rabatowy.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.message || "Nie udało się sprawdzić kodu.");
        return;
      }

      setValue("");
      onApplied({
        pricing: data.pricing as PriceResult,
        // Gdy kod został przebity promocją, serwer nie zwraca go jako
        // naliczonego — nazwę bierzemy z tego, co wpisała klientka.
        appliedCode: data.appliedCode ?? null,
        enteredCode: code.toUpperCase(),
        outranked: Boolean(data.outranked),
      });
    } catch {
      setError("Brak połączenia z serwerem. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setError(null);
    setValue("");
    onRemoved();
  };

  // --- KOD WPISANY (naliczony albo przebity promocją) ---
  if (activeCode) {
    const isCounted = appliedCode !== null;

    return (
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 animate-in fade-in",
            isCounted
              ? "border-[#D4F0C8] bg-[#D4F0C8]/25"
              : "border-amber-200 bg-amber-50/60",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isCounted ? (
              <CheckCircle2 size={16} className="text-[#103830] shrink-0" />
            ) : (
              <Info size={16} className="text-amber-600 shrink-0" />
            )}
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-bold truncate",
                  isCounted ? "text-[#103830]" : "text-amber-900",
                )}
              >
                {activeCode}
              </p>
              <p
                className={cn(
                  "text-xs",
                  isCounted ? "text-gray-600" : "text-amber-700",
                )}
              >
                {isCounted
                  ? "Rabat naliczony"
                  : "Twoja obecna promocja jest korzystniejsza — zostawiliśmy niższą cenę"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Usuń kod rabatowy"
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-[#103830] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // --- FORMULARZ WPISANIA KODU ---
  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <label
        htmlFor="coupon-code"
        className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-600"
      >
        <TicketPercent size={14} className="text-gray-400" />
        Kod rabatowy
      </label>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <input
            id="coupon-code"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply();
              }
            }}
            disabled={disabled || isLoading}
            placeholder="np. ALICJA10"
            maxLength={32}
            autoComplete="off"
            className={cn(
              "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm uppercase tracking-wide transition-all outline-none",
              "placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400",
              "focus:border-[#0c493e] focus:ring-1 focus:ring-[#0c493e]",
              "disabled:cursor-not-allowed disabled:bg-gray-50",
              error && "border-red-400 focus:border-red-400 focus:ring-red-400",
            )}
          />
        </div>

        <LoadingButton
          type="button"
          onClick={handleApply}
          isLoading={isLoading}
          disabled={disabled}
          variant="secondary"
          className="shrink-0 rounded-xl font-semibold"
        >
          Zastosuj
        </LoadingButton>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500 animate-in fade-in">{error}</p>
      )}
    </div>
  );
};
