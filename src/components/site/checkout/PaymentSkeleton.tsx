import React from "react";

export const PaymentSkeleton = () => {
  return (
    <div className="w-full animate-pulse mt-8">
      {/* 1. Nagłówek: "2. Metoda płatności" */}
      <div className="h-7 w-48 bg-gray-200 rounded mb-6"></div>

      {/* 2. Wybór metody (3 kafelki: BLIK, Karta, Klarna) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Kafelek 1 */}
        <div className="h-[52px] bg-gray-100 rounded-md border border-gray-200"></div>
        {/* Kafelek 2 */}
        <div className="h-[52px] bg-gray-100 rounded-md border border-gray-200"></div>
        {/* Kafelek 3 */}
        <div className="h-[52px] bg-gray-100 rounded-md border border-gray-200"></div>
      </div>

      {/* 3. Input: E-mail */}
      <div className="mb-4">
        {/* Label "E-mail" */}
        <div className="h-3 w-12 bg-gray-200 rounded mb-2"></div>
        {/* Input field */}
        <div className="h-[42px] w-full bg-white border border-gray-200 rounded shadow-sm"></div>
      </div>

      {/* 4. Input: Kod BLIK (lub dane karty) */}
      <div className="mb-6">
        {/* Label */}
        <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
        {/* Input field */}
        <div className="h-[42px] w-full bg-white border border-gray-200 rounded shadow-sm"></div>
      </div>

      {/* 5. Info block (ikona + tekst o autoryzacji) */}
      <div className="flex items-center gap-3 mb-8 opacity-70">
        <div className="h-8 w-10 bg-gray-200 rounded shrink-0"></div>
        <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
      </div>

      {/* 6. Checkbox + Regulamin */}
      <div className="flex items-start gap-3 mb-8">
        <div className="h-5 w-5 bg-gray-200 rounded shrink-0 mt-0.5"></div>
        <div className="space-y-2 w-full">
          <div className="h-3 w-full bg-gray-100 rounded"></div>
          <div className="h-3 w-5/6 bg-gray-100 rounded"></div>
        </div>
      </div>

      {/* 7. Przycisk "Zapłać" */}
      <div className="h-12 w-full bg-[#103830]/10 rounded-xl"></div>
    </div>
  );
};
