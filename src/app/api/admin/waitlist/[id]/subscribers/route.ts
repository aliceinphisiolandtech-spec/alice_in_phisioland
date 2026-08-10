import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIBERS_PER_PAGE } from "@/app/admin/zapisy/types";

/**
 * Jedna strona listy zapisanych osób — do przewijania listy w panelu.
 *
 * Trasa, a nie server action: to jest zwykły odczyt, który ma się wykonać przy
 * kliknięciu „następna" i nic w systemie nie zmienia. Server action
 * unieważniałby przy okazji cache trasy i przeładowywał całą stronę panelu,
 * żeby podmienić dwadzieścia wierszy.
 *
 * Zwracamy TE SAME pola co pierwsza strona renderowana na serwerze (patrz
 * `admin/zapisy/data.ts`) — bez treści zgody, adresu IP i przeglądarki.
 * Komplet wymagany przy RODO wychodzi wyłącznie eksportem do CSV.
 */

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 403 });
  }

  const { id } = await params;

  /*
   * Numer strony z adresu bywa czymkolwiek („abc", „-3", „1e9”). Zamiast
   * odrzucać żądanie, sprowadzamy go do sensownej wartości: przy podejrzanym
   * wejściu panel ma pokazać pierwszą stronę, a nie komunikat o błędzie.
   */
  const requested = Number(new URL(request.url).searchParams.get("page"));
  const page =
    Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;

  const [total, items] = await Promise.all([
    prisma.waitlistSubscriber.count({ where: { pageId: id } }),
    prisma.waitlistSubscriber.findMany({
      where: { pageId: id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        syncStatus: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * SUBSCRIBERS_PER_PAGE,
      take: SUBSCRIBERS_PER_PAGE,
    }),
  ]);

  return NextResponse.json(
    {
      total,
      page,
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    },
    // Lista rośnie z minuty na minutę — odpowiedź nie ma czego cachować.
    { headers: { "Cache-Control": "no-store" } },
  );
}
