"use client";

import React from "react";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { StatData } from "./types";

export const StatCard = ({ data }: { data: StatData }) => {
  return (
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
              : data.trend === "down" && data.bg === "bg-white"
                ? "bg-red-100 text-red-700"
                : data.bg !== "bg-white"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
          }`}
        >
          {data.trend === "up" ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : data.trend === "down" ? (
            <ArrowDownRight className="h-3 w-3" />
          ) : (
            <TrendingUp className="h-3 w-3" />
          )}
        </div>
      </div>
      <div>
        <h3 className={`text-sm font-medium mb-1 ${data.subText}`}>
          {data.title}
        </h3>
        <div className={`text-4xl font-extrabold ${data.text}`}>
          {data.value}
        </div>
        <div className={`text-xs mt-3 font-medium ${data.subText}`}>
          {data.change}
        </div>
      </div>
    </div>
  );
};
