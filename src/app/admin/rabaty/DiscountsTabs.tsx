"use client";

import { useState } from "react";
import { MotionConfig, motion, AnimatePresence } from "framer-motion";
import { Ticket, Tag, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CodesTab } from "./CodesTab";
import { SalesTab } from "./SalesTab";
import { EmailDiscountsTab } from "./EmailDiscountsTab";
import { COLLAPSE, SPRING } from "./_shared";
import type { DiscountRow, EmailDiscountRow, SaleRow } from "./types";

interface DiscountsTabsProps {
  codes: DiscountRow[];
  sales: SaleRow[];
  emailDiscounts: EmailDiscountRow[];
  /** Cena sprzedaży z ustawień — podstawa podglądów w formularzach (grosze). */
  basePrice: number;
}

type TabKey = "codes" | "sales" | "emails";

export const DiscountsTabs = ({
  codes,
  sales,
  emailDiscounts,
  basePrice,
}: DiscountsTabsProps) => {
  const [tab, setTab] = useState<TabKey>("codes");

  const tabs = [
    {
      key: "codes" as const,
      label: "Kody rabatowe",
      icon: Ticket,
      count: codes.length,
    },
    {
      key: "sales" as const,
      label: "Przeceny",
      icon: Tag,
      count: sales.length,
    },
    {
      key: "emails" as const,
      label: "Zniżki dla wybranych osób",
      icon: Users,
      count: emailDiscounts.length,
    },
  ];

  return (
    // reducedMotion="user" — kto wyłączył animacje w systemie, dostaje statyczny
    // panel bez ruchu, ale z zachowanymi stanami.
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-5">
        {/* --- ZAKŁADKI ---
            Pastylki na szarym torze zamiast cienkiej kreski: aktywna zakładka
            czyta się od razu, a nic nie wystaje poza content-box.
            `overflow-y-hidden` jest jawne, bo przy samym `overflow-x-auto`
            CSS zamienia `overflow-y: visible` na `auto` i przeglądarka
            dorysowuje pionowy pasek przewijania. */}
        <div
          role="tablist"
          aria-label="Rodzaje rabatów"
          className="flex gap-1 overflow-x-auto overflow-y-hidden rounded-xl bg-gray-100 p-1 scrollbar-hide"
        >
          {tabs.map((item) => {
            const isActive = tab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(item.key)}
                className={cn(
                  "relative flex flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "text-[#0c493e]"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {/* Wspólny layoutId — biała pastylka przesuwa się między
                    zakładkami zamiast gasnąć i zapalać się w nowym miejscu. */}
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    transition={SPRING}
                    className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  />
                )}

                <span className="relative flex items-center gap-2">
                  <item.icon size={16} />
                  {item.label}

                  {item.count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors duration-200",
                        isActive
                          ? "bg-[#c5e96b]/40 text-[#0c493e]"
                          : "bg-gray-200 text-gray-500",
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* --- ZAWARTOŚĆ --- */}
        {/* mode="wait" — nowa zakładka wjeżdża dopiero, gdy stara zniknie;
            bez tego dwa panele nachodziłyby na siebie i strona podskakiwała. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={COLLAPSE}
          >
            {tab === "codes" && (
              <CodesTab codes={codes} basePrice={basePrice} />
            )}
            {tab === "sales" && (
              <SalesTab sales={sales} basePrice={basePrice} />
            )}
            {tab === "emails" && (
              <EmailDiscountsTab
                discounts={emailDiscounts}
                basePrice={basePrice}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
