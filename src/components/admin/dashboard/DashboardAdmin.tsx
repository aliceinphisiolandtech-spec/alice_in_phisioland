"use client";

import React from "react";
import { StatData, ChartDataPoint, RecentOrder, GoalData } from "./types";
import { StatCard } from "./StatCard";
import { RevenueChart } from "./RevenueChart";
import { GoalWidget } from "./GoalWidget";
import { RetentionWidget } from "./RetentionWidget";
import type { RetentionOverview } from "@/lib/waitlist-retention-data";

import { RecentOrdersTable } from "./RecentOrdersTable";

export interface DashboardClientProps {
  statsData: StatData[];
  chartData: ChartDataPoint[];
  recentOrders: RecentOrder[];
  goalData: GoalData;
  totalOrdersCount: number;
  /** Przypomnienie o okresie przechowywania adresów z list zapisów. */
  retention: RetentionOverview;
}

export default function DashboardAdmin({
  statsData,
  chartData,
  recentOrders,
  goalData,
  totalOrdersCount,
  retention,
}: DashboardClientProps) {
  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0c493e]">Dashboard</h1>
          <p className="text-gray-400 mt-1 font-medium">
            Witaj, oto podsumowanie Twojej sprzedaży z prawdziwymi danymi.
          </p>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatCard key={index} data={stat} />
        ))}
      </div>

      {/* --- MIDDLE SECTION: CHART & WIDGETS --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <RevenueChart data={chartData} />

        <div className="space-y-6">
          <GoalWidget data={goalData} />
          <RetentionWidget data={retention} />
        </div>
      </div>

      {/* --- BOTTOM SECTION: RECENT ORDERS --- */}
      <RecentOrdersTable
        initialOrders={recentOrders}
        totalOrders={totalOrdersCount}
      />
    </div>
  );
}
