import { z } from "zod";
import {
  DiscountAmountSchema,
  DiscountPercentSchema,
  IsoDateSchema,
  UsageLimitSchema,
} from "@/lib/validators/coupon";
import { MIN_CHARGE_GROSZE } from "@/lib/pricing";

/** Nazwa obniżki widoczna dla klientki w podsumowaniu zamówienia. */
const NameSchema = z
  .string()
  .trim()
  .min(2, "Nazwa musi mieć minimum 2 znaki.")
  .max(60, "Nazwa może mieć maksymalnie 60 znaków.");

/** Wspólna reguła: koniec okna musi wypadać po jego początku. */
function windowRefine<
  T extends { validFrom: string | null; validUntil: string | null },
>(schema: z.ZodType<T>) {
  return schema.refine(
    (data) =>
      !data.validFrom ||
      !data.validUntil ||
      new Date(data.validUntil) > new Date(data.validFrom),
    {
      message: "Data zakończenia musi być późniejsza niż data rozpoczęcia.",
      path: ["validUntil"],
    },
  );
}

/** Cena docelowa promocji — nie może zejść poniżej progu Stripe. */
export const FixedPriceSchema = z
  .number()
  .int("Cena musi być liczbą całkowitą groszy.")
  .min(MIN_CHARGE_GROSZE, "Cena promocyjna nie może być niższa niż 2,00 zł.")
  .max(1_000_000, "Cena promocyjna jest zbyt wysoka.");

// --- PRZECENA ---

export const SaveSaleSchema = windowRefine(
  z
    .object({
      name: NameSchema,
      type: z.enum(["percent", "fixed_price"], {
        message: "Wybierz typ przeceny.",
      }),
      percentOff: DiscountPercentSchema.nullable(),
      fixedPrice: FixedPriceSchema.nullable(),
      usageLimit: UsageLimitSchema.nullable(),
      validFrom: IsoDateSchema,
      validUntil: IsoDateSchema,
    })
    .refine(
      (data) => (data.type === "percent" ? data.percentOff !== null : true),
      {
        message: "Podaj wysokość przeceny w procentach.",
        path: ["percentOff"],
      },
    )
    .refine(
      (data) => (data.type === "fixed_price" ? data.fixedPrice !== null : true),
      { message: "Podaj cenę promocyjną.", path: ["fixedPrice"] },
    ),
);

export type SaveSaleInput = z.infer<typeof SaveSaleSchema>;

// --- ZNIŻKA DLA PULI MAILI ---

export const SaveEmailDiscountSchema = windowRefine(
  z
    .object({
      name: NameSchema,
      type: z.enum(["percent", "amount"], { message: "Wybierz typ zniżki." }),
      percentOff: DiscountPercentSchema.nullable(),
      amountOff: DiscountAmountSchema.nullable(),
      usageLimit: UsageLimitSchema.nullable(),
      validFrom: IsoDateSchema,
      validUntil: IsoDateSchema,
    })
    .refine(
      (data) => (data.type === "percent" ? data.percentOff !== null : true),
      {
        message: "Podaj wysokość zniżki w procentach.",
        path: ["percentOff"],
      },
    )
    .refine(
      (data) => (data.type === "amount" ? data.amountOff !== null : true),
      {
        message: "Podaj kwotę zniżki.",
        path: ["amountOff"],
      },
    ),
);

export type SaveEmailDiscountInput = z.infer<typeof SaveEmailDiscountSchema>;

/**
 * Adresy wklejane hurtem z listy — akceptujemy separację przecinkami, średnikami
 * i nowymi liniami, bo admin zwykle wkleja kolumnę z arkusza.
 */
export const EmailListSchema = z
  .string()
  .trim()
  .min(1, "Wklej przynajmniej jeden adres e-mail.");

export function parseEmailList(raw: string): {
  valid: string[];
  invalid: string[];
} {
  const candidates = raw
    .split(/[\s,;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  const unique = Array.from(new Set(candidates));
  const emailSchema = z.string().email();

  return {
    valid: unique.filter((entry) => emailSchema.safeParse(entry).success),
    invalid: unique.filter((entry) => !emailSchema.safeParse(entry).success),
  };
}
