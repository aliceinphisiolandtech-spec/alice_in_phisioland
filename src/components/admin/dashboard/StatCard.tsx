"use client";

import React from "react";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BookOpen,
  Users,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StatData, StatIcon } from "./types";

const ICONS: Record<StatIcon, typeof TrendingUp> = {
  revenue: Wallet,
  ebooks: BookOpen,
  customers: Users,
  fails: TriangleAlert,
};

/**
 * "32 949,93 PLN" -> liczba + jednostka. Jednostkę składamy mniejszym
 * stopniem pisma: na wąskiej karcie pełna kwota w 36 px nie mieściła się
 * w jednej linii i „PLN” spadało pod spód, rozpychając kartę.
 */
function splitUnit(value: string): { amount: string; unit: string | null } {
  const match = /^(.*\d)\s+([^\d\s]+)$/.exec(value.trim());
  return match
    ? { amount: match[1], unit: match[2] }
    : { amount: value, unit: null };
}

export const StatCard = ({ data }: { data: StatData }) => {
  const Icon = data.icon ? ICONS[data.icon] : TrendingUp;
  const isDark = data.bg !== "bg-white";
  const { amount, unit } = splitUnit(data.value);

  return (
    <div
      className={cn(
        // Uniesienie przy najechaniu robi wyłącznie transform + cień —
        // bez zmiany rozmiaru, więc siatka obok nie przelicza układu.
        // `@container/card`: rozmiar liczby zależy od szerokości samej karty.
        "@container/card group relative flex h-full min-h-[164px] flex-col justify-between gap-5 overflow-hidden rounded-[24px] border border-gray-100 p-5 shadow-sm @[260px]/card:p-6",
        "transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(12,73,62,0.35)]",
        data.bg,
      )}
    >
      {isDark && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#c5e96b] opacity-20 blur-2xl transition-transform duration-500 group-hover:scale-125"
        />
      )}

      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            "rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-105 @[260px]/card:p-3",
            data.iconBg,
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 @[260px]/card:h-6 @[260px]/card:w-6",
              data.iconColor,
            )}
          />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold",
            isDark
              ? "bg-white/20 text-white"
              : data.trend === "up"
                ? "bg-green-100 text-green-700"
                : data.trend === "down"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-500",
          )}
        >
          {data.trend === "up" ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : data.trend === "down" ? (
            <ArrowDownRight className="h-3 w-3" />
          ) : (
            <TrendingUp className="h-3 w-3" />
          )}
        </div>
      </div>
      <div className="relative min-w-0">
        <h3 className={cn("mb-1 truncate text-sm font-medium", data.subText)}>
          {data.title}
        </h3>
        <div
          className={cn(
            "flex items-baseline gap-1.5 whitespace-nowrap font-extrabold leading-none tracking-tight tabular-nums",
            "text-[1.65rem] @[240px]/card:text-3xl @[300px]/card:text-4xl",
            data.text,
          )}
          title={data.value}
        >
          <span className="min-w-0 truncate">{amount}</span>
          {unit && (
            <span className="text-sm font-bold opacity-70 @[300px]/card:text-base">
              {unit}
            </span>
          )}
        </div>
        <div className={cn("mt-3 truncate text-xs font-medium", data.subText)}>
          {data.change}
        </div>
      </div>
    </div>
  );
};
