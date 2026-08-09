import { prisma } from "@/lib/prisma"; // Zmień na swój prawdziwy import instancji Prisma

import { formatNumberPl } from "@/lib/pricing";
import DashboardAdmin from "@/components/admin/dashboard/DashboardAdmin";
import { StatData } from "@/components/admin/dashboard/types";
import { loadRetentionOverview } from "@/lib/waitlist-retention-data";

// Funkcja pomocnicza do obliczania procentów
const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// Funkcja formatująca zmianę tekstową
const formatChangeText = (percent: number) => {
  if (percent > 0) return `+${percent}% od ost. miesiąca`;
  if (percent < 0) return `${percent}% od ost. miesiąca`;
  return "Brak zmian";
};

export default async function AdminDashboardPage() {
  // 1. Ustawienia dat (Miesiąc bieżący vs Poprzedni dla trendów)
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sevenDaysAgo = new Date(now.setDate(now.getDate() - 6)); // Z ostatnich 7 dni

  // Zakupy testowe z piaskownicy nie są sprzedażą — nie mogą podbijać przychodu
  // ani liczby klientów. Dokładamy ten filtr do KAŻDEGO zapytania o zamówienia.
  const REAL = { isSandbox: false } as const;

  // --- PRZYCHÓD (Suma z Orders w groszach -> konwersja na PLN) ---
  const totalRevenueData = await prisma.order.aggregate({
    where: { ...REAL, status: "succeeded" },
    _sum: { amount: true },
  });

  const currentMonthRevenue = await prisma.order.aggregate({
    where: {
      ...REAL,
      status: "succeeded",
      createdAt: { gte: startOfThisMonth },
    },
    _sum: { amount: true },
  });

  const lastMonthRevenue = await prisma.order.aggregate({
    where: {
      ...REAL,
      status: "succeeded",
      createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
    },
    _sum: { amount: true },
  });

  const totalRevenue = (totalRevenueData._sum.amount || 0) / 100;
  const currentMonthRevPLN = (currentMonthRevenue._sum.amount || 0) / 100;
  const lastMonthRevPLN = (lastMonthRevenue._sum.amount || 0) / 100;
  const revenueTrend = calculateChange(currentMonthRevPLN, lastMonthRevPLN);

  // --- E-BOOKI (Ilość wpisów w Purchase) ---
  // Ten sam filtr co przy zamówieniach: dostęp nadany zakupem testowym
  // z piaskownicy nie jest sprzedażą (patrz Purchase.isSandbox).
  const totalPurchases = await prisma.purchase.count({ where: REAL });
  const currentMonthPurchases = await prisma.purchase.count({
    where: { ...REAL, createdAt: { gte: startOfThisMonth } },
  });
  const lastMonthPurchases = await prisma.purchase.count({
    where: {
      ...REAL,
      createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
    },
  });
  const purchasesTrend = calculateChange(
    currentMonthPurchases,
    lastMonthPurchases,
  );

  // --- KLIENCI (Unikalni użytkownicy z sukcesywnym zamówieniem) ---
  const totalCustomers = await prisma.order.groupBy({
    by: ["userId"],
    where: { ...REAL, status: "succeeded" },
  });
  const currentMonthCustomers = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      ...REAL,
      status: "succeeded",
      createdAt: { gte: startOfThisMonth },
    },
  });
  const lastMonthCustomers = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      ...REAL,
      status: "succeeded",
      createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
    },
  });
  const customersTrend = calculateChange(
    currentMonthCustomers.length,
    lastMonthCustomers.length,
  );

  // --- BŁĘDY / FAILED ORDERS ---
  const totalFails = await prisma.order.count({
    where: { ...REAL, status: "failed" },
  });
  const currentMonthFails = await prisma.order.count({
    where: { ...REAL, status: "failed", createdAt: { gte: startOfThisMonth } },
  });
  const lastMonthFails = await prisma.order.count({
    where: {
      ...REAL,
      status: "failed",
      createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
    },
  });
  const failsTrend = calculateChange(currentMonthFails, lastMonthFails);

  // --- BUDOWANIE DANYCH KART ---
  const statsData: StatData[] = [
    {
      title: "Całkowity Przychód",
      value: `${formatNumberPl(totalRevenue)} PLN`,
      change: formatChangeText(revenueTrend),
      trend: revenueTrend >= 0 ? "up" : "down",
      bg: "bg-[#0c493e]",
      text: "text-white",
      subText: "text-white/70",
      iconBg: "bg-white/20",
      iconColor: "text-white",
    },
    {
      title: "Sprzedane E-booki",
      value: totalPurchases.toString(),
      change: formatChangeText(purchasesTrend),
      trend: purchasesTrend >= 0 ? "up" : "down",
      bg: "bg-white",
      text: "text-gray-800",
      subText: "text-gray-400",
      iconBg: "bg-gray-50",
      iconColor: "text-[#0c493e]",
    },
    {
      title: "Klienci (Wszyscy)",
      value: totalCustomers.length.toString(),
      change: formatChangeText(customersTrend),
      trend: customersTrend >= 0 ? "up" : "down",
      bg: "bg-white",
      text: "text-gray-800",
      subText: "text-gray-400",
      iconBg: "bg-gray-50",
      iconColor: "text-[#0c493e]",
    },
    {
      title: "Zwroty / Błędy",
      value: totalFails.toString(),
      change: formatChangeText(failsTrend),
      trend: failsTrend > 0 ? "up" : "down", // Jeśli rosną błędy - strzałka w górę
      bg: "bg-white",
      text: "text-gray-800",
      subText: "text-gray-400",
      iconBg: "bg-gray-50",
      iconColor: "text-red-500", // Wyróżnijmy na czerwono
    },
  ];

  // --- WYKRES - Ostatnie 7 dni ---
  const recentOrdersForChart = await prisma.order.findMany({
    where: {
      ...REAL,
      status: "succeeded",
      createdAt: { gte: sevenDaysAgo },
    },
    select: { amount: true, createdAt: true },
  });

  const daysOfWeek = ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
  const chartMap = new Map();

  // Inicjalizacja ostatnich 7 dni wartością 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    chartMap.set(daysOfWeek[d.getDay()], 0);
  }

  // Wypełnianie danymi
  recentOrdersForChart.forEach((order) => {
    const dayName = daysOfWeek[order.createdAt.getDay()];
    chartMap.set(dayName, chartMap.get(dayName) + order.amount / 100);
  });

  const chartData = Array.from(chartMap, ([name, value]) => ({ name, value }));

  // --- OSTATNIE ZAMÓWIENIA TABELA ---
  const totalOrdersCount = await prisma.order.count({ where: REAL });

  const rawRecentOrders = await prisma.order.findMany({
    where: REAL,
    take: 5, // <--- Zostawiamy 5 (inicjalne załadowanie)
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  const recentOrders = rawRecentOrders.map((order) => {
    // Priorytetyzacja nazwy: billingName -> user.name -> "Nieznany"
    const displayName =
      order.billingName || order.user.name || "Nieznany Klient";
    return {
      id: order.id,
      name: displayName,
      productId: order.paymentIntentId.slice(-6) || "Wiele", // Jako, że koszyk może mieć wiele produktów w Twoim modelu brakuje relacji Order->Product. Używamy tu kawałka paymentId w zastępstwie dla widoku
      status: order.status,
      amount: order.amount / 100,
      avatar: displayName.substring(0, 2),
      discountCode: order.discountCode,
      originalAmount: order.originalAmount ? order.originalAmount / 100 : null,
    };
  });

  // --- CEL SPRZEDAŻY ---
  const GOAL_TARGET = 50000; // Np. 50k PLN
  const goalPercentage = (totalRevenue / GOAL_TARGET) * 100;

  // Przypomnienie o okresie przechowywania danych z list zapisów — obietnica
  // z polityki prywatności musi mieć pokrycie w tym, co widzi administratorka.
  const retention = await loadRetentionOverview();

  return (
    <DashboardAdmin
      statsData={statsData}
      retention={retention}
      totalOrdersCount={totalOrdersCount}
      chartData={chartData}
      recentOrders={recentOrders}
      goalData={{
        current: totalRevenue,
        target: GOAL_TARGET,
        percentage: goalPercentage,
      }}
    />
  );
}
