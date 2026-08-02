import { prisma } from "@/lib/prisma";
import { evaluateDiscount } from "@/lib/discounts";
import { isTesterEmail, resolveBaseAmount } from "@/lib/pricing";
import {
  getPricingSettings,
  isSandboxActiveFor,
  resolveSettingsBasePrice,
} from "@/lib/pricing-settings";
import { calculatePrice, type PriceResult } from "@/lib/pricing-engine";
import { resolveCoupon } from "@/lib/coupons";
import type { CouponRejectionReason } from "@/lib/validators/coupon";

/**
 * Serwerowy resolver wyceny koszyka.
 *
 * Zbiera wszystkie czynne obniżki (przeceny, zniżki dla puli maili, opcjonalny
 * kod), przepuszcza je przez silnik cenowy i zwraca gotowy wynik. Wołają go
 * WSZYSTKIE ścieżki: strona zakupu (widok początkowy), walidacja kodu i
 * tworzenie płatności — dzięki temu klientka nigdy nie zobaczy innej kwoty niż
 * ta, którą pobierze Stripe.
 *
 * PIASKOWNICA: rabaty oznaczone `isSandbox` są widoczne WYŁĄCZNIE dla admina
 * przy włączonym trybie testowym. Dla wszystkich pozostałych po prostu nie
 * istnieją — filtr siedzi w zapytaniu do bazy, nie w warstwie widoku.
 */

const IS_TESTING_WEEK = process.env.IS_TESTING_WEEK === "true";

export interface SandboxInfo {
  /** Piaskownica włączona globalnie w ustawieniach. */
  enabled: boolean;
  /** Piaskownica obowiązuje dla TEGO użytkownika (czyli: jest adminem). */
  active: boolean;
  /** Czy cena bazowa pochodzi z testowej ceny piaskownicy. */
  usesSandboxPrice: boolean;
}

export interface CheckoutPricing {
  pricing: PriceResult;
  /** Kod faktycznie naliczony (null, gdy brak, odrzucony albo przebity promocją). */
  appliedCouponId: string | null;
  appliedCouponCode: string | null;
  /** Powód odrzucenia kodu — kod nie istnieje, wygasł, wyczerpany itd. */
  couponRejected: CouponRejectionReason | null;
  sandbox: SandboxInfo;
}

export interface ResolveCheckoutPricingArgs {
  email?: string | null;
  couponCode?: string | null;
  /** Rola z sesji. Tylko admin może wpaść w tryb piaskownicy. */
  isAdmin?: boolean;
}

export async function resolveCheckoutPricing({
  email,
  couponCode,
  isAdmin = false,
}: ResolveCheckoutPricingArgs): Promise<CheckoutPricing> {
  const normalizedEmail = email?.toLowerCase() ?? null;

  const settings = await getPricingSettings();
  const sandboxActive = isSandboxActiveFor(settings, {
    isAdmin,
    email: normalizedEmail,
  });
  const { basePrice, usesSandboxPrice } = resolveSettingsBasePrice(
    settings,
    sandboxActive,
  );

  // Testowa cena piaskownicy ma pierwszeństwo także przed ceną testerską —
  // admin ma zobaczyć dokładnie kwotę, którą wpisał do testów.
  const baseAmount = usesSandboxPrice
    ? basePrice
    : resolveBaseAmount({
        isTestingWeek: IS_TESTING_WEEK,
        isTester: isTesterEmail(normalizedEmail),
        basePrice,
      });

  // Poza piaskownicą rabaty testowe nie istnieją — filtrujemy w zapytaniu.
  const sandboxFilter = sandboxActive ? {} : { isSandbox: false };

  // --- PRZECENY ---
  // Filtr `isActive` robi baza, okno czasowe sprawdzamy w kodzie tą samą
  // funkcją co dla kodów rabatowych.
  const activeSales = await prisma.sale.findMany({
    where: { isActive: true, ...sandboxFilter },
  });
  const usableSales = activeSales
    .filter((sale) => evaluateDiscount(sale).usable)
    .map((sale) => ({
      id: sale.id,
      name: sale.name,
      type: sale.type,
      percentOff: sale.percentOff,
      fixedPrice: sale.fixedPrice,
    }));

  // --- ZNIŻKI DLA PULI MAILI ---
  // Bez zalogowanego adresu nie ma czego dopasować.
  const activeEmailDiscounts = normalizedEmail
    ? await prisma.emailDiscount.findMany({
        where: {
          isActive: true,
          ...sandboxFilter,
          members: { some: { email: normalizedEmail } },
        },
      })
    : [];

  const usableEmailDiscounts = activeEmailDiscounts
    .filter((discount) => evaluateDiscount(discount).usable)
    .map((discount) => ({
      id: discount.id,
      name: discount.name,
      type: discount.type,
      percentOff: discount.percentOff,
      amountOff: discount.amountOff,
    }));

  // --- KOD RABATOWY ---
  let couponInput = null;
  let couponId: string | null = null;
  let couponRejected: CouponRejectionReason | null = null;

  if (couponCode && couponCode.trim() !== "") {
    const result = await resolveCoupon(couponCode, {
      allowSandbox: sandboxActive,
    });

    if (result.ok) {
      couponId = result.coupon.id;
      couponInput = {
        id: result.coupon.id,
        code: result.coupon.code,
        type: result.coupon.type,
        percentOff: result.coupon.percentOff,
        amountOff: result.coupon.amountOff,
        stackableWithSale: result.coupon.stackableWithSale,
      };
    } else {
      couponRejected = result.reason;
    }
  }

  const pricing = calculatePrice({
    baseAmount,
    sales: usableSales,
    emailDiscounts: usableEmailDiscounts,
    coupon: couponInput,
  });

  // Kod przebity przez korzystniejszą promocję nie trafia do zamówienia —
  // nie wziął udziału w cenie, więc nie zużywa też miejsca w swojej puli.
  const couponCounted = couponInput !== null && !pricing.couponOutranked;

  return {
    pricing,
    appliedCouponId: couponCounted ? couponId : null,
    appliedCouponCode: couponCounted ? (couponInput?.code ?? null) : null,
    couponRejected,
    sandbox: {
      enabled: settings.sandboxEnabled,
      active: sandboxActive,
      usesSandboxPrice,
    },
  };
}

/** Rozbicie wyniku na kolumny snapshotu zapisywane przy zamówieniu. */
export function toOrderSnapshot(pricing: PriceResult) {
  const find = (kind: "sale" | "email" | "coupon") =>
    pricing.lines.find((line) => line.kind === kind) ?? null;

  const sale = find("sale");
  const emailDiscount = find("email");
  const coupon = find("coupon");

  return {
    originalAmount: pricing.totalDiscount > 0 ? pricing.baseAmount : null,
    totalDiscountAmount:
      pricing.totalDiscount > 0 ? pricing.totalDiscount : null,
    discountAmount: coupon ? coupon.amount : null,
    saleName: sale ? sale.name : null,
    saleAmount: sale ? sale.amount : null,
    // ID zapisujemy obok nazwy — po nim webhook nalicza zużycie limitu.
    saleId: sale ? sale.sourceId : null,
    emailDiscountName: emailDiscount ? emailDiscount.name : null,
    emailDiscountAmount: emailDiscount ? emailDiscount.amount : null,
    emailDiscountId: emailDiscount ? emailDiscount.sourceId : null,
  };
}
