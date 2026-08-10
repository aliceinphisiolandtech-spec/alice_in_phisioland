"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  SaveEmailDiscountSchema,
  parseEmailList,
  type SaveEmailDiscountInput,
} from "@/lib/validators/discounts";
import { getPricingSettings } from "@/lib/pricing-settings";

/** Patrz komentarz w src/app/actions/discounts.ts. */
async function isSandboxWrite() {
  const settings = await getPricingSettings();
  return settings.sandboxEnabled;
}

/**
 * Zniżki dla wybranej puli osób — naliczają się automatycznie, gdy zalogowany
 * adres e-mail znajduje się na liście. Klientka nie wpisuje żadnego kodu.
 */

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return session;
}

function toDbData(input: SaveEmailDiscountInput) {
  return {
    name: input.name,
    type: input.type,
    percentOff: input.type === "percent" ? input.percentOff : null,
    amountOff: input.type === "amount" ? input.amountOff : null,
    usageLimit: input.usageLimit,
    validFrom: input.validFrom ? new Date(input.validFrom) : null,
    validUntil: input.validUntil ? new Date(input.validUntil) : null,
  };
}

export async function createEmailDiscountAction(
  input: SaveEmailDiscountInput,
  /**
   * Kampania zapisów, z której przepisujemy adresy (wejście z panelu „Zapisy",
   * menu przy liście). `null` = zwykła, pusta zniżka.
   *
   * Przekazujemy ID, a nie gotową listę adresów: dane osobowe nie mają po co
   * jechać do przeglądarki i z powrotem, a serwer i tak jest jedynym miejscem,
   * które wie, kto naprawdę jest na liście w tej chwili.
   */
  fromWaitlistPageId?: string | null,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const validation = SaveEmailDiscountSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    // Adresy pobieramy PRZED utworzeniem zniżki: gdy kampania okaże się nie
    // istnieć, nie zostawimy po sobie pustej zniżki bez listy, po której admin
    // musiałby sprzątać.
    const emails = fromWaitlistPageId
      ? await waitlistEmails(fromWaitlistPageId)
      : null;

    if (fromWaitlistPageId && emails === null) {
      return { error: "Nie znaleziono tej kampanii zapisów." };
    }

    const discount = await prisma.emailDiscount.create({
      data: {
        ...toDbData(validation.data),
        isActive: false,
        isSandbox: await isSandboxWrite(),
      },
    });

    let addedFromWaitlist = 0;

    if (emails && emails.length > 0) {
      const result = await prisma.emailDiscountMember.createMany({
        data: emails.map((email) => ({ discountId: discount.id, email })),
        skipDuplicates: true,
      });
      addedFromWaitlist = result.count;
    }

    revalidatePath("/admin/rabaty");
    return { success: true, id: discount.id, addedFromWaitlist };
  } catch (error) {
    console.error("EmailDiscount create error:", error);
    return { error: "Błąd bazy danych podczas tworzenia zniżki." };
  }
}

/**
 * Adresy zapisane na daną kampanię. `null`, gdy kampanii nie ma — to co innego
 * niż pusta lista i wywołujący musi umieć te przypadki rozróżnić.
 */
async function waitlistEmails(pageId: string): Promise<string[] | null> {
  const page = await prisma.waitlistPage.findUnique({
    where: { id: pageId },
    select: { id: true },
  });

  if (!page) return null;

  const subscribers = await prisma.waitlistSubscriber.findMany({
    where: { pageId },
    select: { email: true },
    orderBy: { createdAt: "asc" },
  });

  return subscribers.map((subscriber) => subscriber.email);
}

