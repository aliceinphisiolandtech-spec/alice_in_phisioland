"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SaveSaleSchema, type SaveSaleInput } from "@/lib/validators/discounts";
import { getPricingSettings } from "@/lib/pricing-settings";

/** Patrz komentarz w src/app/actions/discounts.ts. */
async function isSandboxWrite() {
  const settings = await getPricingSettings();
  return settings.sandboxEnabled;
}

/**
 * Przeceny — obniżka globalna, działa bez wpisywania kodu.
 * Włączenie przeceny natychmiast zmienia cenę w koszyku dla wszystkich.
 */

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return session;
}

function toDbData(input: SaveSaleInput) {
  return {
    name: input.name,
    type: input.type,
    // Pola wartości wykluczają się wzajemnie — nieużywane zerujemy, żeby po
    // zmianie typu nie została "sierota" po poprzednim ustawieniu.
    percentOff: input.type === "percent" ? input.percentOff : null,
    fixedPrice: input.type === "fixed_price" ? input.fixedPrice : null,
    usageLimit: input.usageLimit,
    validFrom: input.validFrom ? new Date(input.validFrom) : null,
    validUntil: input.validUntil ? new Date(input.validUntil) : null,
  };
}

export async function createSaleAction(input: SaveSaleInput) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const validation = SaveSaleSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    await prisma.sale.create({
      data: {
        ...toDbData(validation.data),
        isActive: false,
        isSandbox: await isSandboxWrite(),
      },
    });

    revalidatePath("/admin/rabaty");
    return { success: true };
  } catch (error) {
    console.error("Sale create error:", error);
    return { error: "Błąd bazy danych podczas tworzenia przeceny." };
  }
}

export async function updateSaleAction(id: string, input: SaveSaleInput) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const validation = SaveSaleSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const existing = await prisma.sale.findUnique({ where: { id } });
    if (!existing) return { error: "Nie znaleziono przeceny." };

    const sandbox = await isSandboxWrite();
    const data = toDbData(validation.data);

    // Podniesienie limitu ponad dotychczasowe zużycie "odblokowuje" przecenę —
    // kasujemy znacznik, żeby przy kolejnym wyczerpaniu push poszedł ponownie.
    const limitRaised =
      data.usageLimit === null ||
      (existing.usageLimit !== null && data.usageLimit > existing.usageLimit);

    await prisma.sale.update({
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
    console.error("Sale update error:", error);
    return { error: "Błąd bazy danych podczas zapisu przeceny." };
  }
}

export async function toggleSaleAction(id: string, isActive: boolean) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    const sandbox = await isSandboxWrite();

    await prisma.sale.update({
      where: { id },
      data: { isActive, ...(sandbox ? { isSandbox: true } : {}) },
    });

    revalidatePath("/admin/rabaty");
    revalidatePath("/zakup");
    return { success: true, isActive };
  } catch (error) {
    console.error("Sale toggle error:", error);
    return { error: "Błąd bazy danych podczas zmiany statusu przeceny." };
  }
}

/**
 * Usuwa przecenę. Zamówienia zachowują własny snapshot (nazwa przeceny i kwota
 * obniżki), więc historia sprzedaży pozostaje kompletna.
 */
export async function deleteSaleAction(id: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    await prisma.sale.delete({ where: { id } });

    revalidatePath("/admin/rabaty");
    return { success: true };
  } catch (error) {
    console.error("Sale delete error:", error);
    return { error: "Błąd bazy danych podczas usuwania przeceny." };
  }
}
