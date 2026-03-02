import { prisma } from "@/lib/prisma";

import { BellRing } from "lucide-react";
import { NewsForm } from "./NewsForm";
import { NewsList } from "./NewsList";

export default async function AdminNewsPage() {
  // Pobieramy aktualności (najnowsze na górze)
  const news = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#0c493e] rounded-xl text-white">
          <BellRing size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Zarządzanie Aktualnościami
          </h1>
          <p className="text-gray-500 text-sm">
            Dodawaj powiadomienia widoczne dla kursantów.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {/* LEWA KOLUMNA: Formularz */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
            <h2 className="font-bold text-lg mb-4 text-[#0c493e]">
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
