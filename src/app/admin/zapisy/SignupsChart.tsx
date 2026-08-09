"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailySignups } from "./types";

/**
 * Zapisy dzień po dniu z ostatnich 30 dni.
 *
 * Odpowiada na pytanie „czy post jeszcze pracuje": jeden wysoki słupek w dniu
 * publikacji i płaska reszta to sygnał, że warto przypomnieć o linku.
 */

/** Oś X przy 30 słupkach nie zmieści wszystkich dat — pokazujemy co piątą. */
const LABEL_INTERVAL = 4;

export function SignupsChart({ data }: { data: DailySignups[] }) {
  const total = data.reduce((sum, day) => sum + day.count, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
        <p className="text-sm text-gray-500">
          Brak zapisów w ciągu ostatnich 30 dni.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Wykres wypełni się, gdy ktoś skorzysta z linku.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        Zapisy w ciągu 30 dni · łącznie {total}
      </p>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#F3F4F6" strokeDasharray="4 4" />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={LABEL_INTERVAL}
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              // Liczba osób jest z natury całkowita — bez tego przy niskich
              // wartościach oś pokazywałaby „0,5 osoby".
              allowDecimals={false}
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
            />

            <Tooltip
              cursor={{ fill: "rgba(12, 73, 62, 0.06)" }}
              content={<SignupsTooltip />}
            />

            <Bar dataKey="count" fill="#0c493e" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number }>;
}

function SignupsTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const count = payload[0].value;

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className="text-sm font-extrabold text-[#0c493e]">
        {count} {count === 1 ? "zapis" : "zapisów"}
      </p>
    </div>
  );
}
