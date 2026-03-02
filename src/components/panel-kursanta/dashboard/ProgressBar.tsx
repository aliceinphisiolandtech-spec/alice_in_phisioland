// components/panel-kursanta/ProgressBar.tsx
"use client";

import Link from "next/link";
import { Play, RotateCcw, Star } from "lucide-react";
import React, { useTransition } from "react";

import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { resetUserProgressAction } from "@/app/actions/progress";

interface ProgressBarProps {
  progressPercent: number;
  lastChapterSlug: string | null;
  onOpenReview: () => void; // <--- NOWY PROP
}

export const ProgressBar = ({
  progressPercent,
  lastChapterSlug,
  onOpenReview,
}: ProgressBarProps) => {
  const [isPending, startTransition] = useTransition();

  const targetSlug = lastChapterSlug || "00-start";
  const isCompleted = progressPercent === 100;

  const handleReset = () => {
    if (!confirm("Czy na pewno chcesz wyzerować cały postęp nauki?")) return;
    startTransition(async () => {
      const res = await resetUserProgressAction();
      if (res.success) {
        toast.success("Postęp został wyzerowany.");
      } else {
        toast.error("Wystąpił błąd.");
      }
    });
  };

  return (
    <div className="animate-in fade-in duration-300 flex flex-col gap-6">
      <div className="">
        <div className="flex justify-between text-md font-medium text-white mb-1.5">
          <span>Postęp czytania</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#D4F0C8] transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isCompleted && (
        <div className="grid grid-cols-2 gap-3  animate-in fade-in slide-in-from-top-2 duration-500">
          {/* Button otwiera formularz w miejscu contentu */}
          <button
            onClick={onOpenReview}
            className="flex items-center justify-center cursor-pointer gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
          >
            <Star size={18} className="text-contrast fill-contrast" />
            Wystaw opinię
          </button>

          <LoadingButton
            onClick={handleReset}
            isLoading={isPending}
            variant="primary"
            className="w-full rounded-xl bg-white/10 border-none shadow-none hover:bg-white/20 text-sm font-bold"
          >
            <RotateCcw size={18} />
            Wyzeruj
          </LoadingButton>
        </div>
      )}

      <Link
        href={`/panel-kursanta/czytnik/${targetSlug}`}
        className="flex w-full items-center justify-center gap-2 rounded-2xl -mt-4 bg-[#D4F0C8] py-3.5 text-sm font-bold text-primary fill-primary transition-transform active:scale-95 pointer-cursor hover:bg-white"
      >
        <Play size={18} />
        {progressPercent > 0 ? "Wznów czytanie" : "Rozpocznij czytanie"}
      </Link>
    </div>
  );
};
