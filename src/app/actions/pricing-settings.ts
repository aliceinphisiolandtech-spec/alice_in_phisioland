"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  PRICING_SETTINGS_ID,
  getPricingSettings,
} from "@/lib/pricing-settings";
import {
  DEFAULT_BASE_PRICE_GROSZE,
  DEFAULT_REGULAR_PRICE_GROSZE,
  MIN_CHARGE_GROSZE,
} from "@/lib/pricing";
import { z } from "zod";

const BasePriceSchema = z
  .number()
  .int("Cena musi być liczbą całkowitą groszy.")
  .min(MIN_CHARGE_GROSZE, "Cena nie może być niższa niż 2,00 zł.")
  .max(1_000_000, "Cena jest zbyt wysoka.");

/**
 * Piaskownica — tryb testowy admina.
 *
 * Nie wyłącza trwających promocji: izoluje to, co w niej powstanie lub zostanie
 * zmienione (flaga `isSandbox`). Jej wyłączenie PUBLIKUJE te zmiany, czyli
 * zdejmuje flagę ze wszystkich rabatów naraz.
 *
 * Z panelu edytowalna jest wyłącznie cena podstawowa (kafelek „Klientka płaci
 * teraz"), przy czym w piaskownicy trafia ona do `sandboxBasePriceGrosze`.
 * `regularPriceGrosze` zostaje w bazie bez UI. Odczyt: src/lib/pricing-settings.ts.
 */

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return session;
}

/**
 * Zmiana ceny podstawowej.
 *
 * Przy WŁĄCZONEJ piaskownicy cena ląduje w polu testowym i obowiązuje wyłącznie
 * admina — klientki płacą dalej tyle co przed włączeniem trybu. Publikuje ją
 * dopiero wyjście z piaskownicy (toggleSandboxAction).
 */
export async function updateBasePriceAction(basePriceGrosze: number) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const validation = BasePriceSchema.safeParse(basePriceGrosze);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const settings = await getPricingSettings();
    const toSandbox = settings.sandboxEnabled;

    await prisma.pricingSettings.upsert({
      where: { id: PRICING_SETTINGS_ID },
      update: toSandbox
        ? { sandboxBasePriceGrosze: validation.data }
        : { basePriceGrosze: validation.data },
      create: {
        id: PRICING_SETTINGS_ID,
        basePriceGrosze: toSandbox
          ? DEFAULT_BASE_PRICE_GROSZE
          : validation.data,
        regularPriceGrosze: DEFAULT_REGULAR_PRICE_GROSZE,
        ...(toSandbox ? { sandboxBasePriceGrosze: validation.data } : {}),
      },
    });

    // Cena wchodzi do koszyka natychmiast — obie strony są dynamiczne.
    revalidatePath("/admin/rabaty");
    revalidatePath("/zakup");
    return { success: true, sandboxOnly: toSandbox };
  } catch (error) {
    console.error("Base price update error:", error);
    return { error: "Błąd bazy danych podczas zapisu ceny." };
  }
}

/**
 * Włącza i wyłącza tryb testowy.
 *
 * Wyłączenie ma DWA warianty, bo to dwie różne decyzje:
 * - `publish: true` (domyślnie) — zmiany z piaskownicy idą na produkcję,
 * - `publish: false` — tryb gaśnie, ale flagi `isSandbox` zostają. Rabaty
 *   czekają jako wersje robocze: klientki ich nie widzą, w panelu stoją
 *   z plakietką „Piaskownica" i wracają do gry po ponownym włączeniu trybu.
 *   Bez tego jedynym wyjściem z piaskownicy byłaby publikacja — a to zmusza do
 *   udostępnienia klientkom czegoś, co miało być wyłącznie próbą.
 */
export async function toggleSandboxAction(
  enabled: boolean,
  { publish = true }: { publish?: boolean } = {},
) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    if (enabled) {
      await prisma.pricingSettings.upsert({
        where: { id: PRICING_SETTINGS_ID },
        update: { sandboxEnabled: true },
        create: {
          id: PRICING_SETTINGS_ID,
          basePriceGrosze: DEFAULT_BASE_PRICE_GROSZE,
          regularPriceGrosze: DEFAULT_REGULAR_PRICE_GROSZE,
          sandboxEnabled: true,
        },
      });

      revalidatePath("/admin/rabaty");
      revalidatePath("/zakup");
      return { success: true, enabled: true, published: 0 };
    }

    // --- WYJŚCIE BEZ PUBLIKACJI ---
    // Ruszamy wyłącznie włącznik trybu. Flagi `isSandbox` i cena testowa
    // zostają nietknięte, więc dla klientek nie zmienia się nic.
    if (!publish) {
      await prisma.pricingSettings.update({
        where: { id: PRICING_SETTINGS_ID },
        data: { sandboxEnabled: false },
      });

      revalidatePath("/admin/rabaty");
      revalidatePath("/zakup");

      return {
        success: true,
        enabled: false,
        published: 0,
        publishedPriceGrosze: null,
      };
    }

    // --- WYJŚCIE Z PIASKOWNICY = PUBLIKACJA ---
    // Jedna transakcja: albo wszystko idzie na produkcję razem z wyłączeniem
    // trybu, albo nic. Inaczej dałoby się skończyć z wyłączoną piaskownicą
    // i rabatami nadal ukrytymi przed klientkami.
    const settings = await getPricingSettings();
    const testPrice = settings.sandboxBasePriceGrosze;

    const [codes, sales, emails] = await prisma.$transaction([
      prisma.discountCode.updateMany({
        where: { isSandbox: true },
        data: { isSandbox: false },
      }),
      prisma.sale.updateMany({
        where: { isSandbox: true },
        data: { isSandbox: false },
      }),
      prisma.emailDiscount.updateMany({
        where: { isSandbox: true },
        data: { isSandbox: false },
      }),
      prisma.pricingSettings.update({
        where: { id: PRICING_SETTINGS_ID },
        data: {
          sandboxEnabled: false,
          // Cena ustawiona w piaskownicy staje się cennikiem dopiero teraz.
          // Pole testowe czyścimy, żeby kolejne wejście w tryb nie zaczynało
          // od kwoty sprzed tygodnia.
          ...(testPrice !== null
            ? { basePriceGrosze: testPrice, sandboxBasePriceGrosze: null }
            : {}),
        },
      }),
    ]);

    revalidatePath("/admin/rabaty");
    revalidatePath("/zakup");

    return {
      success: true,
      enabled: false,
      published: codes.count + sales.count + emails.count,
      publishedPriceGrosze: testPrice,
    };
  } catch (error) {
    console.error("Sandbox toggle error:", error);
    return { error: "Błąd bazy danych podczas przełączania piaskownicy." };
  }
}
