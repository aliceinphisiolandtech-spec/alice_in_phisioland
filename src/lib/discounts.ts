import { MIN_CHARGE_GROSZE, formatPln } from "@/lib/pricing";
import { now } from "@/lib/dev-clock";

/**
 * Domenowa logika rabatów — czysta, bez importów serwerowych, żeby ten sam kod
 * decydował o rabacie na serwerze (kwota do zapłaty) i w panelu (status kodu).
 *
 * Wszystkie kwoty w groszach.
 */

export type DiscountType = "percent" | "amount";

/** Wartość rabatu: procent albo kwota. */
export interface DiscountValue {
  type: string;
  percentOff: number | null;
  amountOff: number | null;
}

/**
 * Pola decydujące o tym, czy obniżka jest teraz czynna.
 * Ten sam kształt mają kody rabatowe, przeceny i zniżki dla puli maili —
 * dzięki temu wszystkie trzy przechodzą przez to samo `evaluateDiscount`,
 * a reguła "wyłączony / poza terminem / wyczerpany" jest jedna dla całego
 * systemu. Limit użyć mają na razie wyłącznie kody, stąd pola opcjonalne.
 */
export interface DiscountLifecycle {
  isActive: boolean;
  usageLimit?: number | null;
  usedCount?: number;
  validFrom: Date | string | null;
  validUntil: Date | string | null;
}

export function isPercentDiscount(discount: DiscountValue): boolean {
  return discount.type !== "amount";
}

/** Etykieta rabatu do UI: "−10%" albo "−20,00 zł". */
export function formatDiscountValue(discount: DiscountValue): string {
  if (isPercentDiscount(discount)) {
    return `−${discount.percentOff ?? 0}%`;
  }
  return `−${formatPln(discount.amountOff ?? 0)}`;
}

export interface DiscountBreakdown {
  discountAmount: number;
  finalAmount: number;
}

/**
 * Wylicza kwotę rabatu i kwotę końcową.
 *
 * Rabat kwotowy większy niż cena (albo procent bliski 100) zostaje przycięty tak,
 * by do zapłaty zostało minimum akceptowane przez Stripe — inaczej utworzenie
 * płatności by się wywaliło. Rabat przeliczamy wtedy wstecz, żeby kwoty
 * pokazywane klientce zawsze sumowały się do tego, co realnie pobieramy.
 */
export function computeDiscount(
  baseAmount: number,
  discount: DiscountValue,
): DiscountBreakdown {
  const rawDiscount = isPercentDiscount(discount)
    ? Math.round((baseAmount * (discount.percentOff ?? 0)) / 100)
    : (discount.amountOff ?? 0);

  let finalAmount = baseAmount - Math.max(0, rawDiscount);

  if (finalAmount < MIN_CHARGE_GROSZE) {
    finalAmount = Math.min(baseAmount, MIN_CHARGE_GROSZE);
  }

  return {
    discountAmount: baseAmount - finalAmount,
    finalAmount,
  };
}

/** Powody, dla których istniejący kod nie może zostać teraz użyty. */
export type DiscountUnavailableReason =
  | "inactive"
  | "not_started"
  | "expired"
  | "exhausted";

export type EvaluateDiscountResult =
  | { usable: true }
  | { usable: false; reason: DiscountUnavailableReason };

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

/**
 * Czy kod jest zdatny do użycia W TEJ CHWILI.
 * Kolejność sprawdzeń wyznacza komunikat, który zobaczy klientka — od
 * najbardziej "administracyjnego" (wyłączony ręcznie) po wyczerpanie puli.
 *
 * „Teraz" bierzemy z `now()` (lib/dev-clock), a nie z `new Date()`, żeby dev
 * mógł przesunąć datę na potrzeby nagrania i żeby serwer z panelem nigdy nie
 * odpowiadały na to pytanie inaczej.
 */
export function evaluateDiscount(
  discount: DiscountLifecycle,
  at: Date = now(),
): EvaluateDiscountResult {
  if (!discount.isActive) {
    return { usable: false, reason: "inactive" };
  }

  const validFrom = toDate(discount.validFrom);
  if (validFrom && at < validFrom) {
    return { usable: false, reason: "not_started" };
  }

  const validUntil = toDate(discount.validUntil);
  if (validUntil && at > validUntil) {
    return { usable: false, reason: "expired" };
  }

  if (
    discount.usageLimit != null &&
    (discount.usedCount ?? 0) >= discount.usageLimit
  ) {
    return { usable: false, reason: "exhausted" };
  }

  return { usable: true };
}

export type DiscountStatusKey = "active" | DiscountUnavailableReason;

export interface DiscountStatus {
  key: DiscountStatusKey;
  label: string;
  /** Klasy Tailwind dla plakietki w panelu. */
  tone: string;
}

const STATUS_LABELS: Record<DiscountStatusKey, { label: string; tone: string }> =
  {
    active: { label: "Aktywny", tone: "bg-[#c5e96b]/30 text-[#0c493e]" },
    inactive: { label: "Wyłączony", tone: "bg-gray-100 text-gray-500" },
    not_started: { label: "Zaplanowany", tone: "bg-blue-50 text-blue-600" },
    expired: { label: "Wygasł", tone: "bg-orange-50 text-orange-600" },
    exhausted: { label: "Wyczerpany", tone: "bg-red-50 text-red-600" },
  };

/** Status kodu do wyświetlenia w panelu (plakietka + kolor). */
export function getDiscountStatus(
  discount: DiscountLifecycle,
  at: Date = now(),
): DiscountStatus {
  const result = evaluateDiscount(discount, at);
  const key: DiscountStatusKey = result.usable ? "active" : result.reason;

  return { key, ...STATUS_LABELS[key] };
}

/** Ile użyć zostało (null gdy kod jest bez limitu). */
export function remainingUses(discount: {
  usageLimit: number | null;
  usedCount: number;
}): number | null {
  if (discount.usageLimit === null) return null;
  return Math.max(0, discount.usageLimit - discount.usedCount);
}
