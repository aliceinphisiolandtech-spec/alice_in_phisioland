"use client";

import { deleteNewsAction } from "@/app/actions/news";
import { Trash2, Calendar, BellRing, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link"; // <--- IMPORT

interface NewsItem {
  id: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: Date;
}

export const NewsList = ({ news }: { news: NewsItem[] }) => {
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // <--- WAŻNE: Nie wchodź w link
    e.stopPropagation(); // <--- WAŻNE: Nie triggeruj rodzica

    const res = await deleteNewsAction(id);
    if (res.error) toast.error(res.error);
    else toast.success("Usunięto aktualność");
  };

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <BellRing className="text-gray-300" size={24} />
        </div>
        <p className="text-gray-500 font-medium text-sm">
          Brak opublikowanych aktualności
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Dodaj pierwszą wiadomość używając formularza obok.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {news.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -2 }}
            className="group relative"
          >
            {/* LINK DO SZCZEGÓŁÓW (Obejmuje całą kartę) */}
            <Link
              href={`/admin/news/${item.id}`} // <--- Ścieżka dynamiczna
              className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              {/* 1. IKONA */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D4F0C8]/40 text-[#103830]">
                <BellRing size={20} />
              </div>

              {/* 2. TREŚĆ */}
              <div className="flex-1 min-w-0 pt-0.5 pr-8">
                {" "}
                {/* pr-8 robi miejsce na kosz */}
                {/* Data i Badge */}
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
                    <Calendar size={10} />
                    {format(item.createdAt, "dd MMM yyyy, HH:mm", {
                      locale: pl,
                    })}
                  </p>

                  {item.important && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600 uppercase tracking-wide">
                      <AlertCircle size={8} />
                      PUSH
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-gray-800 group-hover:text-[#103830] transition-colors mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {item.content}
                </p>
              </div>
            </Link>

            {/* 3. PRZYCISK USUWANIA (Pozycjonowany absolutnie, żeby nie psuć Linka) */}
            <button
              onClick={(e) => handleDelete(e, item.id)}
              className="absolute cursor-pointer top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 z-10"
              title="Usuń aktualność"
            >
              <Trash2 size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
