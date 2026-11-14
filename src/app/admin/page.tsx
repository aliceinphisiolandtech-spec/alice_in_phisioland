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
  // Wykres obejmuje 7 PEŁNYCH dni (dziś + 6 poprzednich) — od północy, a nie
  // od bieżącej godziny sprzed tygodnia, inaczej najstarszy słupek był ucięty.
  const sevenDaysAgo = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 6,
  );

  // Zakupy testowe z piaskownicy nie są sprzedażą — nie mogą podbijać przychodu
  // ani liczby klientów. Dokładamy ten filtr do KAŻDEGO zapytania o zamówienia.
  const REAL = { isSandbox: false } as const;
  const PAID = { ...REAL, status: "succeeded" } as const;
  const FAILED = { ...REAL, status: "failed" } as const;
  const THIS_MONTH = { createdAt: { gte: startOfThisMonth } };
  const LAST_MONTH = {
    createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
  };

  // WYDAJNOŚĆ: wszystkie zapytania są od siebie niezależne, więc idą RÓWNOLEGLE.
  // Wcześniej szły jedno po drugim (~17 rund do bazy), przez co czas wejścia
  // na dashboard był sumą wszystkich zapytań zamiast czasem najwolniejszego.
  const [
    totalRevenueData,
    currentMonthRevenue,
    lastMonthRevenue,
    totalPurchases,
    currentMonthPurchases,
    lastMonthPurchases,
    totalCustomers,
    currentMonthCustomers,
    lastMonthCustomers,
    totalFails,
    currentMonthFails,
    lastMonthFails,
    recentOrdersForChart,
    totalOrdersCount,
    rawRecentOrders,
    retention,
  ] = await Promise.all([
    // --- PRZYCHÓD (Suma z Orders w groszach -> konwersja na PLN) ---
    prisma.order.aggregate({ where: PAID, _sum: { amount: true } }),
    prisma.order.aggregate({
      where: { ...PAID, ...THIS_MONTH },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: { ...PAID, ...LAST_MONTH },
      _sum: { amount: true },
    }),
    // --- E-BOOKI (Ilość wpisów w Purchase) ---
    // Dostęp nadany zakupem testowym z piaskownicy nie jest sprzedażą.
    prisma.purchase.count({ where: REAL }),
    prisma.purchase.count({ where: { ...REAL, ...THIS_MONTH } }),
    prisma.purchase.count({ where: { ...REAL, ...LAST_MONTH } }),
    // --- KLIENCI (Unikalni użytkownicy z opłaconym zamówieniem) ---
    prisma.order.groupBy({ by: ["userId"], where: PAID }),
    prisma.order.groupBy({ by: ["userId"], where: { ...PAID, ...THIS_MONTH } }),
    prisma.order.groupBy({ by: ["userId"], where: { ...PAID, ...LAST_MONTH } }),
    // --- BŁĘDY / FAILED ORDERS ---
    prisma.order.count({ where: FAILED }),
    prisma.order.count({ where: { ...FAILED, ...THIS_MONTH } }),
    prisma.order.count({ where: { ...FAILED, ...LAST_MONTH } }),
    // --- WYKRES - Ostatnie 7 dni ---
    prisma.order.findMany({
      where: { ...PAID, createdAt: { gte: sevenDaysAgo } },
      select: { amount: true, createdAt: true },
    }),
    // --- OSTATNIE ZAMÓWIENIA TABELA ---
    prisma.order.count({ where: REAL }),
    prisma.order.findMany({
      where: REAL,
      take: 5, // inicjalne załadowanie, kolejne strony dociąga RecentOrdersTable
      orderBy: { createdAt: "desc" },
      // Z użytkownika potrzebne jest wyłącznie imię — bez ciągnięcia całego
      // rekordu (e-mail, tokeny, zdjęcie) do serwera i dalej.
      include: { user: { select: { name: true } } },
    }),
    // Przypomnienie o okresie przechowywania danych z list zapisów — obietnica
    // z polityki prywatności musi mieć pokrycie w tym, co widzi administratorka.
    loadRetentionOverview(),
  ]);

  const totalRevenue = (totalRevenueData._sum.amount || 0) / 100;
  const currentMonthRevPLN = (currentMonthRevenue._sum.amount || 0) / 100;
  const lastMonthRevPLN = (lastMonthRevenue._sum.amount || 0) / 100;
  const revenueTrend = calculateChange(currentMonthRevPLN, lastMonthRevPLN);

  const purchasesTrend = calculateChange(
    currentMonthPurchases,
    lastMonthPurchases,
  );
  const customersTrend = calculateChange(
    currentMonthCustomers.length,
    lastMonthCustomers.length,
  );
  const failsTrend = calculateChange(currentMonthFails, lastMonthFails);

  // --- BUDOWANIE DANYCH KART ---
  const statsData: StatData[] = [
    {
      title: "Całkowity Przychód",
      icon: "revenue",
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
      icon: "ebooks",
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
      icon: "customers",
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
      icon: "fails",
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
