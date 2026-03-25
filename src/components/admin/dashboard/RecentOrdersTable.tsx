"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { RecentOrder } from "./types";
import { getOrdersPage } from "@/app/actions/orders";

interface Props {
  initialOrders: RecentOrder[];
  totalOrders: number;
}

export const RecentOrdersTable = ({ initialOrders, totalOrders }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<RecentOrder[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 5;

  const totalPages = Math.max(1, Math.ceil(totalOrders / itemsPerPage));

  const fetchPage = async (page: number) => {
    setIsLoading(true);
    try {
      const newOrders = await getOrdersPage(page, itemsPerPage);
      setOrders(newOrders);
      setCurrentPage(page);
    } catch (error) {
      console.error("Błąd podczas pobierania zamówień:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) fetchPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) fetchPage(currentPage + 1);
  };

  // --- FUNKCJE POMOCNICZE ---
  const getStatusStyles = (status: string) => {
    if (status === "succeeded") return "bg-green-100 text-green-700";
    if (status === "failed") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const translateStatus = (status: string) => {
    if (status === "succeeded") return "Opłacone";
    if (status === "failed") return "Odrzucone";
    if (status === "pending") return "Oczekujące";
    return status;
  };

  return (
    <div className="bg-white rounded-[30px] p-8 shadow-sm border border-gray-100 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Ostatnie Zamówienia</h2>
        {isLoading && (
          <Loader2 className="animate-spin text-[#0c493e]" size={20} />
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          {/* ... Nagłówki thead bez zmian ... */}
          <thead className="text-left">
            <tr className="border-b border-gray-100">
              <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider pl-4">
                Klient
              </th>
              <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Kwota
              </th>
              <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium text-gray-700">
            {/* Iterujemy po naszym stanie `orders` */}
            {orders.map((order) => (
              <tr
                key={order.id}
                className="group hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 pl-4 rounded-l-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-[#0c493e] font-bold text-xs uppercase">
                      {order.avatar}
                    </div>
                    <span className="font-bold text-gray-800">
                      {order.name}
                    </span>
                  </div>
                </td>
                <td className="py-4 font-bold">{order.amount} PLN</td>
                <td className="py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyles(order.status)}`}
                  >
                    {translateStatus(order.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalOrders > 0 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
          <span className="text-xs font-medium text-gray-400">
            Pokazuje {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, totalOrders)} z {totalOrders}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-gray-700 mx-2">
              Strona {currentPage} z {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {totalOrders === 0 && (
        <div className="py-8 text-center text-sm text-gray-400">
          Brak zamówień do wyświetlenia.
        </div>
      )}
    </div>
  );
};
