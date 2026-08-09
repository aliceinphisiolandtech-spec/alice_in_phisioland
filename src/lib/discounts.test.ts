import { describe, expect, it } from "vitest";

import {
  computeDiscount,
  evaluateDiscount,
  formatDiscountValue,
  getDiscountStatus,
  remainingUses,
} from "@/lib/discounts";
import { MIN_CHARGE_GROSZE } from "@/lib/pricing";

/**
 * Domenowa logika rabatów — ta sama dla kodów, przecen i zniżek mailowych.
 *
 * Datę podajemy tu ZAWSZE jawnie (`at`), żeby wynik testu nie zależał od
 * prawdziwego zegara ani od przesunięcia z NEXT_PUBLIC_DEV_TODAY.
 */

const BASE = 10_900;
const NOW = new Date("2026-08-07T12:00:00");

const lifecycle = (
  overrides: Partial<Parameters<typeof evaluateDiscount>[0]> = {},
) => ({
  isActive: true,
  usageLimit: null,
  usedCount: 0,
  validFrom: null,
  validUntil: null,
  ...overrides,
});

describe("computeDiscount", () => {
  it("liczy rabat procentowy", () => {
    expect(
      computeDiscount(BASE, {
        type: "percent",
        percentOff: 20,
        amountOff: null,
      }),
    ).toEqual({ discountAmount: 2_180, finalAmount: 8_720 });
  });

  it("zaokrągla procent do pełnych groszy", () => {
    // 10900 * 33% = 3597 dokładnie; 10901 * 33% = 3597,33 -> 3597
    const result = computeDiscount(10_901, {
      type: "percent",
      percentOff: 33,
      amountOff: null,
    });

    expect(Number.isInteger(result.discountAmount)).toBe(true);
    expect(result.discountAmount).toBe(3_597);
  });

  it("liczy rabat kwotowy", () => {
    expect(
      computeDiscount(BASE, {
        type: "amount",
        percentOff: null,
        amountOff: 2_000,
      }),
    ).toEqual({ discountAmount: 2_000, finalAmount: 8_900 });
  });

  it("przycina kwotę do progu Stripe i przelicza rabat wstecz", () => {
    const result = computeDiscount(BASE, {
      type: "amount",
      percentOff: null,
      amountOff: 99_999,
    });

    expect(result.finalAmount).toBe(MIN_CHARGE_GROSZE);
    expect(result.discountAmount).toBe(BASE - MIN_CHARGE_GROSZE);
    expect(result.finalAmount + result.discountAmount).toBe(BASE);
  });

  it("nie podnosi ceny, gdy baza jest już niższa niż próg", () => {
    const result = computeDiscount(150, {
      type: "amount",
      percentOff: null,
      amountOff: 100,
    });

    expect(result.finalAmount).toBe(150);
    expect(result.discountAmount).toBe(0);
  });

  it("ujemna wartość rabatu nie podbija ceny", () => {
    const result = computeDiscount(BASE, {
      type: "amount",
      percentOff: null,
      amountOff: -500,
    });

    expect(result.finalAmount).toBe(BASE);
    expect(result.discountAmount).toBe(0);
  });
});

describe("formatDiscountValue", () => {
  it("procent", () => {
    expect(
      formatDiscountValue({ type: "percent", percentOff: 10, amountOff: null }),
    ).toBe("−10%");
  });

  it("kwota", () => {
    const label = formatDiscountValue({
      type: "amount",
      percentOff: null,
      amountOff: 2_000,
    });

    // Intl wstawia spację niełamliwą przed "zł" — porównujemy sam początek.
    expect(label.startsWith("−20,00")).toBe(true);
  });
});

describe("evaluateDiscount", () => {
  it("czynny rabat bez ograniczeń", () => {
    expect(evaluateDiscount(lifecycle(), NOW)).toEqual({ usable: true });
  });

  it("wyłączony ręcznie", () => {
    expect(evaluateDiscount(lifecycle({ isActive: false }), NOW)).toEqual({
      usable: false,
      reason: "inactive",
    });
  });

  it("jeszcze nie wystartował", () => {
    expect(
      evaluateDiscount(lifecycle({ validFrom: "2026-08-08T00:00:00" }), NOW),
    ).toEqual({ usable: false, reason: "not_started" });
  });

  it("po terminie", () => {
    expect(
      evaluateDiscount(
        lifecycle({ validUntil: "2026-08-06T23:59:59.999" }),
        NOW,
      ),
    ).toEqual({ usable: false, reason: "expired" });
  });

  it("ostatnia milisekunda okna jeszcze działa", () => {
    const endOfDay = new Date("2026-08-07T23:59:59.999");

    expect(
      evaluateDiscount(
        lifecycle({ validUntil: endOfDay.toISOString() }),
        endOfDay,
      ),
    ).toEqual({ usable: true });
  });

  it("pula wyczerpana", () => {
    expect(
      evaluateDiscount(lifecycle({ usageLimit: 20, usedCount: 20 }), NOW),
    ).toEqual({ usable: false, reason: "exhausted" });
  });

  it("limit przekroczony (miękki limit dopuszcza usedCount > usageLimit)", () => {
    expect(
      evaluateDiscount(lifecycle({ usageLimit: 20, usedCount: 21 }), NOW),
    ).toEqual({ usable: false, reason: "exhausted" });
  });

  it("brak limitu = brak ograniczenia liczby użyć", () => {
    expect(
      evaluateDiscount(lifecycle({ usageLimit: null, usedCount: 9_999 }), NOW),
    ).toEqual({ usable: true });
  });

  it("kolejność sprawdzeń: wyłączony ma pierwszeństwo przed wygasłym", () => {
    const result = evaluateDiscount(
      lifecycle({ isActive: false, validUntil: "2026-01-01T00:00:00" }),
      NOW,
    );

    expect(result).toEqual({ usable: false, reason: "inactive" });
  });

  it("przyjmuje daty jako Date i jako string", () => {
    const asDate = evaluateDiscount(
      lifecycle({ validFrom: new Date("2026-08-01T00:00:00") }),
      NOW,
    );
    const asString = evaluateDiscount(
      lifecycle({ validFrom: "2026-08-01T00:00:00" }),
      NOW,
    );

    expect(asDate).toEqual(asString);
  });
});

describe("getDiscountStatus", () => {
  it("mapuje wynik oceny na plakietkę panelu", () => {
    expect(getDiscountStatus(lifecycle(), NOW).key).toBe("active");
    expect(getDiscountStatus(lifecycle({ isActive: false }), NOW).key).toBe(
      "inactive",
    );
    expect(
      getDiscountStatus(lifecycle({ validFrom: "2026-09-01T00:00:00" }), NOW)
        .key,
    ).toBe("not_started");
  });

  it("każdy status ma etykietę i kolor", () => {
    const status = getDiscountStatus(
      lifecycle({ usageLimit: 1, usedCount: 1 }),
      NOW,
    );

    expect(status.key).toBe("exhausted");
    expect(status.label).toBe("Wyczerpany");
    expect(status.tone).not.toBe("");
  });
});

describe("remainingUses", () => {
  it("zwraca null przy braku limitu", () => {
    expect(remainingUses({ usageLimit: null, usedCount: 5 })).toBeNull();
  });

  it("liczy pozostałą pulę", () => {
    expect(remainingUses({ usageLimit: 20, usedCount: 7 })).toBe(13);
  });

  it("nie schodzi poniżej zera przy przekroczonym limicie", () => {
    expect(remainingUses({ usageLimit: 20, usedCount: 21 })).toBe(0);
  });
});
