import { describe, expect, it } from "vitest";

import { calculatePrice, type PriceResult } from "@/lib/pricing-engine";
import { MIN_CHARGE_GROSZE } from "@/lib/pricing";

/**
 * Reguły nakładania obniżek — ustalone z klientką i opisane w docs/system-rabatowy.md §3.
 *
 * To jedyne miejsce w systemie, w którym z ceny bazowej i zestawu obniżek powstaje
 * kwota do zapłaty, więc testujemy tu przede wszystkim REGUŁY (kto z kim wygrywa),
 * a nie arytmetykę procentów.
 */

const BASE = 10_900; // 109,00 zł — domyślna cena sprzedaży

const percentSale = (percentOff: number, id = "sale-1") => ({
  id,
  name: "Promocja premierowa",
  type: "percent",
  percentOff,
  fixedPrice: null,
});

const fixedSale = (fixedPrice: number, id = "sale-fixed") => ({
  id,
  name: "Cena docelowa",
  type: "fixed_price",
  percentOff: null,
  fixedPrice,
});

const percentEmail = (percentOff: number, id = "email-1") => ({
  id,
  name: "Lista VIP",
  type: "percent",
  percentOff,
  amountOff: null,
});

const percentCoupon = (percentOff: number, stackableWithSale = false) => ({
  id: "code-1",
  code: "ALICJA10",
  type: "percent",
  percentOff,
  amountOff: null,
  stackableWithSale,
});

const amountCoupon = (amountOff: number, stackableWithSale = false) => ({
  id: "code-2",
  code: "MINUS20",
  type: "amount",
  percentOff: null,
  amountOff,
  stackableWithSale,
});

/**
 * Niezmienniki, które musi spełniać KAŻDY wynik — niezależnie od tego, jaka
 * kombinacja obniżek do niego doprowadziła. Ich złamanie oznacza, że klientka
 * zobaczy rozbicie, które nie sumuje się do kwoty pobranej przez Stripe.
 */
function expectConsistent(result: PriceResult) {
  const sumOfLines = result.lines.reduce((sum, line) => sum + line.amount, 0);

  expect(sumOfLines).toBe(result.totalDiscount);
  expect(result.baseAmount - result.totalDiscount).toBe(result.finalAmount);
  expect(result.finalAmount).toBeGreaterThanOrEqual(MIN_CHARGE_GROSZE);
  // Pozycja, która nic nie zbiła, tylko zaśmiecałaby podsumowanie.
  expect(result.lines.every((line) => line.amount > 0)).toBe(true);
}

describe("brak obniżek", () => {
  it("zwraca cenę bazową bez pozycji", () => {
    const result = calculatePrice({ baseAmount: BASE });

    expect(result.finalAmount).toBe(BASE);
    expect(result.totalDiscount).toBe(0);
    expect(result.lines).toHaveLength(0);
    expect(result.couponOutranked).toBe(false);
    expectConsistent(result);
  });
});

describe("przecena", () => {
  it("nalicza procent od ceny bazowej", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [percentSale(20)],
    });

    expect(result.finalAmount).toBe(8_720);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].kind).toBe("sale");
    expect(result.lines[0].label).toBe("−20%");
    expectConsistent(result);
  });

  it("wariant ceny docelowej ustawia kwotę wprost", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [fixedSale(8_900)],
    });

    expect(result.finalAmount).toBe(8_900);
    expect(result.totalDiscount).toBe(2_000);
    expect(result.lines[0].label).toMatch(/^cena /);
    expectConsistent(result);
  });

  it("cena docelowa wyższa od bazowej nie podnosi ceny", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [fixedSale(15_000)],
    });

    expect(result.finalAmount).toBe(BASE);
    expect(result.lines).toHaveLength(0);
    expectConsistent(result);
  });
});

