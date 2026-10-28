import { prisma } from "@/lib/prisma";
import { MessageSquareQuote } from "lucide-react";
import { ReviewsList } from "./ReviewsList";
import { FEATURED_REVIEWS_LIMIT } from "@/lib/reviews";

// Opinie przychodzą na bieżąco od kursantek — zawsze świeża lista.
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, image: true } },
    },
  });

  const featuredCount = reviews.filter((r) => r.isFeatured).length;

  return (
    <div className="p-8 max-[768px]:p-0 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#0c493e] rounded-xl text-white">
          <MessageSquareQuote size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Zarządzanie Opiniami
          </h1>
          <p className="text-gray-500 text-sm">
            Wybierz, które opinie kursantek pojawią się na stronie głównej.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600 shadow-sm">
        Na stronie głównej:{" "}
        <strong className="text-[#0c493e]">{featuredCount}</strong>{" "}
        wyróżnionych. Wyświetla się maksymalnie {FEATURED_REVIEWS_LIMIT}{" "}
        najnowszych z nich.
      </div>

      <h2 className="font-bold text-lg mb-4 text-gray-700">
        Wszystkie opinie ({reviews.length})
      </h2>
      <ReviewsList
        reviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          headline: r.headline,
          text: r.text,
          role: r.role,
          isFeatured: r.isFeatured,
          createdAt: r.createdAt,
          authorName: r.user.name,
          authorEmail: r.user.email,
          authorImage: r.user.image,
        }))}
      />
    </div>
  );
}
