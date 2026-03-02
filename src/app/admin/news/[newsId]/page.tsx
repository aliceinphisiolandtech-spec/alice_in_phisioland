import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  BellRing,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

// 1. Zmiana typu: params to teraz Promise
interface PageProps {
  params: Promise<{
    newsId: string;
  }>;
}

export default async function NewsDetailPage(props: PageProps) {
  // 2. Awaitowanie params przed użyciem
  const params = await props.params;
  const { newsId } = params;

  const news = await prisma.news.findUnique({
    where: { id: newsId },
  });

  if (!news) {
    return notFound();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* NAGŁÓWEK / POWRÓT */}
      <div className="mb-8">
        <Link
          href="/admin/news"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#0c493e] transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Wróć do listy
        </Link>

        {/* KARTA SZCZEGÓŁÓW */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-start gap-5 mb-8">
            {/* Ikona */}
            <div className="h-12 w-12 bg-[#D4F0C8]/40 text-[#103830] rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <BellRing size={20} />
            </div>

            <div className="flex-1">
              {/* Tytuł */}
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                {news.title}
              </h1>

              {/* Metadane */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                  <Calendar size={12} />
                  {format(news.createdAt, "dd MMMM yyyy", { locale: pl })}
                </span>

                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                  <Clock size={12} />
                  {format(news.createdAt, "HH:mm", { locale: pl })}
                </span>

                {/* Badge PUSH */}
                {news.important && (
                  <span className="flex text-s items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100/50">
                    <AlertCircle size={12} />
                    Wysłano PUSH
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* TREŚĆ */}
          {/* whitespace-pre-wrap zachowuje akapity i entery z textarea */}
          <div className="prose prose-stone max-w-none text-gray-600 leading-relaxed text-base border-t border-gray-100 pt-8 whitespace-pre-wrap">
            {news.content}
          </div>
        </div>
      </div>
    </div>
  );
}
