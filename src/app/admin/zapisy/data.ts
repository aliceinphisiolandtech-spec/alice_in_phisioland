import type { WaitlistPage } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { resolveLayout, resolveTheme } from "@/lib/waitlist-appearance";
import {
  SUBSCRIBERS_PER_PAGE,
  type DailySignups,
  type WaitlistPageRow,
  type WaitlistSubscriberRow,
} from "./types";

/**
 * Ładowanie danych panelu kampanii.
 *
 * Osobny moduł, a nie ciało komponentu: odczyt bieżącego czasu (`Date.now`)
 * jest z definicji niedeterministyczny, a React wymaga, żeby renderowanie było
 * czyste — reguła `react-hooks/purity` wyłapuje to jako błąd. Granica „pobranie
 * danych" / „renderowanie" jest tu więc wymuszona przez lintera, ale i tak
 * chcielibyśmy ją mieć: dzięki niej strony są samym widokiem.
 */

/** Ile dni pokazuje wykres zapisów. */
const CHART_DAYS = 30;
/** Okno „czy kampania jeszcze żyje". */
const RECENT_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Klucz dnia w czasie warszawskim.
 *
 * Bez wymuszonej strefy `toISOString()` liczyłby doby według UTC, więc zapis
 * z 1:00 w nocy trafiałby do słupka z dnia poprzedniego. Przy kampanii, gdzie
 * najwięcej zapisów przychodzi wieczorem po opublikowaniu posta, to przesuwa
 * cały wykres.
 */
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Warsaw",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayLabelFormatter = new Intl.DateTimeFormat("pl-PL", {
  timeZone: "Europe/Warsaw",
  day: "2-digit",
  month: "2-digit",
});

/* -------------------------------------------------------------------------- */
/* Lista                                                                       */
/* -------------------------------------------------------------------------- */

