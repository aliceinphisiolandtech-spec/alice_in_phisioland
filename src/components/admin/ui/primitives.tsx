"use client";

import React from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Wspólne klocki panelu administracyjnego.
 *
 * Powstały jako `admin/rabaty/_shared.tsx` i tam obsługiwały trzy zakładki
 * rabatów. Kreator stron zapisów potrzebuje dokładnie tego samego szkieletu
 * (przełącznik, karta listy, sekcja formularza), więc część nierabatowa
 * przeniosła się tutaj. `_shared.tsx` re-eksportuje ją dalej, dzięki czemu
 * wszystkie dotychczasowe importy w panelu rabatów działają bez zmian.
 *
 * Zasada: tutaj trafia wyłącznie to, co nie wie nic o swojej domenie.
 * Cokolwiek mówi o rabatach, kampaniach czy cenach — zostaje u siebie.
 */

/** Ruch elementów, które „przeskakują" (knob suwaka, podświetlenie zakładki). */
export const SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.7,
};

/** Rozwijanie i zwijanie treści — bez sprężyny, żeby wysokość nie drgała. */
export const COLLAPSE: Transition = { duration: 0.24, ease: [0.4, 0, 0.2, 1] };

export const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#0c493e] focus:ring-1 focus:ring-[#0c493e] outline-none transition-all placeholder:text-gray-400";

export const labelClass =
  "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 whitespace-nowrap";

// --- SUWAK ---

/**
 * Rozmiary suwaka trzymamy w liczbach, a nie w klasach Tailwinda, bo pozycję
 * knoba wyliczamy arytmetycznie.
 *
 * Knob jest pozycjonowany absolutnie z JAWNYM `left` i przesuwany przez `x`.
 * Bez `left` punktem startu byłaby pozycja statyczna — a `<button>` ma domyślne
 * `text-align: center`, którego preflight Tailwinda nie zeruje. Knob startowałby
 * od środka pilla i przy stanie włączonym wyjeżdżał za jego prawą krawędź.
 */
const SWITCH_SIZES = {
  sm: { track: 44, knob: 16, inset: 4 },
  md: { track: 48, knob: 20, inset: 4 },
} as const;

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
  size?: keyof typeof SWITCH_SIZES;
}

export const Switch = ({
  checked,
  onChange,
  disabled = false,
  label,
  size = "md",
}: SwitchProps) => {
  const { track, knob, inset } = SWITCH_SIZES[size];
  // Dystans między skrajnymi pozycjami knoba — knob nigdy nie wyjdzie za tor.
  const travel = track - knob - inset * 2;

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={SPRING}
      style={{ width: track, height: knob + inset * 2 }}
      className={cn(
        "relative shrink-0 cursor-pointer rounded-full outline-none transition-colors duration-300",
        "focus-visible:ring-2 focus-visible:ring-[#0c493e] focus-visible:ring-offset-2",
        checked ? "bg-[#0c493e]" : "bg-gray-300",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ x: checked ? travel : 0 }}
        transition={SPRING}
        style={{ width: knob, height: knob, left: inset, top: inset }}
        className="absolute rounded-full bg-white shadow-sm"
      />
    </motion.button>
  );
};

// --- ROZWIJANA TREŚĆ ---

