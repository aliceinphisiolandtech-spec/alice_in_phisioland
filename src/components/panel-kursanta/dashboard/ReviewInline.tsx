// components/panel-kursanta/ReviewInline.tsx
"use client";

import { useState, useTransition } from "react";
import { Star, X, Send } from "lucide-react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { createReviewAction } from "@/app/actions/review";

interface ReviewData {
  rating: number;
  headline: string;
  text: string;
  role: string;
}

interface ReviewInlineProps {
  onClose: () => void;
  existingReview?: ReviewData | null;
}

const MAX_HEADLINE_LENGTH = 30; // Limit dla nagłówka
const MAX_TEXT_LENGTH = 250; // Limit dla treści

export const ReviewInline = ({
  onClose,
  existingReview,
}: ReviewInlineProps) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [headline, setHeadline] = useState(existingReview?.headline || "");
  const [role, setRole] = useState(existingReview?.role || "");
  const [text, setText] = useState(existingReview?.text || "");

  const [hoverRating, setHoverRating] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Zaznacz liczbę gwiazdek!");
      return;
    }

    startTransition(async () => {
      onClose();

      const res = await createReviewAction(rating, headline, text, role);

      if (res.success) {
        toast.success(
          existingReview ? "Zaktualizowano opinię!" : "Dzięki za opinię!",
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  const incompleteData =
    !headline.trim() || !text.trim() || !role.trim() || rating === 0;

  return (
    <div className="w-full animate-in fade-in duration-300 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white">
            {existingReview ? "Edytuj swoją opinię" : "Jak Ci się podobało?"}
          </h2>
          <p className="text-sm max-w-[90%] text-gray-300 ">
            Twoja opinia pomaga nam tworzyć lepsze materiały!
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="transition-transform hover:scale-110 focus:outline-none"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              size={26}
              fill={star <= (hoverRating || rating) ? "#FACC15" : "transparent"}
              className={`transition-colors duration-200 cursor-pointer ${
                star <= (hoverRating || rating)
                  ? "text-contrast fill-contrast"
                  : "text-gray-500"
              }`}
            />
          </button>
        ))}
      </div>

      {/* KRÓTKI NAGŁÓWEK Z LICZNIKIEM */}
      <div className="flex flex-col gap-1.5">
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Tytuł opinii (np. Super książka!)"
          className="w-full p-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-gray-400 focus:border-[#D4F0C8] focus:ring-1 focus:ring-[#D4F0C8] outline-none font-bold text-sm transition-all"
          maxLength={MAX_HEADLINE_LENGTH}
        />
        <div className="flex justify-end">
          <span
            className={`text-xs font-medium ${
              headline.length >= MAX_HEADLINE_LENGTH
                ? "text-red-400"
                : "text-gray-500"
            }`}
          >
            {headline.length} / {MAX_HEADLINE_LENGTH}
          </span>
        </div>
      </div>

      {/* ZAWÓD / TYTUŁ NAUKOWY */}
      <input
        type="text"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Kim jesteś? (np. Studentka fizjoterapii, Osteopata)"
        className="w-full p-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-gray-400 focus:border-[#D4F0C8] focus:ring-1 focus:ring-[#D4F0C8] outline-none text-sm transition-all"
        maxLength={40}
      />

      {/* PEŁNA TREŚĆ Z LICZNIKIEM */}
      <div className="flex flex-col gap-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napisz co myślisz..."
          maxLength={MAX_TEXT_LENGTH}
          className="w-full h-24 p-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-gray-400 focus:border-[#D4F0C8] focus:ring-1 focus:ring-[#D4F0C8] outline-none resize-none text-sm transition-all"
        />
        <div className="flex justify-end">
          <span
            className={`text-xs font-medium ${
              text.length >= MAX_TEXT_LENGTH ? "text-red-400" : "text-gray-500"
            }`}
          >
            {text.length} / {MAX_TEXT_LENGTH}
          </span>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-2">
        <button
          onClick={onClose}
          disabled={isPending}
          className={`px-4 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors cursor-pointer ${isPending && "opacity-50 pointer-events-none"}`}
        >
          Anuluj
        </button>

        <div className="w-32">
          <LoadingButton
            onClick={handleSubmit}
            isLoading={false}
            variant="primary"
            className={`w-full font-semibold text-sm rounded-xl bg-[#D4F0C8] text-[#103830] hover:bg-white border-none transition-all ${
              incompleteData || isPending
                ? "cursor-not-allowed grayscale-[80%] opacity-60"
                : "cursor-pointer"
            }`}
          >
            {existingReview ? "Zapisz" : "Wyślij"}
            <Send size={17} className="ml-1" />
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};
