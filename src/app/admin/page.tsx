"use client";

import React from "react";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  Download,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// --- DANE MOCKOWE (Przykładowe) ---

const statsData = [
  {
    title: "Całkowity Przychód",
    value: "24,500 PLN",
    change: "+12% od ost. miesiąca",
    trend: "up",
    bg: "bg-[#0c493e]", // Ciemna zieleń (wyróżniona karta)
    text: "text-white",
    subText: "text-white/70",
    iconBg: "bg-white/20",
    iconColor: "text-white",
  },
  {
    title: "Sprzedane E-booki",
    value: "142",
    change: "+8% od ost. miesiąca",
    trend: "up",
    bg: "bg-white",
    text: "text-gray-800",
    subText: "text-gray-400",
    iconBg: "bg-gray-50",
    iconColor: "text-[#0c493e]",
  },
  {
    title: "Nowi Klienci",
    value: "38",
    change: "+22% od ost. miesiąca",
    trend: "up",
    bg: "bg-white",
    text: "text-gray-800",
    subText: "text-gray-400",
    iconBg: "bg-gray-50",
    iconColor: "text-[#0c493e]",
  },
  {
    title: "Zwroty / Błędy",
    value: "2",
    change: "-5% od ost. miesiąca",
    trend: "down", // Dobry znak w przypadku błędów
    bg: "bg-white",
    text: "text-gray-800",
    subText: "text-gray-400",
    iconBg: "bg-gray-50",
    iconColor: "text-[#0c493e]",
  },
];

const chartData = [
  { name: "Pon", value: 1200 },
  { name: "Wt", value: 2100 },
  { name: "Śr", value: 800 },
  { name: "Czw", value: 1600 },
  { name: "Pt", value: 2800 },
  { name: "Sob", value: 1400 },
  { name: "Ndz", value: 3200 },
];

const recentOrders = [
  {
    id: 1,
    name: "Marta K.",
    product: "E-book: Diagnostyka Kręgosłupa",
    status: "Opłacone",
    amount: "149 PLN",
    avatar: "MK",
  },
  {
    id: 2,
    name: "Piotr N.",
    product: "Kurs: Odcinek Lędźwiowy",
    status: "Oczekujące",
    amount: "299 PLN",
    avatar: "PN",
  },
  {
    id: 3,
    name: "Anna W.",
    product: "E-book: Diagnostyka Kręgosłupa",
    status: "Opłacone",
    amount: "149 PLN",
    avatar: "AW",
  },
];

// --- KOMPONENTY UI ---

const StatCard = ({ data }: { data: any }) => (
  <div
    className={`rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-[180px] transition-all hover:shadow-md ${data.bg}`}
  >
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-xl ${data.iconBg}`}>
        <TrendingUp className={`h-6 w-6 ${data.iconColor}`} />
      </div>
      <div
        className={`flex items-center gap-1 text-xs font-bold py-1 px-2 rounded-full ${
          data.trend === "up" && data.bg === "bg-white"
            ? "bg-green-100 text-green-700"
            : data.bg !== "bg-white"
              ? "bg-white/20 text-white"
              : "bg-gray-100 text-gray-500"
        }`}
      >
        <ArrowUpRight className="h-3 w-3" />
      </div>
    </div>
    <div>
      <h3 className={`text-sm font-medium mb-1 ${data.subText}`}>
        {data.title}
      </h3>
      <div className={`text-4xl font-extrabold ${data.text}`}>{data.value}</div>
      <div className={`text-xs mt-3 font-medium ${data.subText}`}>
        {data.change}
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0c493e]">Dashboard</h1>
          <p className="text-gray-400 mt-1 font-medium">
            Witaj Alicja, oto podsumowanie Twojej sprzedaży.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-white text-[#0c493e] font-bold text-sm hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            Raport
          </button>
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0c493e] text-white font-bold text-sm hover:bg-[#09362e] shadow-lg shadow-[#0c493e]/20 transition-all">
            <Plus className="h-4 w-4" />
            Dodaj Produkt
          </button>
        </div>
      </div>

      {/* --- STATS GRID (4 KOLUMNY) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatCard key={index} data={stat} />
        ))}
      </div>

      {/* --- MIDDLE SECTION: CHART & REMINDERS --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* WYKRES (2/3 szerokości) */}
        <div className="xl:col-span-2 bg-white rounded-[30px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Analityka Sprzedaży
              </h2>
              <p className="text-sm text-gray-400">
                Przychód z ostatnich 7 dni
              </p>
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <MoreHorizontal className="text-gray-400" />
            </button>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: "#F3F4F6" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value > 2500 ? "#0c493e" : "#E5E7EB"}
                      className="transition-all duration-500 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WIDGETY BOCZNE (1/3 szerokości) */}
        <div className="space-y-6">
          {/* Karta Celu / Progress */}
          <div className="bg-white rounded-[30px] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            <h3 className="font-bold text-lg text-gray-800 mb-2">
              Cel Miesięczny
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Sprzedaż e-booka "Kręgosłup"
            </p>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-extrabold text-[#0c493e]">
                84%
              </span>
              <span className="text-sm text-gray-400 mb-2">zrealizowano</span>
            </div>

            {/* Pasek postępu */}
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-[84%] bg-gradient-to-r from-[#0c493e] to-[#c5e96b] rounded-full"></div>
            </div>
            <div className="mt-4 flex justify-between text-xs font-medium text-gray-500">
              <span>0 PLN</span>
              <span>Cel: 50k PLN</span>
            </div>
          </div>

          {/* Ciemna Karta "Szybkie Akcje" (Nawiązanie do zdjęcia) */}
          <div className="bg-[#1a1c1e] rounded-[30px] p-6 text-white relative overflow-hidden group">
            {/* Tło ozdobne */}
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-[#c5e96b] rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity"></div>

            <h3 className="font-bold text-lg mb-1">Status Systemu</h3>
            <p className="text-white/60 text-sm mb-6">
              Wszystkie usługi działają poprawnie.
            </p>

            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl font-mono font-bold tracking-wider">
                ONLINE
              </div>
              <div className="h-3 w-3 rounded-full bg-[#c5e96b] animate-pulse shadow-[0_0_10px_#c5e96b]"></div>
            </div>

            <button className="w-full py-3 rounded-xl bg-[#c5e96b] text-[#0c493e] font-bold text-sm hover:bg-[#b4d660] transition-colors flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Sprawdź logi
            </button>
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION: RECENT ORDERS --- */}
      <div className="bg-white rounded-[30px] p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Ostatnie Zamówienia
          </h2>
          <button className="text-sm font-bold text-[#0c493e] hover:underline">
            Zobacz wszystkie
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-left">
              <tr className="border-b border-gray-100">
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider pl-4">
                  Klient
                </th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Produkt
                </th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Kwota
                </th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right pr-4">
                  Akcja
                </th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-gray-700">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="group hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 pl-4 rounded-l-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-[#0c493e] font-bold text-xs">
                        {order.avatar}
                      </div>
                      <span className="font-bold text-gray-800">
                        {order.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">{order.product}</td>
                  <td className="py-4 font-bold">{order.amount}</td>
                  <td className="py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === "Opłacone"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-4 rounded-r-xl">
                    <button className="p-2 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-[#0c493e]">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
