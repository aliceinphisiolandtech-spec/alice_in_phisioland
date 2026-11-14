import { prisma } from "@/lib/prisma";

import { BellRing } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { HeaderStat } from "@/components/admin/ui/HeaderStat";
import { NewsForm } from "./NewsForm";
import { NewsList } from "./NewsList";

export default async function AdminNewsPage() {
  // Pobieramy aktualności (najnowsze na górze)
  const news = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        icon={<BellRing size={24} />}
        eyebrow="Treści"
        title="Zarządzanie aktualnościami"
        description="Dodawaj powiadomienia widoczne dla kursantów w ich panelu."
        actions={<HeaderStat value={news.length} label="opublikowanych" />}
      />

      <div className="flex flex-col gap-12">
        {/* LEWA KOLUMNA: Formularz */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
            <h2 className="mb-4 text-lg font-bold text-[#0c493e]">
              Dodaj nową
            </h2>
            <NewsForm />
          </div>
        </div>

        {/* PRAWA KOLUMNA: Lista */}
        <div className="lg:col-span-2">
          <h2 className="font-bold text-lg mb-4 text-gray-700">
            Ostatnie aktualności ({news.length})
          </h2>
          <NewsList news={news} />
        </div>
      </div>
    </div>
  );
}
