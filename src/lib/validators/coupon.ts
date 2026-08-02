import { z } from "zod";
import type { DiscountUnavailableReason } from "@/lib/discounts";

/**
 * Kod rabatowy normalizujemy do UPPERCASE już na wejściu — w bazie trzymamy
 * wyłącznie wersję wielkimi literami, dzięki czemu "alicja10" i "ALICJA10"
 * to ten sam kod, a wyszukiwanie zostaje proste (`findUnique`).
 */
export const CouponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, "Kod musi mieć minimum 3 znaki.")
  .max(32, "Kod może mieć maksymalnie 32 znaki.")
  .regex(/^[A-Z0-9_-]+$/, "Kod może zawierać tylko litery, cyfry, - oraz _.");

export const ValidateCouponSchema = z.object({
  code: CouponCodeSchema,
});

/** Wysokość rabatu procentowego. Górny limit 95% chroni przed zejściem poniżej progu Stripe. */
export const DiscountPercentSchema = z
  .number()
  .int("Rabat musi być liczbą całkowitą.")
  .min(1, "Rabat musi wynosić minimum 1%.")
  .max(95, "Rabat może wynosić maksymalnie 95%.");

/** Wysokość rabatu kwotowego w groszach. */
export const DiscountAmountSchema = z
  .number()
  .int("Kwota rabatu musi być liczbą całkowitą groszy.")
  .min(100, "Rabat kwotowy musi wynosić minimum 1,00 zł.")
  .max(100_000, "Rabat kwotowy może wynosić maksymalnie 1000,00 zł.");

export const UsageLimitSchema = z
  .number()
  .int("Limit użyć musi być liczbą całkowitą.")
  .min(1, "Limit użyć musi wynosić minimum 1.")
  .max(100_000, "Limit użyć jest zbyt duży.");

/** Data w formacie ISO (albo brak). Współdzielone przez wszystkie typy obniżek. */
export const IsoDateSchema = z
  .string()
  .datetime({ message: "Nieprawidłowa data." })
  .nullable();

/**
 * Zapis kodu z panelu. Pola wartości rabatu są wzajemnie wykluczające się —
 * refine pilnuje, żeby do bazy nie trafił kod procentowy bez procentu (albo
 * kwotowy bez kwoty), bo taki rekord dawałby rabat 0 zł bez żadnego sygnału.
 */
export const SaveDiscountSchema = z
  .object({
    code: CouponCodeSchema,
    type: z.enum(["percent", "amount"], { message: "Wybierz typ rabatu." }),
    percentOff: DiscountPercentSchema.nullable(),
    amountOff: DiscountAmountSchema.nullable(),
    usageLimit: UsageLimitSchema.nullable(),
    validFrom: IsoDateSchema,
    validUntil: IsoDateSchema,
    stackableWithSale: z.boolean(),
  })
  .refine(
    (data) => (data.type === "percent" ? data.percentOff !== null : true),
    { message: "Podaj wysokość rabatu w procentach.", path: ["percentOff"] },
  )
  .refine((data) => (data.type === "amount" ? data.amountOff !== null : true), {
    message: "Podaj kwotę rabatu.",
    path: ["amountOff"],
  })
  .refine(
    (data) =>
      !data.validFrom ||
      !data.validUntil ||
      new Date(data.validUntil) > new Date(data.validFrom),
    {
      message: "Data zakończenia musi być późniejsza niż data rozpoczęcia.",
      path: ["validUntil"],
    },
  );

export type SaveDiscountInput = z.infer<typeof SaveDiscountSchema>;

/** Powody odrzucenia kodu — mapowane na komunikaty w `COUPON_ERROR_MESSAGES`. */
export type CouponRejectionReason =
  | "invalid_format"
  | "not_found"
  | DiscountUnavailableReason;

export const COUPON_ERROR_MESSAGES: Record<CouponRejectionReason, string> = {
  invalid_format: "Nieprawidłowy format kodu.",
  not_found: "Taki kod nie istnieje.",
  inactive: "Ten kod jest obecnie nieaktywny.",
  not_started: "Ta promocja jeszcze się nie rozpoczęła.",
  expired: "Ta promocja już się zakończyła.",
  exhausted: "Pula użyć tego kodu została wyczerpana.",
};
