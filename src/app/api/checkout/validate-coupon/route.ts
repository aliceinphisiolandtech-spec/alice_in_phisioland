import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCheckoutPricing } from "@/lib/checkout-pricing";
import { rateLimit } from "@/lib/rate-limit";
import {
  COUPON_ERROR_MESSAGES,
  ValidateCouponSchema,
  type CouponRejectionReason,
} from "@/lib/validators/coupon";

/** Kody odpowiedzi dobrane tak, by front mógł rozróżnić przypadki po statusie. */
const STATUS_BY_REASON: Record<CouponRejectionReason, number> = {
  invalid_format: 400,
  not_found: 404,
  inactive: 409,
  not_started: 409,
  expired: 410,
  exhausted: 409,
};

function reject(reason: CouponRejectionReason) {
  return NextResponse.json(
    { valid: false, reason, message: COUPON_ERROR_MESSAGES[reason] },
    { status: STATUS_BY_REASON[reason] },
  );
}

/**
 * Podgląd wyceny po wpisaniu kodu. Zwraca pełne rozbicie ceny (przecena,
 * zniżka mailowa, kod) policzone po stronie serwera.
 *
 * To NIE jest miejsce, w którym rabat zostaje "przyznany" — przy tworzeniu
 * płatności cała wycena powstaje od nowa (patrz /api/checkout/intent).
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { message: "Musisz być zalogowany, aby użyć kodu rabatowego." },
        { status: 401 },
      );
    }

    // Endpoint sprawdzający istnienie kodu jest wprost narzędziem do zgadywania
    // kodów — stąd limit prób na użytkownika.
    const limit = rateLimit(`coupon:${session.user.id}`, 10, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: "Zbyt wiele prób. Spróbuj ponownie za chwilę." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await req.json().catch(() => null);
    const validation = ValidateCouponSchema.safeParse(body);

    if (!validation.success) {
      return reject("invalid_format");
    }

    const result = await resolveCheckoutPricing({
      email: session.user.email,
      couponCode: validation.data.code,
      isAdmin: session.user.role === "admin",
    });

    if (result.couponRejected) {
      return reject(result.couponRejected);
    }

    return NextResponse.json({
      valid: true,
      pricing: result.pricing,
      appliedCode: result.appliedCouponCode,
      // Kod poprawny, ale nie wszedł do ceny — aktywna promocja jest równie
      // dobra lub lepsza. Koszyk pokaże wyjaśnienie zamiast cichego pominięcia.
      outranked: result.pricing.couponOutranked,
    });
  } catch (error) {
    console.error("[VALIDATE_COUPON_ERROR]", error);
    return NextResponse.json(
      { message: "Wystąpił błąd serwera podczas sprawdzania kodu." },
      { status: 500 },
    );
  }
}
