"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteMailerliteSubscriber,
  findMailerliteSubscriber,
  isMailerliteConfigured,
  removeMailerliteSubscriberFromGroup,
} from "@/lib/mailerlite";
import { retentionCutoff } from "@/lib/waitlist-retention";

/**
 * Usuwanie adresów, którym minął zadeklarowany okres przechowywania.
 *
 * Uruchamiane RĘCZNIE z panelu, nigdy automatycznie. Powód: kasowanie jest
 * nieodwracalne i dotyczy dwóch miejsc naraz (nasza baza i konto MailerLite),
 * a automat, który zrobiłby tylko połowę, zostawiłby złudzenie porządku.
 * Panel liczy i przypomina — decyzję podejmuje administratorka.
 */

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") return null;
  return session;
}

/** Co się stało z jednym adresem — panel zamienia to na zdanie po polsku. */
export type RetentionCleanupOutcome =
  /** Usunięty u nas i całkowicie z MailerLite. */
  | "removed_everywhere"
  /** Usunięty u nas, w MailerLite tylko wypisany z grupy tej kampanii. */
  | "removed_from_group"
  /** Usunięty u nas; w MailerLite go nie było. */
  | "removed_locally"
  /** Usunięty u nas, ale MailerLite nie odpowiedział — wymaga ręcznej kontroli. */
  | "mailerlite_failed";

export interface RetentionCleanupResult {
  outcome: RetentionCleanupOutcome;
  email: string;
  /** Wypełnione tylko przy "mailerlite_failed". */
  message?: string;
}

/**
 * Usuwa jeden przeterminowany zapis.
 *
 * Kolejność jest przemyślana: NAJPIERW MailerLite, POTEM nasza baza. Gdyby było
 * odwrotnie, nieudana wysyłka do MailerLite zostawiłaby adres na jej liście bez
 * żadnego śladu u nas — czyli dane przetwarzane dalej, a my bez wiedzy, czyje
 * one są. Przy tej kolejności najgorszy przypadek to adres usunięty z listy,
 * ale wciąż widoczny w panelu, więc próbę da się powtórzyć.
 *
 * W MailerLite kasujemy kontakt w całości TYLKO wtedy, gdy nie należy do żadnej
 * innej grupy. Osoba, która kupiła e-book, jest na liście klientek na innej
 * podstawie prawnej — wygaśnięcie zgody na listę oczekujących nie kasuje tamtej.
 */
export async function deleteExpiredSubscriberAction(
  subscriberId: string,
): Promise<{ error?: string; result?: RetentionCleanupResult }> {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const subscriber = await prisma.waitlistSubscriber.findUnique({
    where: { id: subscriberId },
    include: { page: { select: { mailerliteGroupId: true } } },
  });

  if (!subscriber) {
    // Ktoś zdążył usunąć ten rekord (druga karta, drugi przebieg) — cel
    // osiągnięty, nie ma powodu straszyć błędem.
    return { result: { outcome: "removed_locally", email: "" } };
  }

  const cleanup = await removeFromMailerlite(
    subscriber.email,
    subscriber.page.mailerliteGroupId,
  );

  await prisma.waitlistSubscriber.delete({ where: { id: subscriberId } });

  revalidatePath("/admin");
  revalidatePath("/admin/zapisy");

  return { result: { ...cleanup, email: subscriber.email } };
}

/** Usuwa wszystkie zapisy po terminie. Zwraca rozbicie na wyniki. */
export async function deleteAllExpiredSubscribersAction(): Promise<{
  error?: string;
  results?: RetentionCleanupResult[];
}> {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const expired = await prisma.waitlistSubscriber.findMany({
    where: { createdAt: { lt: retentionCutoff() } },
    include: { page: { select: { mailerliteGroupId: true } } },
    // Porcja na jedno kliknięcie. Przy większej liczbie żądanie do MailerLite
    // przekroczyłoby limit czasu funkcji serwerowej — lepiej kilka kliknięć
    // z widocznym postępem niż jedno, które się urywa w połowie.
    take: 50,
  });

  const results: RetentionCleanupResult[] = [];

  for (const subscriber of expired) {
    const cleanup = await removeFromMailerlite(
      subscriber.email,
      subscriber.page.mailerliteGroupId,
    );

    await prisma.waitlistSubscriber.delete({ where: { id: subscriber.id } });
    results.push({ ...cleanup, email: subscriber.email });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/zapisy");

  return { results };
}

/* -------------------------------------------------------------------------- */

async function removeFromMailerlite(
  email: string,
  groupId: string | null,
): Promise<{ outcome: RetentionCleanupOutcome; message?: string }> {
  if (!isMailerliteConfigured()) {
    return { outcome: "removed_locally" };
  }

  const found = await findMailerliteSubscriber(email);

  if (!found.ok) {
    return { outcome: "mailerlite_failed", message: found.message };
  }

  if (!found.data) {
    return { outcome: "removed_locally" };
  }

  const otherGroups = found.data.groupIds.filter((id) => id !== groupId);

  // Osoba jest jeszcze gdzie indziej — kasujemy tylko powiązanie z tą kampanią.
  if (otherGroups.length > 0 && groupId) {
    const removed = await removeMailerliteSubscriberFromGroup(
      found.data.id,
      groupId,
    );

    return removed.ok
      ? { outcome: "removed_from_group" }
      : { outcome: "mailerlite_failed", message: removed.message };
  }

  const deleted = await deleteMailerliteSubscriber(found.data.id);

  return deleted.ok
    ? { outcome: "removed_everywhere" }
    : { outcome: "mailerlite_failed", message: deleted.message };
}
