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
    <div className="xl:col-span-2 bg-white rounded-[30px] max-[640px]:rounded-3xl p-8 max-[640px]:p-5 shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8 max-[640px]:mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Analityka Sprzedaży
          </h2>
          <p className="text-sm text-gray-400">Przychód z ostatnich 7 dni</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
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

            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB" }} />

            <Bar
              dataKey="value"
              radius={[6, 6, 6, 6]}
              barSize={40}
              minPointSize={4}
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
