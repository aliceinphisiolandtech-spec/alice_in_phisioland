"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, FlaskConical, Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DatePicker } from "@/components/ui/DatePicker";
import { formatBoundary, formatLocalDate } from "@/lib/date-input";
import { COLLAPSE, SPRING, labelClass } from "@/components/admin/ui/primitives";
import type { DiscountStatus } from "@/lib/discounts";

/**
 * Klocki panelu rabatów. Trzy zakładki (kody, przeceny, zniżki mailowe)
 * mają ten sam szkielet, więc trzymamy go w jednym miejscu, żeby nie
 * rozjechał się wizualnie.
 *
 * Część nierabatowa (suwak, karta listy, sekcja formularza…) przeniosła się do
 * `@/components/admin/ui/primitives` — używa jej także kreator stron zapisów.
 * Re-eksportujemy ją poniżej, więc wszystkie importy `from "./_shared"`
 * działają dalej bez zmian.
 */

export {
  SPRING,
  COLLAPSE,
  inputClass,
  labelClass,
  Switch,
  Collapse,
  SwitchRow,
  SegmentedControl,
  FormSection,
  AddButton,
  ListHeader,
  ListCard,
  FormShell,
  EmptyState,
  listItemMotion,
} from "@/components/admin/ui/primitives";

/**
 * Okno czasowe na liście. Godzina pojawia się tylko wtedy, gdy nie jest
 * granicą całego dnia — szczegóły w `formatBoundary`.
 */
export function formatWindow(row: {
  validFrom: string | null;
  validUntil: string | null;
}): string {
  if (!row.validFrom && !row.validUntil) return "Bezterminowo";

  const from = row.validFrom
    ? formatBoundary(row.validFrom, "from")
    : "od zawsze";
  const until = row.validUntil
    ? formatBoundary(row.validUntil, "until")
    : "bezterminowo";

  return `${from} — ${until}`;
}

/**
 * Zużycie puli — wspólne dla kodów, przecen i zniżek mailowych.
 * Pokazuje licznik i pasek postępu; przy braku limitu tylko liczbę użyć.
 */
export const UsageMeter = ({
  usageLimit,
  usedCount,
}: {
  usageLimit: number | null;
  usedCount: number;
}) => {
  if (usageLimit === null) {
    return (
      <span className="flex items-center gap-1.5">
        <InfinityIcon size={12} className="text-gray-400" />
        Użyć: {usedCount} (bez limitu)
      </span>
    );
  }

  const left = Math.max(0, usageLimit - usedCount);

  return (
    <span className="flex items-center gap-1.5">
      Użyć: {usedCount} / {usageLimit}
      <span className={cn(left === 0 ? "text-red-500" : "text-gray-400")}>
        ({left === 0 ? "wyczerpany" : `zostało ${left}`})
      </span>
    </span>
  );
};

/** Pasek wykorzystania puli. Nic nie renderuje przy braku limitu. */
export const UsageBar = ({
  usageLimit,
  usedCount,
}: {
  usageLimit: number | null;
  usedCount: number;
}) => {
  if (usageLimit === null) return null;

  const left = Math.max(0, usageLimit - usedCount);

  return (
    <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          left === 0 ? "bg-red-400" : "bg-[#0c493e]",
        )}
        style={{ width: `${Math.min(100, (usedCount / usageLimit) * 100)}%` }}
      />
    </div>
  );
};

/** Plakietka „ten rabat żyje tylko w piaskownicy". */
export const SandboxBadge = () => (
  <span
    title="Utworzone lub zmienione w piaskownicy — klientki tego nie widzą"
    className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700"
  >
    <FlaskConical size={10} />
    Piaskownica
  </span>
);

export const StatusBadge = ({ status }: { status: DiscountStatus }) => (
  <motion.span
    key={status.key}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={SPRING}
    className={cn(
      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
      status.tone,
    )}
  >
    {status.label}
  </motion.span>
);

/**
 * Pola „ważny od / do" — wspólne dla wszystkich trzech typów obniżek.
 *
 * Godziny nie ma w interfejsie: początek to północ wybranego dnia, koniec —
 * jego 23:59. Okno zawsze obejmuje pełne doby, więc nie da się przez pomyłkę
 * wyłączyć promocji w środku dnia sprzedaży.
 */
export const DateWindowFields = ({
  from,
  until,
  onFrom,
  onUntil,
  idPrefix,
}: {
  from: string;
  until: string;
  onFrom: (value: string) => void;
  onUntil: (value: string) => void;
  idPrefix: string;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex gap-4 max-[560px]:flex-col">
      <div className="flex-1">
        <label htmlFor={`${idPrefix}-from`} className={labelClass}>
          Ważny od
        </label>
        <DatePicker
          id={`${idPrefix}-from`}
          value={from}
          onChange={onFrom}
          dayTime="00:00"
          placeholder="Od zawsze"
          ariaLabel="Data rozpoczęcia"
        />
      </div>

      <div className="flex-1">
        <label htmlFor={`${idPrefix}-until`} className={labelClass}>
          Ważny do (włącznie)
        </label>
        <DatePicker
          id={`${idPrefix}-until`}
          value={until}
          onChange={onUntil}
          dayTime="23:59"
          placeholder="Bezterminowo"
          ariaLabel="Data zakończenia"
        />
      </div>
    </div>

    {/* Pytanie „czy ostatni dzień się liczy?" zadaje sobie każdy, kto ustawia
        termin — odpowiadamy przy polu, a nie dopiero w dokumentacji. */}
    <p className="flex items-start gap-1.5 text-xs text-gray-500">
      <Clock size={12} className="mt-0.5 shrink-0 text-gray-400" />
      {until ? (
        <span>
          Ostatni dzień liczy się w całości: wyłączenie nastąpi{" "}
          <strong className="font-semibold text-gray-700">
            {formatLocalDate(until)}
          </strong>{" "}
          o <strong className="font-semibold text-gray-700">23:59</strong>.
          Start to północ dnia „ważny od”.
        </span>
      ) : (
        <span>
          Ostatni dzień liczy się w całości — wyłączenie następuje o 23:59
          wybranej daty. Start to północ dnia „ważny od”.
        </span>
      )}
    </p>
  </div>
);

/**
 * Wynik na żywo: ile realnie zapłaci klientka przy obecnych ustawieniach.
 * To najważniejsza informacja zwrotna w formularzu, więc dostaje wagę
 * wizualną zamiast być drobnym tekstem pod polem.
 */
export const PricePreview = ({
  label = "Klientka zapłaci",
  finalAmount,
  baseAmount,
  formatPrice,
}: {
  label?: string;
  finalAmount: number | null;
  baseAmount: number;
  formatPrice: (grosze: number) => string;
}) => (
  <div
    className={cn(
      "flex items-baseline gap-3 rounded-xl border px-4 py-3 transition-colors duration-300",
      finalAmount !== null
        ? "border-[#c5e96b]/60 bg-[#c5e96b]/10"
        : "border-gray-200 bg-gray-50",
    )}
  >
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
      {label}
    </span>

    {finalAmount === null ? (
      <span className="text-sm text-gray-400">uzupełnij wartość rabatu</span>
    ) : (
      <>
        <motion.span
          key={finalAmount}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={COLLAPSE}
          className="text-xl font-bold text-[#0c493e]"
        >
          {formatPrice(finalAmount)}
        </motion.span>
        {baseAmount > finalAmount && (
          <span className="text-sm text-gray-400 line-through">
            {formatPrice(baseAmount)}
          </span>
        )}
      </>
    )}
  </div>
);
