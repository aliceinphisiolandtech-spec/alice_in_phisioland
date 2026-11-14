"use client";

import React from "react";
import { motion } from "framer-motion";
import { formatNumberPl } from "@/lib/pricing";
import { GoalData } from "./types";

export const GoalWidget = ({ data }: { data: GoalData }) => {
  const safePercentage = Math.min(Math.max(data.percentage, 0), 100);

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-gray-100 bg-white p-8 shadow-sm max-[640px]:rounded-3xl max-[640px]:p-6">
      <h3 className="mb-2 text-lg font-bold text-gray-800">Cel Całkowity</h3>
      <p className="mb-6 text-sm text-gray-400">Sprzedaż sklepu</p>
      <div className="mb-2 flex items-end gap-2">
        <span className="text-4xl font-extrabold tabular-nums text-[#0c493e]">
          {data.percentage.toFixed(1)}%
        </span>
        <span className="mb-2 text-sm text-gray-400">zrealizowano</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        {/* Wypełnienie rośnie przez scaleX (GPU), nie przez width (reflow). */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: safePercentage / 100 }}
          transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "left" }}
          className="h-full w-full rounded-full bg-gradient-to-r from-[#0c493e] to-[#c5e96b]"
        />
      </div>
      <div className="mt-4 flex justify-between text-xs font-medium text-gray-500">
        <span>{formatNumberPl(data.current)} PLN</span>
        <span>Cel: {formatNumberPl(data.target)} PLN</span>
      </div>
    </div>
  );
};
