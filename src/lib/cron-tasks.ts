import { prisma } from "@/lib/prisma";
import { notifyAbandonedCart, notifyCouponExpired } from "@/lib/notifications";
import { now as currentTime } from "@/lib/dev-clock";

/**
 * Logika zadań cyklicznych, wspólna dla wszystkich endpointów w /api/cron.
 *
 * Trzymamy ją tutaj, a nie w route handlerach, żeby zbiorczy `/api/cron/daily`
 * i pojedyncze endpointy (przydatne do ręcznego odpalenia i debugowania)
 * wykonywały dokładnie ten sam kod.
 */

const ABANDONED_THRESHOLD_MINUTES = 30;
const ABANDONED_BATCH_LIMIT = 50;
const COUPON_BATCH_LIMIT = 100;

/** Wynik autoryzacji — routy zamieniają go na odpowiedź HTTP. */
export type CronAuth = "ok" | "unconfigured" | "unauthorized";

export function checkCronAuth(req: Request): CronAuth {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("❌ Brak CRON_SECRET w env — endpoint wyłączony.");
    return "unconfigured";
  }
  return req.headers.get("authorization") === `Bearer ${secret}`
    ? "ok"
    : "unauthorized";
}

/**
 * Wykrywanie porzuconych koszyków.
 *
 * Zamówienie tworzone jest ze statusem "pending" w /api/checkout/intent.
 * Jeśli po ABANDONED_THRESHOLD_MINUTES nadal jest "pending" (klient nie dokończył
 * płatności), traktujemy je jako porzucony koszyk i wysyłamy adminowi
 * powiadomienie — raz (pole abandonedNotifiedAt zabezpiecza przed duplikatami).
 */
export async function runAbandonedCarts() {
  // Świadomie prawdziwy zegar, nie `dev-clock`: liczymy upływ czasu od
  // `createdAt`, a przesunięty dzień przy realnych znacznikach zamówień dawałby
  // odstęp liczony w dobach. `dev-clock` obsługuje wyłącznie domenę rabatów.
  const cutoff = new Date(Date.now() - ABANDONED_THRESHOLD_MINUTES * 60_000);

  const abandoned = await prisma.order.findMany({
    where: {
      status: "pending",
      createdAt: { lt: cutoff },
      abandonedNotifiedAt: null,
      // Porzucony test z piaskownicy nie jest porzuconym koszykiem klientki.
      isSandbox: false,
    },
    orderBy: { createdAt: "asc" },
    take: ABANDONED_BATCH_LIMIT,
  });

  let notified = 0;
  for (const order of abandoned) {
    await notifyAbandonedCart(order);
    await prisma.order.update({
      where: { id: order.id },
      data: { abandonedNotifiedAt: new Date() },
    });
    notified += 1;
  }

  return {
    checked: abandoned.length,
    notified,
    thresholdMinutes: ABANDONED_THRESHOLD_MINUTES,
    // Sygnał, że batch się zapchał i zaległości dokończy dopiero kolejny przebieg.
    truncated: abandoned.length === ABANDONED_BATCH_LIMIT,
  };
}

/**
 * Codzienne porządkowanie kodów rabatowych.
 *
 * Wyłącza kody, którym minęła data ważności, i informuje o tym admina.
 * To WYŁĄCZNIE porządkowanie stanu w panelu — egzekwowanie terminu dzieje się
 * przy każdej próbie użycia kodu (`evaluateDiscount` w src/lib/discounts.ts).
 * Gdyby polegać tylko na cronie, kod działałby jeszcze przez cały czas między
 * wygaśnięciem a najbliższym uruchomieniem zadania.
 */
export async function runDiscountCodes() {
  // Ten sam zegar co `evaluateDiscount` — inaczej w dev cron wyłączałby kody,
  // które w panelu są jeszcze czynne.
  const now = currentTime();

  // Kody nadal włączone, którym minął termin.
  const expired = await prisma.discountCode.findMany({
    where: {
      isActive: true,
      validUntil: { not: null, lt: now },
    },
    take: COUPON_BATCH_LIMIT,
  });

  let deactivated = 0;
  for (const coupon of expired) {
    await prisma.discountCode.update({
      where: { id: coupon.id },
      data: { isActive: false },
    });

    // notifyCouponExpired sam łapie błędy — nie wywróci całego zadania.
    await notifyCouponExpired({
      code: coupon.code,
      usedCount: coupon.usedCount,
    });

    deactivated += 1;
  }

  // Kody, które są w swoim oknie — nic nie zmieniamy (działają same z siebie),
  // ale raportujemy, żeby log crona był czytelny.
  const currentlyRunning = await prisma.discountCode.count({
    where: {
      isActive: true,
      validFrom: { not: null, lte: now },
      OR: [{ validUntil: null }, { validUntil: { gt: now } }],
    },
  });

  return {
    checkedAt: now.toISOString(),
    expired: expired.length,
    deactivated,
    currentlyRunning,
  };
}
