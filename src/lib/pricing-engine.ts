import { MIN_CHARGE_GROSZE, formatPln } from "@/lib/pricing";
import { computeDiscount, formatDiscountValue } from "@/lib/discounts";

/**
 * Silnik cenowy — jedyne miejsce, w którym z ceny bazowej i zestawu obniżek
 * powstaje kwota do zapłaty. Czysty, bez importów serwerowych, żeby ta sama
 * funkcja liczyła podgląd w koszyku, kwotę przekazywaną do Stripe i podgląd
 * w panelu admina.
 *
 * REGUŁY NAKŁADANIA (ustalone z klientką):
 *
 * 1. Obniżki automatyczne — przecena i zniżka dla puli maili — NIE sumują się
 *    ze sobą. Wygrywa ta, która daje klientce niższą cenę. Bez tej zasady
 *    wystarczyłoby, że ktoś trafi na listę mailową w czasie promocji, i cena
 *    spadałaby dwukrotnie bez niczyjej świadomej decyzji.
 *
 * 2. Kod rabatowy nakłada się na wynik punktu 1 tylko wtedy, gdy ma włączone
 *    `stackableWithSale`. Liczy się wtedy SEKWENCYJNIE — od kwoty już obniżonej,
 *    nie od ceny bazowej.
 *
 * 3. Kod bez zgody na łączenie nie przepada: porównujemy go z wariantem
 *    automatycznym i naliczamy ten, który jest korzystniejszy dla klientki.
 *
 * Wszystkie kwoty w groszach.
 */

export type PriceLineKind = "sale" | "email" | "coupon";

export interface SaleInput {
  id: string;
  name: string;
  type: string; // "percent" | "fixed_price"
  percentOff: number | null;
  fixedPrice: number | null;
}

export interface EmailDiscountInput {
  id: string;
  name: string;
  type: string; // "percent" | "amount"
  percentOff: number | null;
  amountOff: number | null;
}

export interface CouponInput {
  id: string;
  code: string;
  type: string; // "percent" | "amount"
  percentOff: number | null;
  amountOff: number | null;
  stackableWithSale: boolean;
}

/** Jedna pozycja obniżki w podsumowaniu zamówienia. */
export interface PriceLine {
  kind: PriceLineKind;
  /**
   * ID rekordu, z którego pochodzi obniżka. Zapisujemy je przy zamówieniu,
   * żeby po udanej płatności naliczyć zużycie właściwej promocji nawet po
   * zmianie jej nazwy.
   */
  sourceId: string;
  /** Nazwa widoczna dla klientki: "Promocja premierowa", "Lista VIP", "ALICJA10". */
  name: string;
  /** Etykieta wartości: "−20%", "−20,00 zł", "cena 89,00 zł". */
  label: string;
  /** O ile ta pozycja obniżyła kwotę. */
  amount: number;
}

export interface PriceResult {
  baseAmount: number;
  finalAmount: number;
  totalDiscount: number;
  lines: PriceLine[];
  /**
   * true, gdy podany kod NIE został naliczony, bo obniżka automatyczna dawała
   * cenę równie dobrą lub lepszą. Koszyk pokazuje wtedy wyjaśnienie zamiast
   * milczącego zignorowania kodu.
   */
  couponOutranked: boolean;
}

interface Candidate {
  line: PriceLine;
  finalAmount: number;
}

/** Cena docelowa nie może zejść poniżej progu akceptowanego przez Stripe. */
function clampFinal(amount: number, ceiling: number): number {
  return Math.min(ceiling, Math.max(amount, MIN_CHARGE_GROSZE));
}

function saleCandidate(amount: number, sale: SaleInput): Candidate {
  if (sale.type === "fixed_price") {
    const finalAmount = clampFinal(sale.fixedPrice ?? amount, amount);

    return {
      finalAmount,
      line: {
        kind: "sale",
        sourceId: sale.id,
        name: sale.name,
        label: `cena ${formatPln(finalAmount)}`,
        amount: amount - finalAmount,
      },
    };
  }

  const { finalAmount, discountAmount } = computeDiscount(amount, {
    type: "percent",
    percentOff: sale.percentOff,
    amountOff: null,
  });

  return {
    finalAmount,
    line: {
      kind: "sale",
      sourceId: sale.id,
      name: sale.name,
      label: formatDiscountValue({
        type: "percent",
        percentOff: sale.percentOff,
        amountOff: null,
      }),
      amount: discountAmount,
    },
  };
}