/** Animowane rozwijanie/zwijanie wysokości. */
export const Collapse = ({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        key="content"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={COLLAPSE}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

/** Przełącznik z opisem i opcjonalną treścią rozwijaną pod spodem. */
export const SwitchRow = ({
  checked,
  onChange,
  title,
  description,
  icon,
  tone = "brand",
  children,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  /** "warn" podkreśla, że włączenie ma skutki widoczne dla klientek. */
  tone?: "brand" | "warn";
  children?: React.ReactNode;
}) => {
  const activeBorder =
    tone === "warn"
      ? "border-amber-200 bg-amber-50/50"
      : "border-[#0c493e]/30 bg-[#0c493e]/[0.03]";

  return (
    // Świadomie BEZ `layout` na tym kontenerze: wysokość animuje już `Collapse`
    // w środku, a dołożenie tu layout-animacji sprawiałoby, że ta sama zmiana
    // rozmiaru jest animowana dwa razy — i pudełko drga.
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors duration-300",
        checked ? activeBorder : "border-gray-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span
              className={cn(
                "mt-0.5 shrink-0 transition-colors duration-300",
                checked && tone === "warn" ? "text-amber-600" : "text-gray-400",
              )}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800">{title}</p>
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <Switch checked={checked} onChange={onChange} label={title} size="sm" />
      </div>

      {children && (
        <Collapse open={checked}>
          <div className="pt-4">{children}</div>
        </Collapse>
      )}
    </div>
  );
};

// --- PRZEŁĄCZNIK SEGMENTOWY ---

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  /** Unikalny identyfikator — potrzebny, by podświetlenie animowało się osobno. */
  name: string;
  /** Liczba kolumn. Domyślnie 2 — tyle miał pierwotny przełącznik typu rabatu. */
  columns?: 2 | 3;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  name,
  columns = 2,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 3 ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold transition-colors duration-200",
              isActive
                ? "border-[#0c493e] text-[#0c493e]"
                : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`segment-${name}`}
                transition={SPRING}
                className="absolute inset-0 rounded-lg bg-[#0c493e]/5"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- BUDULEC FORMULARZY ---

/**
 * Grupa pól z nagłówkiem. Bez tego formularze są jednym ciągiem pudełek
 * o identycznej wadze — nie da się na rzut oka odróżnić „co to jest"
 * od „kiedy i dla kogo działa".
 */
export const FormSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-4">
    <div>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      )}
    </div>
    {children}
  </section>
);

/** Główny przycisk akcji nagłówka listy. */
export const AddButton = ({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.97 }}
    transition={SPRING}
    className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[#0c493e] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#0a3b32]"
  >
    <Plus size={16} />
    {label}
  </motion.button>
);

/** Nagłówek listy: licznik po lewej, akcja po prawej. */
export const ListHeader = ({
  count,
  emptyLabel,
  countLabel,
  action,
}: {
  count: number;
  emptyLabel: string;
  countLabel: (count: number) => string;
  action: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4">
    <p className="text-sm text-gray-500">
      {count === 0 ? emptyLabel : countLabel(count)}
    </p>
    {action}
  </div>
);

/**
 * Karta na liście. Lewy pasek akcentu odpowiada na pytanie „czy to działa
 * u klientek?" bez czytania plakietek: zielony = na żywo, bursztynowy =
 * wymaga uwagi (piaskownica, zaplanowane), szary = nieaktywne.
 *
 * `sandbox` zostaje jako alias `warn` — tak nazywa ten stan panel rabatów
 * i nie ma powodu przepisywać jego wywołań.
 */
export const ListCard = ({
  busy,
  tone = "idle",
  children,
}: {
  busy?: boolean;
  tone?: "live" | "warn" | "sandbox" | "idle";
  children: React.ReactNode;
}) => {
  const accent = {
    live: "before:bg-[#0c493e]",
    warn: "before:bg-amber-400",
    sandbox: "before:bg-amber-400",
    idle: "before:bg-gray-200",
  }[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 pl-6 shadow-sm transition-all duration-200",
        "before:absolute before:inset-y-0 before:left-0 before:w-1 before:transition-colors before:duration-300",
        accent,
        busy ? "opacity-60" : "hover:border-gray-300 hover:shadow-md",
      )}
    >
      {children}
    </div>
  );
};

/** Wspólna otoczka animacji formularza (wjazd/wyjazd nad listą). */
export const FormShell = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    key="form"
    initial={{ opacity: 0, y: -8, height: 0 }}
    animate={{ opacity: 1, y: 0, height: "auto" }}
    exit={{ opacity: 0, y: -8, height: 0 }}
    transition={COLLAPSE}
    className="overflow-hidden"
  >
    {children}
  </motion.div>
);

export const EmptyState = ({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={COLLAPSE}
    className="flex flex-col items-start rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10"
  >
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-300">
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-1 text-xs text-gray-400">{hint}</p>
  </motion.div>
);

/** Wspólne animacje wiersza listy. */
export const listItemMotion = {
  layout: true as const,
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
  transition: COLLAPSE,
};
