"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  SaveDiscountSchema,
  type SaveDiscountInput,
} from "@/lib/validators/coupon";
import { getPricingSettings } from "@/lib/pricing-settings";

/**
 * Czy zapis odbywa się w piaskownicy. Dotyczy TAKŻE przełącznika aktywności —
 * bez tego włączenie kodu w trybie testowym udostępniłoby go klientkom.
 */
async function isSandboxWrite() {
  const settings = await getPricingSettings();
  return settings.sandboxEnabled;
}

/**
 * Zarządzanie kodami rabatowymi z panelu admina.
 * W systemie może żyć dowolna liczba kodów — każdy z własnym typem rabatu,
 * limitem użyć i oknem czasowym.
 */

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return session;
}

/** Zamienia wejście z formularza na dane gotowe do zapisu. */
function toDbData(input: SaveDiscountInput) {
  return {
    code: input.code,
    type: input.type,
    // Pola wartości są wzajemnie wykluczające się — nieużywane zerujemy, żeby
    // po zmianie typu rabatu nie została "sierota" po poprzednim ustawieniu.
    percentOff: input.type === "percent" ? input.percentOff : null,
    amountOff: input.type === "amount" ? input.amountOff : null,
    usageLimit: input.usageLimit,
    validFrom: input.validFrom ? new Date(input.validFrom) : null,
    validUntil: input.validUntil ? new Date(input.validUntil) : null,
    stackableWithSale: input.stackableWithSale,
  };
}

export async function createDiscountAction(input: SaveDiscountInput) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const validation = SaveDiscountSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const collision = await prisma.discountCode.findUnique({
      where: { code: validation.data.code },
    });

    if (collision) {
      return { error: "Kod o takiej nazwie już istnieje." };
    }

    await prisma.discountCode.create({
      data: {
        ...toDbData(validation.data),
        // Nowy kod startuje wyłączony — aktywacja to świadomy klik.
        isActive: false,
        isSandbox: await isSandboxWrite(),
      },
    });

    revalidatePath("/admin/rabaty");
    return { success: true };
  } catch (error) {
    console.error("Discount create error:", error);
    return { error: "Błąd bazy danych podczas tworzenia kodu." };
  }
}

export async function updateDiscountAction(
  id: string,
  input: SaveDiscountInput,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const validation = SaveDiscountSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const existing = await prisma.discountCode.findUnique({ where: { id } });
    if (!existing) return { error: "Nie znaleziono kodu." };

    const collision = await prisma.discountCode.findUnique({
      where: { code: validation.data.code },
    });

    if (collision && collision.id !== id) {
      return { error: "Kod o takiej nazwie już istnieje." };
    }

    const data = toDbData(validation.data);

    // Podniesienie limitu ponad dotychczasowe zużycie "odblokowuje" kod —
    // kasujemy znacznik powiadomienia, żeby przy kolejnym wyczerpaniu push
    // poszedł ponownie.
    const limitRaised =
      data.usageLimit === null ||
      (existing.usageLimit !== null && data.usageLimit > existing.usageLimit);

    const sandbox = await isSandboxWrite();

    await prisma.discountCode.update({
      where: { id },
      data: {
        ...data,
        ...(limitRaised ? { exhaustedNotifiedAt: null } : {}),
        // Edycja w piaskownicy chowa kod przed klientkami do czasu publikacji.
        ...(sandbox ? { isSandbox: true } : {}),
      },
    });

    revalidatePath("/admin/rabaty");
    return { success: true };
  } catch (error) {
    console.error("Discount update error:", error);
    return { error: "Błąd bazy danych podczas zapisu kodu." };
  }
}

/** Włącza / wyłącza konkretny kod. */
export async function toggleDiscountAction(id: string, isActive: boolean) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    const existing = await prisma.discountCode.findUnique({ where: { id } });
    if (!existing) return { error: "Nie znaleziono kodu." };

    const sandbox = await isSandboxWrite();

    await prisma.discountCode.update({
      where: { id },
      data: { isActive, ...(sandbox ? { isSandbox: true } : {}) },
    });

    revalidatePath("/admin/rabaty");
    revalidatePath("/zakup");
    return { success: true, isActive };
  } catch (error) {
    console.error("Discount toggle error:", error);
    return { error: "Błąd bazy danych podczas zmiany statusu kodu." };
  }
}

/**
 * Usuwa kod z listy. Zamówienia zostają nietknięte — mają własny snapshot
 * (nazwa kodu, kwota rabatu, cena przed rabatem), więc historia sprzedaży
 * pozostaje kompletna także po skasowaniu promocji.
 */
export async function deleteDiscountAction(id: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    await prisma.discountCode.delete({ where: { id } });

    revalidatePath("/admin/rabaty");
    return { success: true };
  } catch (error) {
    console.error("Discount delete error:", error);
    return { error: "Błąd bazy danych podczas usuwania kodu." };
  }
}
