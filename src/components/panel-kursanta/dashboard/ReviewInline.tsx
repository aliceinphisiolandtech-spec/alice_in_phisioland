// components/panel-kursanta/ReviewInline.tsx
"use client";

import { useState, useTransition } from "react";
import { Star, X, Send } from "lucide-react";

import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/LoadingButton"; // Twój komponent
import { createReviewAction } from "@/app/actions/review";

interface ReviewInlineProps {
  onClose: () => void;
}

export const ReviewInline = ({ onClose }: ReviewInlineProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Zaznacz liczbę gwiazdek!");
      return;
    }

    startTransition(async () => {
      const res = await createReviewAction(rating, comment);
      if (res.success) {
        toast.success("Dzięki za opinię!");
        onClose();
      } else {
        toast.error(res.error);
      }
    });
  };
  const incompleteData = !comment && rating === 0;
  return (
    <div className="w-full animate-in fade-in duration-300 flex flex-col gap-4">
      {/* NAGŁÓWEK KARTY Z X */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white">Jak Ci się podobało?</h2>
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

      {/* GWIAZDKI */}
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
              fill={star <= (hoverRating || rating) ? "#FACC15" : "transparent"} // Żółty lub przezroczysty
              className={`transition-colors duration-200 cursor-pointer ${
                star <= (hoverRating || rating)
                  ? "text-contrast fill-contrast"
                  : "text-gray-500"
              }`}
            />
          </button>
        ))}
      </div>

      {/* TEXTAREA (Dostosowana do ciemnego tła) */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Napisz co myślisz ..."
        className="w-full h-24 p-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-gray-400 focus:border-[#D4F0C8] focus:ring-1 focus:ring-[#D4F0C8] outline-none resize-none text-md transition-all"
      />

      {/* BUTTONY */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          disabled={isPending || incompleteData}
          className={`px-4 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors cursor-pointer`}
        >
          Anuluj
        </button>

        <div className="w-32">
          <LoadingButton
            onClick={handleSubmit}
            isLoading={isPending}
            variant="primary"
            // Nadpisujemy style, żeby pasowały do ciemnej karty (np. białe tło przycisku lub jasny zielony)
            className={`w-full font-semibold text-sm rounded-xl bg-[#D4F0C8] text-[#103830] hover:bg-white border-none  ${isPending || (incompleteData && "cursor-none pointer-events-none grayscale-100 opacity-50")}`}
          >
            Wyślij
            <Send size={17} className="" />
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};
