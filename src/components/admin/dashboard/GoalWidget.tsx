"use client";

import React from "react";
import { GoalData } from "./types";

export const GoalWidget = ({ data }: { data: GoalData }) => {
  const safePercentage = Math.min(data.percentage, 100);

  return (
    <div className="bg-white rounded-[30px] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
      <h3 className="font-bold text-lg text-gray-800 mb-2">Cel Całkowity</h3>
      <p className="text-sm text-gray-400 mb-6">Sprzedaż sklepu</p>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-4xl font-extrabold text-[#0c493e]">
          {data.percentage.toFixed(1)}%
        </span>
        <span className="text-sm text-gray-400 mb-2">zrealizowano</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#0c493e] to-[#c5e96b] rounded-full"
          style={{ width: `${safePercentage}%` }}
        ></div>
      </div>
      <div className="mt-4 flex justify-between text-xs font-medium text-gray-500">
        {/* ZMIANA: Wyświetlamy aktualną kwotę (data.current) */}
        <span>{data.current.toLocaleString()} PLN</span>
        <span>Cel: {data.target.toLocaleString()} PLN</span>
      </div>
    </div>
  );
};
