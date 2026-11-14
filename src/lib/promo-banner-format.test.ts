import { describe, expect, it } from "vitest";


import { formatPromoRange, resolveBannerText } from "./promo-banner-format";

// Tak zapisuje panel: początek 00:00, koniec 23:59:59.999 czasu polskiego.
const warsaw = (iso: string) => new Date(iso);

describe("formatPromoRange", () => {
  it("skraca zakres w obrębie miesiąca (start o północy PL = poprzedni dzień w UTC)", () => {
    expect(
      formatPromoRange(
        warsaw("2026-11-22T23:00:00.000Z"),
        warsaw("2026-11-30T22:59:59.999Z"),
      ),
    ).toBe("23–30.11.2026");
  });

  it("zakres przez przełom miesiąca", () => {
    expect(
      formatPromoRange(
        warsaw("2026-11-27T23:00:00.000Z"),
        warsaw("2026-12-02T22:59:59.999Z"),
      ),
    ).toBe("28.11–2.12.2026");
  });

  it("zakres przez przełom roku", () => {
    expect(
      formatPromoRange(
        warsaw("2026-12-27T23:00:00.000Z"),
        warsaw("2027-01-03T22:59:59.999Z"),
      ),
    ).toBe("28.12.2026–3.01.2027");
  });

  it("tylko początek / tylko koniec / brak okna", () => {
    expect(formatPromoRange(warsaw("2026-11-22T23:00:00.000Z"), null)).toBe(
      "od 23.11.2026",
    );
    expect(formatPromoRange(null, warsaw("2026-11-30T22:59:59.999Z"))).toBe(
      "do 30.11.2026",
    );
    expect(formatPromoRange(null, null)).toBeNull();
  });
});

describe("resolveBannerText", () => {
  it("własny tekst ma pierwszeństwo, pusty wraca do nazwy przeceny", () => {
    expect(resolveBannerText("BLACK FRIDAY", "Promocja listopad")).toBe(
      "BLACK FRIDAY",
    );
    expect(resolveBannerText("   ", "Promocja listopad")).toBe(
      "Promocja listopad",
    );
    expect(resolveBannerText(null, "Promocja listopad")).toBe(
      "Promocja listopad",
    );
  });
});
