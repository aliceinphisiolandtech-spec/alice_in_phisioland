"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatNumberPl } from "@/lib/pricing";
import { ChartDataPoint } from "./types";

// Własny dymek (Tooltip) pojawiający się po najechaniu na słupek
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100">
        <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-[#0c493e] font-extrabold text-lg">
          {formatNumberPl(payload[0].value)} PLN
        </p>
      </div>
    );
  }
  return null;
};

export const RevenueChart = ({ data }: { data: ChartDataPoint[] }) => {
  return (
    <div className="animate-in fade-in @[1120px]/dash:col-span-2 flex h-full min-h-[420px] flex-col rounded-[30px] border border-gray-100 bg-white p-8 shadow-sm duration-500 max-[640px]:rounded-3xl max-[640px]:p-5">
      <div className="flex items-center justify-between mb-8 max-[640px]:mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Analityka Sprzedaży
          </h2>
          <p className="text-sm text-gray-400">Przychód z ostatnich 7 dni</p>
        </div>
      </div>

      {/* Stała wysokość: przy `height="100%"` rodzic miał tylko min-height,
          więc recharts przy pierwszym pomiarze dostawał -1 i ostrzegał. */}
      <div className="w-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height={320} minWidth={0}>
          <BarChart
            data={data}
            // Zwiększono dolny margines (bottom: 20 zamiast 0), aby etykiety osi X miały miejsce
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#F3F4F6"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }}
              // Zmniejszono dy (przesunięcie w dół) na 10
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#F3F6F4", radius: 8 }}
              animationDuration={150}
            />

            <Bar
              dataKey="value"
              radius={[6, 6, 6, 6]}
              barSize={40}
              minPointSize={4}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value > 0 ? "#0c493e" : "#F3F4F6"}
                  className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
