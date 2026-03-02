import { prisma } from "@/lib/prisma";
import { NewsFeed } from "@/components/panel-kursanta/news/NewsFeed"; // Upewnij się co do ścieżki

export const dynamic = "force-dynamic"; // Żeby zawsze pobierało świeże newsy

export default async function NewsPage() {
  // 1. Pobieramy WSZYSTKIE newsy
  const allNews = await prisma.news.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // 2. Przekazujemy do klienta
  return <NewsFeed news={allNews} />;
}
