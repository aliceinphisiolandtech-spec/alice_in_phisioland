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

  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_productId: { userId: session.user.id, productId: "ebook-tom-1" },
    },
  });

  const userOrderWithInvoice = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: "succeeded",
      fakturowniaId: { not: null },
    },
  });

  const existingReview = await prisma.review.findFirst({
    where: { userId: session.user.id },
  });

  const latestNews = await prisma.news.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  const stats = await getUserReadingStats(session.user.id);

  return (
    <DashboardClient
      userName={session.user.name || "Kursancie"}
      hasAccess={!!purchase}
      progressPercent={stats.percent}
      lastChapterSlug={stats.lastSlug}
      existingReview={existingReview} // <-- ZMIANA: Przekazujemy cały obiekt pobrany z bazy (lub null)
      latestNews={latestNews}
      hasInvoice={!!userOrderWithInvoice}
    />
  );
}
