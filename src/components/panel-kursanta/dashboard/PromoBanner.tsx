"use client";

// 1. Dodaj Variants do importu
import { motion, Variants } from "framer-motion";
import { ExternalLink, MapPin, Users } from "lucide-react";

// 2. Przypisz typ : Variants do stałej
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const courseLink = process.env.NEXT_PUBLIC_KURSY_LINK;

export const PromoBanner = () => {
  return (
    <motion.a
      href={courseLink}
      target="_blank"
      rel="noreferrer"
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="relative block overflow-hidden rounded-3xl bg-[#103830] p-1 text-white shadow-xl shadow-[#103830]/10 group cursor-pointer"
    >
      {/* ... reszta Twojego kodu bez zmian ... */}
      <div className="relative z-10 flex h-full flex-col justify-between rounded-[22px] bg-gradient-to-br from-[#103830] to-[#0c2b25] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 max-w-[80%]">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D4F0C8] backdrop-blur-md">
              <Users size={12} />
              Warsztaty
            </div>

            <h3 className="text-xl font-bold leading-tight text-white">
              Chcesz zdobyć <span className="text-[#D4F0C8]">praktykę?</span>
            </h3>

            <p className="text-sm font-medium leading-relaxed text-gray-300">
              Zapisz się na szkolenie stacjonarne i przećwicz materiał pod okiem
              instruktora.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4F0C8] text-[#103830] shadow-lg shadow-[#D4F0C8]/20 transition-transform group-hover:rotate-6">
            <MapPin size={24} strokeWidth={2.5} />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[#D4F0C8] group-hover:text-white transition-colors">
          <span className="border-b-2 border-[#D4F0C8]/30 group-hover:border-[#D4F0C8] pb-0.5 transition-all">
            Sprawdź dostępne terminy
          </span>
          <ExternalLink
            size={16}
            className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
          />
        </div>
      </div>

      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#D4F0C8]/10 blur-3xl transition-all duration-500 group-hover:bg-[#D4F0C8]/20" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/20" />

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
    </motion.a>
  );
};