function emailCandidate(
  amount: number,
  discount: EmailDiscountInput,
): Candidate {
  const value = {
    type: discount.type,
    percentOff: discount.percentOff,
    amountOff: discount.amountOff,
  };
  const { finalAmount, discountAmount } = computeDiscount(amount, value);

  return {
    finalAmount,
    line: {
      kind: "email",
      sourceId: discount.id,
      name: discount.name,
      label: formatDiscountValue(value),
      amount: discountAmount,
    },
  };
}

function couponCandidate(amount: number, coupon: CouponInput): Candidate {
  const value = {
    type: coupon.type,
    percentOff: coupon.percentOff,
    amountOff: coupon.amountOff,
  };
  const { finalAmount, discountAmount } = computeDiscount(amount, value);

  return {
    finalAmount,
    line: {
      kind: "coupon",
      sourceId: coupon.id,
      name: coupon.code,
      label: formatDiscountValue(value),
      amount: discountAmount,
    },
  };
}

function build(
  baseAmount: number,
  finalAmount: number,
  lines: PriceLine[],
  couponOutranked = false,
): PriceResult {
  return {
    baseAmount,
    finalAmount,
    totalDiscount: baseAmount - finalAmount,
    // Pozycje, które nic nie zbiły (np. cena docelowa wyższa niż bazowa),
    // tylko zaśmiecałyby podsumowanie.
    lines: lines.filter((line) => line.amount > 0),
    couponOutranked,
  };
}

export interface CalculatePriceInput {
  baseAmount: number;
  /** Przeceny już zweryfikowane jako czynne (isActive + okno czasowe). */
  sales?: SaleInput[];
  /** Zniżki mailowe już zweryfikowane i dopasowane do adresu klientki. */
  emailDiscounts?: EmailDiscountInput[];
  /** Kod już zweryfikowany (istnieje, czynny, ma wolne miejsce w puli). */
  coupon?: CouponInput | null;
}

export function calculatePrice({
  baseAmount,
  sales = [],
  emailDiscounts = [],
  coupon = null,
}: CalculatePriceInput): PriceResult {
  // --- 1. Obniżki automatyczne: wygrywa korzystniejsza, nie sumują się ---
  // Gdyby przez pomyłkę czynne były dwie przeceny naraz, konkurują tak samo
  // jak przecena ze zniżką mailową — klientka dostaje najniższą cenę.
  const automatic: Candidate[] = [
    ...sales.map((sale) => saleCandidate(baseAmount, sale)),
    ...emailDiscounts.map((discount) => emailCandidate(baseAmount, discount)),
  ];

  const bestAutomatic = automatic
    .filter((candidate) => candidate.line.amount > 0)
    .sort((a, b) => a.finalAmount - b.finalAmount)[0];

  const automaticFinal = bestAutomatic ? bestAutomatic.finalAmount : baseAmount;
  const automaticLines = bestAutomatic ? [bestAutomatic.line] : [];

  if (!coupon) {
    return build(baseAmount, automaticFinal, automaticLines);
  }

  // --- 2. Kod z prawem do łączenia: sekwencyjnie, od kwoty już obniżonej ---
  if (coupon.stackableWithSale) {
    const stacked = couponCandidate(automaticFinal, coupon);
    return build(baseAmount, stacked.finalAmount, [
      ...automaticLines,
      stacked.line,
    ]);
  }

  // --- 3. Kod bez łączenia: wygrywa wariant korzystniejszy dla klientki ---
  const solo = couponCandidate(baseAmount, coupon);

  if (solo.finalAmount < automaticFinal) {
    return build(baseAmount, solo.finalAmount, [solo.line]);
  }

  return build(baseAmount, automaticFinal, automaticLines, true);
}
