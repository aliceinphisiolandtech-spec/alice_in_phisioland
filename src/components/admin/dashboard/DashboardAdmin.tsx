"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion, type Variants } from "framer-motion";
import { StatData, ChartDataPoint, RecentOrder, GoalData } from "./types";
import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { StatCard } from "./StatCard";
import { GoalWidget } from "./GoalWidget";
import { RetentionWidget } from "./RetentionWidget";
import type { RetentionOverview } from "@/lib/waitlist-retention-data";

import { RecentOrdersTable } from "./RecentOrdersTable";

/**
 * Wykres ładowany osobno. recharts (+ d3) to najcięższa zależność panelu —
 * w głównym pakiecie dashboardu opóźniała interaktywność całej strony, choć
 * sam wykres jest tylko jedną kartą. Teraz reszta panelu działa od razu,
 * a w miejscu wykresu do czasu doładowania stoi szkielet tej samej wysokości
 * (bez skoku układu).
 */
const RevenueChart = dynamic(
  () => import("./RevenueChart").then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] flex-col rounded-[30px] border border-gray-100 bg-white p-8 shadow-sm @[1120px]/dash:col-span-2 max-[640px]:rounded-3xl max-[640px]:p-5">
        <div className="admin-skeleton h-5 w-48 rounded-lg" />
        <div className="admin-skeleton mt-2 h-4 w-40 rounded-lg" />
        <div className="admin-skeleton mt-8 flex-1 rounded-2xl" />
      </div>
    ),
  },
);

const EASE = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      // `@container/dash`: progi siatki liczone od szerokości obszaru treści
      // (ekran minus menu), a nie od ekranu. Na 13" notebooku z rozwiniętym
      // menu treść ma ~1000 px — cztery karty w rzędzie były wtedy za ciasne.
      className="@container/dash mx-auto w-full max-w-[1600px] space-y-6"
    >
      {/* --- HEADER --- */}
      <PageHeader
        icon={<LayoutDashboard size={24} />}
        eyebrow="Przegląd"
        title="Dashboard"
        description="Podsumowanie sprzedaży e-booka na prawdziwych danych — bez zakupów testowych."
      />

      {/* --- STATS GRID --- */}
      <motion.div
        variants={container}
        className="grid grid-cols-1 gap-4 @[520px]/dash:grid-cols-2 @[880px]/dash:grid-cols-4 @[1120px]/dash:gap-6"
      >
        {statsData.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <StatCard data={stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* --- MIDDLE SECTION: CHART & WIDGETS --- */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-6 @[1120px]/dash:grid-cols-3"
      >
        <RevenueChart data={chartData} />

        {/* Widżety: obok siebie, gdy wykres jest nad nimi na pełną szerokość;
            w kolumnie, gdy stoją obok wykresu. */}
        <div className="grid grid-cols-1 content-start gap-6 @[720px]/dash:grid-cols-2 @[1120px]/dash:grid-cols-1">
          <GoalWidget data={goalData} />
          <RetentionWidget data={retention} />
        </div>
      </motion.div>

      {/* --- BOTTOM SECTION: RECENT ORDERS --- */}
      <motion.div variants={item}>
        <RecentOrdersTable
          initialOrders={recentOrders}
          totalOrders={totalOrdersCount}
        />
      </motion.div>
    </motion.div>
  );
}
