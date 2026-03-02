// app/panel-kursanta/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/panel-kursanta/dashboard/DashboardClient";
import { getUserReadingStats } from "../actions/progress";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.id) {
    redirect("/logowanie");
  }

  // 1. Sprawdzamy zakup
  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: "ebook-tom-1",
      },
    },
  });

  const existingReview = await prisma.review.findFirst({
    where: {
      userId: session.user.id,
    },
  });
  // 2. Pobieramy statystyki czytania (Dla paska postępu)
  // Funkcja zwraca obiekt { percent: number, lastSlug: string | null }
  const stats = await getUserReadingStats(session.user.id);

  return (
    <DashboardClient
      userName={session.user.name || "Kursancie"}
      hasAccess={!!purchase}
      // Przekazujemy pobrane dane do Client Componentu
      progressPercent={stats.percent}
      lastChapterSlug={stats.lastSlug}
      hasReviewed={!!existingReview}
    />
  );
}
