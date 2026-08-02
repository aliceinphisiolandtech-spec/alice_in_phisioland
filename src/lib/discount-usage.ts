import { prisma } from "@/lib/prisma";
import { notifyDiscountExhausted } from "@/lib/notifications";

/**
 * Naliczanie zużycia limitu — wspólne dla kodów rabatowych, przecen i zniżek
 * dla puli maili. Wołane z webhooka PO potwierdzonej płatności, nigdy przy
 * rozpoczęciu checkoutu (porzucone koszyki nie mogą zjadać puli).
 *
 * Gdy licznik dobije do limitu, admin dostaje powiadomienie. Prawo do wysyłki
 * "rezerwujemy" atomowym `updateMany` po `exhaustedNotifiedAt: null` — przy
 * dwóch webhookach obsługiwanych równolegle push pójdzie dokładnie raz.
 */

export type DiscountKind = "code" | "sale" | "email";

const LABELS: Record<DiscountKind, string> = {
  code: "Kod rabatowy",
  sale: "Przecena",
  email: "Zniżka dla wybranych osób",
};

interface UsageRow {
  name: string;
  usageLimit: number | null;
  usedCount: number;
}

/** Podbija licznik i zwraca stan po inkremencie. */
async function increment(
  kind: DiscountKind,
  id: string,
): Promise<UsageRow | null> {
  if (kind === "code") {
    const row = await prisma.discountCode.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });
    return {
      name: row.code,
      usageLimit: row.usageLimit,
      usedCount: row.usedCount,
    };
  }

  if (kind === "sale") {
    const row = await prisma.sale.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });
    return {
      name: row.name,
      usageLimit: row.usageLimit,
      usedCount: row.usedCount,
    };
  }

  const row = await prisma.emailDiscount.update({
    where: { id },
    data: { usedCount: { increment: 1 } },
  });
  return {
    name: row.name,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
  };
}

/** Atomowo rezerwuje prawo do wysłania powiadomienia o wyczerpaniu. */
async function claimExhaustedNotification(
  kind: DiscountKind,
  id: string,
): Promise<boolean> {
  const where = { id, exhaustedNotifiedAt: null };
  const data = { exhaustedNotifiedAt: new Date() };

  const result =
    kind === "code"
      ? await prisma.discountCode.updateMany({ where, data })
      : kind === "sale"
        ? await prisma.sale.updateMany({ where, data })
        : await prisma.emailDiscount.updateMany({ where, data });

  return result.count === 1;
}

export async function registerDiscountUsage(kind: DiscountKind, id: string) {
  try {
    const row = await increment(kind, id);
    if (!row) return;

    const isExhausted =
      row.usageLimit !== null && row.usedCount >= row.usageLimit;

    if (!isExhausted) return;

    if (await claimExhaustedNotification(kind, id)) {
      await notifyDiscountExhausted({
        label: LABELS[kind],
        name: row.name,
        usedCount: row.usedCount,
        usageLimit: row.usageLimit ?? 0,
      });
    }
  } catch (error) {
    // Nie wywracamy webhooka — klientka zapłaciła i musi dostać dostęp.
    console.error(
      `⚠️ Nie udało się naliczyć zużycia (${kind}, id=${id}):`,
      error,
    );
  }
}