export async function updateEmailDiscountAction(
  id: string,
  input: SaveEmailDiscountInput,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const validation = SaveEmailDiscountSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const existing = await prisma.emailDiscount.findUnique({ where: { id } });
    if (!existing) return { error: "Nie znaleziono zniżki." };

    const sandbox = await isSandboxWrite();
    const data = toDbData(validation.data);

    // Patrz komentarz w updateSaleAction.
    const limitRaised =
      data.usageLimit === null ||
      (existing.usageLimit !== null && data.usageLimit > existing.usageLimit);

    await prisma.emailDiscount.update({
      where: { id },
      data: {
        ...data,
        ...(limitRaised ? { exhaustedNotifiedAt: null } : {}),
        ...(sandbox ? { isSandbox: true } : {}),
      },
    });

    revalidatePath("/admin/rabaty");
    revalidatePath("/zakup");
    return { success: true };
  } catch (error) {
    console.error("EmailDiscount update error:", error);
    return { error: "Błąd bazy danych podczas zapisu zniżki." };
  }
}

export async function toggleEmailDiscountAction(id: string, isActive: boolean) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    const sandbox = await isSandboxWrite();

    await prisma.emailDiscount.update({
      where: { id },
      data: { isActive, ...(sandbox ? { isSandbox: true } : {}) },
    });

    revalidatePath("/admin/rabaty");
    revalidatePath("/zakup");
    return { success: true, isActive };
  } catch (error) {
    console.error("EmailDiscount toggle error:", error);
    return { error: "Błąd bazy danych podczas zmiany statusu zniżki." };
  }
}

/** Usuwa zniżkę razem z przypisaną listą adresów (kaskada w bazie). */
export async function deleteEmailDiscountAction(id: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    await prisma.emailDiscount.delete({ where: { id } });

    revalidatePath("/admin/rabaty");
    return { success: true };
  } catch (error) {
    console.error("EmailDiscount delete error:", error);
    return { error: "Błąd bazy danych podczas usuwania zniżki." };
  }
}

/**
 * Dopisuje adresy do listy. Przyjmuje wklejony blok tekstu — adresy mogą być
 * rozdzielone przecinkami, średnikami albo nowymi liniami, bo admin zwykle
 * wkleja kolumnę z arkusza.
 */
export async function addEmailsAction(discountId: string, raw: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const { valid, invalid } = parseEmailList(raw);

  if (valid.length === 0) {
    return { error: "Nie znalazłem żadnego poprawnego adresu e-mail." };
  }

  try {
    // skipDuplicates: ponowne wklejenie tej samej listy nic nie psuje.
    const result = await prisma.emailDiscountMember.createMany({
      data: valid.map((email) => ({ discountId, email })),
      skipDuplicates: true,
    });

    revalidatePath("/admin/rabaty");
    return {
      success: true,
      added: result.count,
      skipped: valid.length - result.count,
      invalid,
    };
  } catch (error) {
    console.error("EmailDiscount addEmails error:", error);
    return { error: "Błąd bazy danych podczas dodawania adresów." };
  }
}

/**
 * Czyści całą listę adresów jednej zniżki — sama zniżka zostaje.
 *
 * Bez blokady na „lista zmieniła się od wczytania panelu" (takiej jak przy
 * zapisach): tutaj adresy dopisuje wyłącznie admin z tego samego panelu,
 * więc nie ma ruchu z zewnątrz, który mógłby wejść pod rękę.
 */
export async function clearEmailsAction(discountId: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    const result = await prisma.emailDiscountMember.deleteMany({
      where: { discountId },
    });

    revalidatePath("/admin/rabaty");
    // Zniżka bez adresów nikomu się nie naliczy, więc cena w koszyku mogła
    // się właśnie zmienić — odświeżamy też stronę zakupu.
    revalidatePath("/zakup");
    return { success: true, removed: result.count };
  } catch (error) {
    console.error("EmailDiscount clearEmails error:", error);
    return { error: "Błąd bazy danych podczas czyszczenia listy." };
  }
}

/** Usuwa pojedynczy adres z listy. */
export async function removeEmailAction(memberId: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    await prisma.emailDiscountMember.delete({ where: { id: memberId } });

    revalidatePath("/admin/rabaty");
    return { success: true };
  } catch (error) {
    console.error("EmailDiscount removeEmail error:", error);
    return { error: "Błąd bazy danych podczas usuwania adresu." };
  }
}
