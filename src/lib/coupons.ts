import { prisma } from "@/lib/prisma";
import {
  evaluateDiscount,
  formatDiscountValue,
  type DiscountType,
} from "@/lib/discounts";
import {
  CouponCodeSchema,
  type CouponRejectionReason,
} from "@/lib/validators/coupon";

/**
 * Serwerowa logika kodów rabatowych.
 *
 * WAŻNE: kwota rabatu powstaje wyłącznie tutaj (przez `computeDiscount`).
 * Wołają to zarówno endpoint walidacyjny (podgląd w koszyku), jak i endpoint
 * tworzący płatność — dzięki temu podgląd i realne obciążenie nie mogą się
 * rozjechać, a przeglądarka nigdy nie decyduje o cenie.
 */

export interface ResolvedCoupon {
  id: string;
  code: string;
  type: DiscountType;
  label: string;
  percentOff: number | null;
  amountOff: number | null;
  /** Czy kod wolno naliczyć na wierzch przeceny / zniżki mailowej. */
  stackableWithSale: boolean;
}

export type ResolveCouponResult =
  | { ok: true; coupon: ResolvedCoupon }
  | { ok: false; reason: CouponRejectionReason };

/**
 * Sprawdza, czy kod istnieje i czy da się go użyć W TEJ CHWILI — wyłącznik,
 * okno czasowe i pozostała pula są sprawdzane przy każdym wywołaniu.
 *
 * Cron wyłączający wygasłe kody (patrz /api/cron/discount-codes) to tylko
 * porządkowanie panelu; egzekwowanie terminu dzieje się właśnie tutaj, bo
 * między jednym a drugim uruchomieniem crona mija cała doba.
 */
export async function resolveCoupon(
  rawCode: string,
  { allowSandbox = false }: { allowSandbox?: boolean } = {},
): Promise<ResolveCouponResult> {
  const parsed = CouponCodeSchema.safeParse(rawCode);

  if (!parsed.success) {
    return { ok: false, reason: "invalid_format" };
  }

  const coupon = await prisma.discountCode.findUnique({
    where: { code: parsed.data },
  });

  if (!coupon) {
    return { ok: false, reason: "not_found" };
  }

  // Kod z piaskownicy dla klientki po prostu nie istnieje — świadomie zwracamy
  // "not_found", a nie osobny powód, żeby testowa nazwa nie wyciekła na zewnątrz.
  if (coupon.isSandbox && !allowSandbox) {
    return { ok: false, reason: "not_found" };
  }

  const evaluation = evaluateDiscount(coupon);

  if (!evaluation.usable) {
    return { ok: false, reason: evaluation.reason };
  }

  return {
    ok: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type === "amount" ? "amount" : "percent",
      label: formatDiscountValue(coupon),
      percentOff: coupon.percentOff,
      amountOff: coupon.amountOff,
      stackableWithSale: coupon.stackableWithSale,
    },
  };
}

// Naliczanie zużycia limitu przeniesione do src/lib/discount-usage.ts —
// ta sama logika obsługuje kody, przeceny i zniżki dla puli maili.
