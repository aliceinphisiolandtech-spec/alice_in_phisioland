"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion"; // Dodano import Variants
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  important: boolean;
};

const ITEMS_PER_PAGE = 5; // Ile newsów na stronę

// Poprawione typowanie Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// Funkcja pomocnicza do formatowania daty
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const NewsFeed = ({ news }: { news: NewsItem[] }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Logika paginacji
  const totalPages = Math.ceil(news.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNews = news.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Opcjonalnie: Przewiń do góry listy po zmianie strony
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 pt-8">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        {/* --- NAGŁÓWEK --- */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#103830] text-center">
            Centrum Aktualności
          </h1>
          <p className="mt-2 text-gray-500 text-center">
            Wszystkie komunikaty i nowości w jednym miejscu.
          </p>
        </div>

        {/* --- LISTA AKTUALNOŚCI --- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          // Klucz zmienia się przy zmianie strony, co resetuje animację dla nowych elementów
          key={currentPage}
          className="flex flex-col gap-6"
        >
          {news.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                <Calendar size={32} />
              </div>
              <p>Brak aktualności do wyświetlenia.</p>
            </motion.div>
          ) : (
            currentNews.map((item) => (
              <motion.article
                key={item.id}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                {/* Ozdobny pasek po lewej stronie */}
                <div className="absolute left-0 top-0 h-full w-1.5 bg-[#D4F0C8] group-hover:bg-[#103830] transition-colors" />

                <div className="flex flex-col gap-4 pl-2">
                  {/* Data i Ikona */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#103830]">
                      <Clock size={18} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Treść */}
                  <div>
                    <h2 className="mb-2 text-xl font-bold text-gray-800 transition-colors group-hover:text-[#103830]">
                      {item.title}
                    </h2>
                    {/* whitespace-pre-wrap zachowuje akapity i entery z bazy danych */}
                    <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))
          )}
        </motion.div>

        {/* --- PAGINACJA --- */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-sm font-medium text-gray-600">
              Strona {currentPage} z {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
