import { prisma } from "@/lib/prisma";
import {
  describeRetention,
  resolveRetention,
  retentionCutoff,
  retentionWarningCutoff,
} from "@/lib/waitlist-retention";

/**
 * Zapisy wymagające uwagi ze względu na okres przechowywania.
 *
 * Osobny moduł od komponentu, bo odczyt bieżącego czasu jest z definicji
 * niedeterministyczny, a renderowanie w Reakcie ma być czyste.
 */

/** Ile pozycji pokazujemy na liście w panelu. */
const LIST_LIMIT = 100;

export interface RetentionEntry {
  id: string;
  email: string;
  /** Nazwa kampanii, z której pochodzi zapis. */
  campaign: string;
  /** Data zapisu w formacie ISO. */
  signedUpAt: string;
  /** Termin usunięcia w formacie ISO. */
  deleteAt: string;
  daysLeft: number;
  status: "due" | "soon";
  /** Gotowy tekst: „14 dni po terminie" / „zostaje 12 dni". */
  label: string;
  /** Czy ten zapis poszedł kiedykolwiek do MailerLite. */
  inMailerlite: boolean;
}

export interface RetentionOverview {
  /** Ile adresów przekroczyło termin. */
  dueCount: number;
  /** Ile zbliża się do terminu. */
  soonCount: number;
  /** Najbliższy termin usunięcia spośród wszystkich zapisów (ISO) albo null. */
  nextDeadline: string | null;
  /** Lista do wyświetlenia, najpilniejsze najpierw. */
  entries: RetentionEntry[];
  /** Czy lista została ucięta — wtedy panel mówi o tym wprost. */
  truncated: boolean;
}

export async function loadRetentionOverview(): Promise<RetentionOverview> {
  const now = new Date();
  const dueCutoff = retentionCutoff(now);
  const warningCutoff = retentionWarningCutoff(now);

  const [dueCount, soonCount, rows, nextRow] = await Promise.all([
    prisma.waitlistSubscriber.count({
      where: { createdAt: { lt: dueCutoff } },
    }),

    prisma.waitlistSubscriber.count({
      where: { createdAt: { gte: dueCutoff, lt: warningCutoff } },
    }),

    // Do listy bierzemy tylko to, co wymaga uwagi — reszta adresów nie ma
    // po co jechać przez granicę serwer/klient.
    prisma.waitlistSubscriber.findMany({
      where: { createdAt: { lt: warningCutoff } },
      orderBy: { createdAt: "asc" },
      take: LIST_LIMIT,
      select: {
        id: true,
        email: true,
        createdAt: true,
        syncStatus: true,
        page: { select: { name: true } },
      },
    }),

    // Najbliższy termin liczymy z NAJSTARSZEGO zapisu w ogóle — także wtedy,
    // gdy do terminu zostały jeszcze lata. Dzięki temu panel zawsze potrafi
    // odpowiedzieć „kiedy następny raz", a nie tylko „teraz nic nie trzeba".
    prisma.waitlistSubscriber.findFirst({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  const entries: RetentionEntry[] = rows.map((row) => {
    const verdict = resolveRetention(row.createdAt, now);

    return {
      id: row.id,
      email: row.email,
      campaign: row.page.name,
      signedUpAt: row.createdAt.toISOString(),
      deleteAt: verdict.deleteAt.toISOString(),
      daysLeft: verdict.daysLeft,
      status: verdict.status === "due" ? "due" : "soon",
      label: describeRetention(verdict),
      // "synced" znaczy, że kontakt realnie tam trafił. Pozostałe stany
      // (pending/failed/skipped) znaczą, że nie doszedł — wtedy nie ma czego
      // kasować po tamtej stronie i nie ma sensu tego sugerować.
      inMailerlite: row.syncStatus === "synced",
    };
  });

  return {
    dueCount,
    soonCount,
    nextDeadline: nextRow
      ? resolveRetention(nextRow.createdAt, now).deleteAt.toISOString()
      : null,
    entries,
    truncated: rows.length === LIST_LIMIT,
  };
}
