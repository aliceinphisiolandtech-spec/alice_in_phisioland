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
  const userOrderWithInvoice = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: "succeeded",
      fakturowniaId: { not: null },
    },
  });
  const hasInvoice = !!userOrderWithInvoice;
  const existingReview = await prisma.review.findFirst({
    where: {
      userId: session.user.id,
    },
  });
  const latestNews = await prisma.news.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 2, // <--- Pobieramy dwa
  });
  // 2. Pobieramy statystyki czytania (Dla paska postępu)
  // Funkcja zwraca obiekt { percent: number, lastSlug: string | null }
  const stats = await getUserReadingStats(session.user.id);
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isFirstLogin: true },
    });

    if (user?.isFirstLogin) {
      // 1. Gasimy flagę w bazie
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isFirstLogin: false },
      });

      // 2. Przekierowujemy, dodając nasz parametr (np. welcome=true)
      // Zabezpieczenie: Jeśli chcesz tu zachować jakieś parametry,
      // bezpieczniej jest przenieść tę logikę do page.tsx,
      // ale jeśli to ma działać globalnie po prostu ładujemy panel-kursanta.
      redirect("/panel-kursanta?success=true");
    }
  }
  return (
    <DashboardClient
      userName={session.user.name || "Kursancie"}
      hasAccess={!!purchase}
      // Przekazujemy pobrane dane do Client Componentu
      progressPercent={stats.percent}
      lastChapterSlug={stats.lastSlug}
      hasReviewed={!!existingReview}
      latestNews={latestNews}
      hasInvoice={hasInvoice}
    />
  );
}
