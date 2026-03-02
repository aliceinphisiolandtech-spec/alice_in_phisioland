"use client";

import Link from "next/link";
// 1. Dodajemy import typu Variants
import { motion, Variants } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";

// 2. Przypisujemy typ Variants do obiektu
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export const NewsSection = () => {
  return (
    <motion.section variants={itemVariants} className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          Aktualności
        </h3>
        <Link
          href="/panel-kursanta/aktualnosci"
          className="text-xs font-bold text-[#103830] hover:underline"
        >
          Wszystkie
        </Link>
      </div>

      <Link href="/panel-kursanta/aktualnosci" className="block group">
        <motion.div
          whileHover={{ y: -2 }}
          className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D4F0C8]/40 text-[#103830]">
            <Clock size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
              Nowość • 2 dni temu
            </p>
            <p className="truncate text-sm font-bold text-gray-800 group-hover:text-[#103830] transition-colors">
              Dodaliśmy nowy rozdział o diecie!
            </p>
          </div>
          <ChevronRight
            size={18}
            className="text-gray-300 group-hover:text-[#103830] transition-colors"
          />
        </motion.div>
      </Link>
    </motion.section>
  );
};
