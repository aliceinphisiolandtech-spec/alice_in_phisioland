"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar, MessageSquareQuote, Star, Trash2 } from "lucide-react";
import {
  deleteReviewAction,
  setReviewFeaturedAction,
} from "@/app/actions/admin-reviews";
import { cn } from "@/lib/utils/cn";

interface ReviewItem {
  id: string;
  rating: number;
  headline: string;
  text: string;
  role: string;
  isFeatured: boolean;
  createdAt: Date;
  authorName: string | null;
  authorEmail: string | null;
  authorImage: string | null;
}

export const ReviewsList = ({ reviews }: { reviews: ReviewItem[] }) => {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <MessageSquareQuote className="text-gray-300" size={24} />
        </div>
        <p className="text-gray-500 font-medium text-sm">Brak opinii</p>
        <p className="text-xs text-gray-400 mt-1">
          Opinie wystawiają kursantki z poziomu panelu kursanta.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
};

const ReviewCard = ({ review }: { review: ReviewItem }) => {
  const [isPending, startTransition] = useTransition();
  // Usuwanie dwuetapowe: pierwszy klik pyta, drugi usuwa.
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleFeatured = () => {
    startTransition(async () => {
      const res = await setReviewFeaturedAction(review.id, !review.isFeatured);
      if (res.error) toast.error(res.error);
      else
        toast.success(
          review.isFeatured
            ? "Opinia ukryta na stronie głównej"
            : "Opinia pokazana na stronie głównej",
        );
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const res = await deleteReviewAction(review.id);
      if (res.error) {
        toast.error(res.error);
        setConfirmDelete(false);
      } else toast.success("Opinia usunięta");
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 md:p-5 shadow-sm transition-opacity",
        review.isFeatured ? "border-[#0c493e]/30" : "border-gray-100",
        isPending && "opacity-60",
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* AUTORKA */}
        <div className="flex items-center gap-3 sm:w-56 shrink-0 min-w-0">
          {review.authorImage ? (
            <Image
              src={review.authorImage}
              alt=""
              width={40}
              height={40}
              className="rounded-full shrink-0"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#0c493e] text-white flex items-center justify-center font-bold">
              {review.authorName?.charAt(0) ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">
              {review.authorName ?? "Anonim"}
            </p>
            <p className="text-xs text-gray-500 truncate">{review.role}</p>
            <p className="text-xs text-gray-400 truncate">
              {review.authorEmail}
            </p>
          </div>
        </div>

        {/* TREŚĆ */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
            <div
              className="flex"
              aria-label={`Ocena ${review.rating} na 5`}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i < review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200"
                  }
                />
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
              <Calendar size={10} />
              {format(review.createdAt, "dd MMM yyyy, HH:mm", { locale: pl })}
            </p>
          </div>
          <p className="font-bold text-[#0c493e]">{review.headline}</p>
          <p className="mt-1 text-sm text-gray-600 whitespace-pre-line break-words">
            {review.text}
          </p>
        </div>

        {/* AKCJE */}
        <div className="flex sm:flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleFeatured}
            disabled={isPending}
            aria-pressed={review.isFeatured}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap",
              review.isFeatured
                ? "bg-[#0c493e] text-white hover:bg-[#0a3d33]"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            )}
          >
            {review.isFeatured ? "Na stronie głównej" : "Pokaż na stronie"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            disabled={isPending}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap",
              confirmDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "text-red-600 hover:bg-red-50",
            )}
          >
            <Trash2 size={14} />
            {confirmDelete ? "Na pewno usunąć?" : "Usuń"}
          </button>
        </div>
      </div>
    </div>
  );
};