export async function loadWaitlistCampaigns(): Promise<WaitlistPageRow[]> {
  const now = Date.now();
  const chartCutoff = new Date(now - CHART_DAYS * DAY_MS);

  const [pages, totals, unsynced, recentSubscribers] = await Promise.all([
    prisma.waitlistPage.findMany({ orderBy: { createdAt: "desc" } }),

    prisma.waitlistSubscriber.groupBy({
      by: ["pageId"],
      _count: { _all: true },
    }),

    // Kontakty, które nie doszły do MailerLite. Wyciągamy je do panelu, bo
    // inaczej problem z integracją jest widoczny wyłącznie w logach crona.
    prisma.waitlistSubscriber.groupBy({
      by: ["pageId"],
      where: { syncStatus: { in: ["pending", "failed"] } },
      _count: { _all: true },
    }),

    // Do wykresu i licznika „ostatnie 7 dni" wystarczą same znaczniki czasu —
    // nie ściągamy adresów, których panel i tak nie pokazuje.
    prisma.waitlistSubscriber.findMany({
      where: { createdAt: { gte: chartCutoff } },
      select: { pageId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalByPage = new Map(
    totals.map((row) => [row.pageId, row._count._all]),
  );
  const unsyncedByPage = new Map(
    unsynced.map((row) => [row.pageId, row._count._all]),
  );

  const signupsByPage = new Map<string, Date[]>();
  for (const subscriber of recentSubscribers) {
    const list = signupsByPage.get(subscriber.pageId);
    if (list) list.push(subscriber.createdAt);
    else signupsByPage.set(subscriber.pageId, [subscriber.createdAt]);
  }

  /*
   * Zapytanie na kampanię, a nie jedno wspólne: limit „ostatnie N" ma dotyczyć
   * KAŻDEJ listy z osobna, a `take` w jednym zapytaniu obciąłby wynik globalnie
   * i przy dwóch kampaniach druga wyszłaby pusta. Kampanii jest kilka, więc
   * kilka równoległych zapytań jest tańsze niż grupowanie po stronie SQL-a.
   */
  const subscribersByPage = await Promise.all(
    pages.map((page) => loadFirstSubscriberPage(page.id)),
  );

  return pages.map((page, index) =>
    toRow(page, {
      now,
      signups: signupsByPage.get(page.id) ?? [],
      total: totalByPage.get(page.id) ?? 0,
      unsynced: unsyncedByPage.get(page.id) ?? 0,
      subscribers: subscribersByPage[index],
    }),
  );
}

/**
 * Pierwsza strona zapisanych osób jednej kampanii, od najnowszej.
 *
 * Tylko pierwsza, bo tylko ona jest widoczna zaraz po wejściu — kolejne panel
 * dobiera z `/api/admin/waitlist/[id]/subscribers` dopiero wtedy, gdy ktoś
 * po nie kliknie. Dzięki temu wielkość odpowiedzi nie zależy od tego, jak
 * bardzo kampania się udała.
 */
async function loadFirstSubscriberPage(
  pageId: string,
): Promise<WaitlistSubscriberRow[]> {
  const rows = await prisma.waitlistSubscriber.findMany({
    where: { pageId },
    // Tylko to, co panel pokazuje. Treść zgody, IP i przeglądarka zostają
    // w bazie — do panelu nie mają po co jechać.
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      syncStatus: true,
    },
    orderBy: { createdAt: "desc" },
    take: SUBSCRIBERS_PER_PAGE,
  });

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/* Pojedyncza kampania (kreator)                                               */
/* -------------------------------------------------------------------------- */

/**
 * Jedna kampania do edycji. Statystyki liczymy tak samo jak na liście, choć
 * kreator ich nie pokazuje — dzięki temu obie trasy operują na identycznym
 * kształcie danych i formularz nie musi znać dwóch wariantów rekordu.
 */
export async function loadWaitlistCampaign(
  id: string,
): Promise<WaitlistPageRow | null> {
  const now = Date.now();
  const chartCutoff = new Date(now - CHART_DAYS * DAY_MS);

  const page = await prisma.waitlistPage.findUnique({ where: { id } });
  if (!page) return null;

  const [total, unsynced, signups, subscribers] = await Promise.all([
    prisma.waitlistSubscriber.count({ where: { pageId: id } }),
    prisma.waitlistSubscriber.count({
      where: { pageId: id, syncStatus: { in: ["pending", "failed"] } },
    }),
    prisma.waitlistSubscriber.findMany({
      where: { pageId: id, createdAt: { gte: chartCutoff } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    loadFirstSubscriberPage(id),
  ]);

  return toRow(page, {
    now,
    signups: signups.map((row) => row.createdAt),
    total,
    unsynced,
    subscribers,
  });
}

/* -------------------------------------------------------------------------- */

interface RowStats {
  now: number;
  signups: Date[];
  total: number;
  unsynced: number;
  subscribers: WaitlistSubscriberRow[];
}

function toRow(page: WaitlistPage, stats: RowStats): WaitlistPageRow {
  const recentCutoff = new Date(stats.now - RECENT_DAYS * DAY_MS);

  return {
    id: page.id,
    slug: page.slug,
    name: page.name,
    headline: page.headline,
    highlight: page.highlight,
    description: page.description,
    ctaLabel: page.ctaLabel,
    footnote: page.footnote,
    successTitle: page.successTitle,
    successMessage: page.successMessage,
    consentText: page.consentText,
    mailerliteGroupId: page.mailerliteGroupId,
    collectName: page.collectName,
    // Nieznana wartość w kolumnie (ręczna edycja w bazie, usunięty wariant)
    // spada na domyślną — panel ma się otworzyć, a nie wywalić.
    layoutVariant: resolveLayout(page.layoutVariant),
    theme: resolveTheme(page.theme),
    heroImageUrl: page.heroImageUrl,
    ogImageUrl: page.ogImageUrl,
    backgroundImageUrl: page.backgroundImageUrl,
    overlayOpacity: page.overlayOpacity,
    isActive: page.isActive,
    opensAt: page.opensAt?.toISOString() ?? null,
    closesAt: page.closesAt?.toISOString() ?? null,
    maxSignups: page.maxSignups,
    closedMessage: page.closedMessage,
    createdAt: page.createdAt.toISOString(),
    subscriberCount: stats.total,
    subscribers: stats.subscribers,
    recentCount: stats.signups.filter((date) => date >= recentCutoff).length,
    dailySignups: buildDailySeries(stats.signups, stats.now),
    unsyncedCount: stats.unsynced,
  };
}

/**
 * Zapisy -> słupki dzienne. Dni bez zapisów zostają z zerem, żeby przerwa
 * w kampanii była widoczna jako luka, a nie zniknęła z osi.
 */
function buildDailySeries(signups: Date[], now: number): DailySignups[] {
  const counts = new Map<string, number>();

  for (const date of signups) {
    const key = dayKeyFormatter.format(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const series: DailySignups[] = [];

  for (let offset = CHART_DAYS - 1; offset >= 0; offset -= 1) {
    const date = new Date(now - offset * DAY_MS);
    const key = dayKeyFormatter.format(date);

    series.push({
      date: key,
      label: dayLabelFormatter.format(date),
      count: counts.get(key) ?? 0,
    });
  }

  return series;
}