describe("obniżki automatyczne nie sumują się", () => {
  it("przecena i zniżka mailowa konkurują — wygrywa niższa cena", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [percentSale(20)],
      emailDiscounts: [percentEmail(30)],
    });

    // 30% (zniżka mailowa) daje 7630 — gdyby się sumowały, wyszłoby 6104.
    expect(result.finalAmount).toBe(7_630);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].kind).toBe("email");
    expectConsistent(result);
  });

  it("dwie czynne przeceny też konkurują, a nie sumują", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [percentSale(10, "a"), percentSale(25, "b")],
    });

    expect(result.finalAmount).toBe(8_175);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].sourceId).toBe("b");
    expectConsistent(result);
  });
});

describe("kod rabatowy z prawem do łączenia", () => {
  it("liczy się sekwencyjnie — od kwoty już obniżonej", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [percentSale(20)],
      coupon: percentCoupon(10, true),
    });

    // 10900 − 20% = 8720; 8720 − 10% = 7848 (NIE 10900 − 30%).
    expect(result.finalAmount).toBe(7_848);
    expect(result.lines.map((line) => line.kind)).toEqual(["sale", "coupon"]);
    expect(result.couponOutranked).toBe(false);
    expectConsistent(result);
  });
});

describe("kod rabatowy bez prawa do łączenia", () => {
  it("przegrywa z korzystniejszą przeceną i jest o tym sygnał", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [percentSale(20)],
      coupon: percentCoupon(10),
    });

    expect(result.finalAmount).toBe(8_720);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].kind).toBe("sale");
    // Koszyk pokazuje wyjaśnienie zamiast po cichu zignorować wpisany kod.
    expect(result.couponOutranked).toBe(true);
    expectConsistent(result);
  });

  it("wygrywa, gdy daje niższą cenę niż przecena", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [percentSale(20)],
      coupon: percentCoupon(30),
    });

    expect(result.finalAmount).toBe(7_630);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].kind).toBe("coupon");
    expect(result.couponOutranked).toBe(false);
    expectConsistent(result);
  });

  it("przy remisie zostaje obniżka automatyczna", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [percentSale(20)],
      coupon: percentCoupon(20),
    });

    expect(result.finalAmount).toBe(8_720);
    expect(result.lines[0].kind).toBe("sale");
    expect(result.couponOutranked).toBe(true);
    expectConsistent(result);
  });

  it("działa też bez żadnej obniżki automatycznej", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      coupon: amountCoupon(2_000),
    });

    expect(result.finalAmount).toBe(8_900);
    expect(result.lines[0].kind).toBe("coupon");
    expectConsistent(result);
  });
});

describe("próg Stripe", () => {
  it("rabat kwotowy większy niż cena przycina kwotę do minimum", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      coupon: amountCoupon(50_000),
    });

    expect(result.finalAmount).toBe(MIN_CHARGE_GROSZE);
    // Rabat przeliczony wstecz, żeby rozbicie nadal się zgadzało.
    expect(result.totalDiscount).toBe(BASE - MIN_CHARGE_GROSZE);
    expectConsistent(result);
  });

  it("stackowanie nie zbija ceny poniżej progu", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [percentSale(95)],
      coupon: amountCoupon(50_000, true),
    });

    expect(result.finalAmount).toBe(MIN_CHARGE_GROSZE);
    expectConsistent(result);
  });

  it("cena docelowa poniżej progu również jest przycinana", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [fixedSale(1)],
    });

    expect(result.finalAmount).toBe(MIN_CHARGE_GROSZE);
    expectConsistent(result);
  });
});

describe("snapshot pozycji", () => {
  it("zapisuje ID źródła i nazwę widoczną dla klientki", () => {
    const result = calculatePrice({
      baseAmount: BASE,
      sales: [percentSale(20, "sale-abc")],
      coupon: percentCoupon(10, true),
    });

    const sale = result.lines.find((line) => line.kind === "sale");
    const coupon = result.lines.find((line) => line.kind === "coupon");

    // Po sourceId webhook nalicza zużycie właściwej promocji mimo zmiany nazwy.
    expect(sale?.sourceId).toBe("sale-abc");
    expect(sale?.name).toBe("Promocja premierowa");
    expect(coupon?.sourceId).toBe("code-1");
    expect(coupon?.name).toBe("ALICJA10");
  });
});
