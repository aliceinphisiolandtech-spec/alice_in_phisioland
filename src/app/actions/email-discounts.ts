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

export async function createEmailDiscountAction(input: SaveEmailDiscountInput) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const validation = SaveEmailDiscountSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    await prisma.emailDiscount.create({
      data: {
        ...toDbData(validation.data),
        isActive: false,
        isSandbox: await isSandboxWrite(),
      },
    });

    revalidatePath("/admin/rabaty");
    return { success: true };
  } catch (error) {
    console.error("EmailDiscount create error:", error);
    return { error: "Błąd bazy danych podczas tworzenia zniżki." };
  }
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
