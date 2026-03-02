"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Lock, PlayCircle, ShoppingCart, RotateCcw, Star } from "lucide-react";
import { ReviewInline } from "./ReviewInline";
import { toast } from "sonner";
import { resetUserProgressAction } from "@/app/actions/progress";

interface CourseProgressCardProps {
  hasAccess: boolean;
  progressPercent: number;
  lastChapterSlug: string | null;
  hasReviewed: boolean;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export const CourseProgressCard = ({
  hasAccess,
  progressPercent,
  lastChapterSlug,
  hasReviewed,
}: CourseProgressCardProps) => {
  const [isReviewMode, setIsReviewMode] = useState(false);

  const [isPending, startTransition] = useTransition();
  // Funkcja resetująca postęp (mockup)
  const handleResetProgress = () => {
    if (confirm("Czy na pewno chcesz wyzerować postęp czytania?")) {
      startTransition(async () => {
        const res = await resetUserProgressAction();

        if (res.success) {
          toast.success("Postęp został wyzerowany.");
          // Nie musisz nic więcej robić - revalidatePath w akcji odświeży ten komponent
        } else {
          toast.error(res.error || "Nie udało się zresetować postępu.");
        }
      });
    }
  };

  const readerLink = lastChapterSlug
    ? `/panel-kursanta/czytnik/${lastChapterSlug}`
    : `/panel-kursanta/czytnik`;

  return (
    <motion.section
      variants={itemVariants}
      layout // To odpowiada za płynną zmianę wysokości kontenera
      transition={{
        layout: { duration: 0.3, type: "spring", stiffness: 300, damping: 30 },
      }}
      className="relative overflow-hidden rounded-3xl bg-[#103830] p-6 text-white shadow-xl shadow-[#103830]/20 group"
    >
      {/* Dekoracyjne tło - jako osobny element, żeby nie wpływało na layout */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[#D4F0C8]/5 blur-3xl transition-all group-hover:bg-[#D4F0C8]/10" />
      </div>

      {/* Kontener treści z z-index, żeby był nad tłem */}
      <motion.div layout className="relative z-10 flex flex-col gap-6">
        <AnimatePresence mode="wait" initial={false}>
          {!isReviewMode ? (
            <motion.div
              key="progress-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* 1. GÓRNA BELKA */}
              <div className="flex justify-between items-start">
                <span className="bg-white/10 text-[#D4F0C8] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                  {hasAccess ? "Twój postęp" : "Brak dostępu"}
                </span>
                {!hasAccess && <Lock className="text-white/50 w-5 h-5" />}
              </div>

              {/* 2. GŁÓWNA TREŚĆ */}
              <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
                {/* LEWA STRONA */}
                <div className="flex-1 flex flex-col gap-4">
                  <h2 className="text-xl md:text-2xl font-bold leading-tight max-w-2xl">
                    Fizjoterapeutyczna diagnostyka zróżnicowana w ujęciu
                    klinicznym
                  </h2>

                  {hasAccess ? (
                    <div className="w-full flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-medium text-gray-300">
                        <span>
                          {progressPercent === 100
                            ? "Przeczytano całość!"
                            : "Przeczytano"}
                        </span>
                        <span className="text-[#D4F0C8] font-mono">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-[#D4F0C8]"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300">
                      Kup dostęp, aby rozpocząć czytanie i śledzić swoje
                      postępy.
                    </p>
                  )}
                </div>

                {/* PRAWA STRONA - Przyciski */}
                <div className="w-full md:w-auto shrink-0 flex flex-col gap-3">
                  {hasAccess ? (
                    <>
                      {progressPercent === 100 ? (
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                          <Link
                            href={readerLink}
                            className="flex text-sm items-center justify-center gap-2 bg-[#D4F0C8] hover:bg-[#c1e8b0] text-[#103830] font-bold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-black/10 w-full"
                          >
                            <PlayCircle
                              size={16}
                              className="fill-[#103830] text-[#D4F0C8]"
                            />
                            Wróć do e-booka
                          </Link>
                          <div className="flex gap-2">
                            {!hasReviewed && (
                              <button
                                onClick={() => setIsReviewMode(true)}
                                className="flex-1 text-sm flex items-center cursor-pointer justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors"
                              >
                                <Star size={14} />
                                Oceń
                              </button>
                            )}
                            <button
                              onClick={handleResetProgress}
                              className="flex-1 text-sm flex items-center  cursor-pointer justify-center gap-2 bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-200 text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors"
                            >
                              <RotateCcw size={14} />
                              Reset
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={readerLink}
                          className="flex items-center text-sm justify-center gap-2 bg-[#D4F0C8] hover:bg-[#c1e8b0] text-[#103830] font-bold py-3 px-6 rounded-xl transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-black/10 w-full md:w-auto"
                        >
                          <PlayCircle
                            size={18}
                            className="fill-[#103830] text-[#D4F0C8]"
                          />
                          {progressPercent > 0
                            ? "Kontynuuj czytanie"
                            : "Rozpocznij czytanie"}
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link
                      href="/zakup"
                      className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-[#D4F0C8] px-6 py-3 text-sm font-bold text-[#103830] transition-transform active:scale-95 hover:bg-[#c1e8b0] shadow-lg shadow-black/10"
                    >
                      <ShoppingCart size={16} />
                      Kup za 149 zł
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="review-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <ReviewInline onClose={() => setIsReviewMode(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
};
