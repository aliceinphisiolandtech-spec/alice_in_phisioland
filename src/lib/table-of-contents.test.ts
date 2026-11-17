import { describe, expect, it } from "vitest";
import {
  TABLE_OF_CONTENTS_DEFAULT,
  numberChapters,
  toRoman,
} from "./table-of-contents";
import { tableOfContentsSchema } from "./validators/landing";

describe("toRoman", () => {
  it("zamienia liczby na cyfry rzymskie", () => {
    expect([1, 4, 9, 10, 14, 19, 30].map(toRoman)).toEqual([
      "I",
      "IV",
      "IX",
      "X",
      "XIV",
      "XIX",
      "XXX",
    ]);
  });
});

describe("numberChapters", () => {
  it("numeruje kolejne rozdziały, pomijając pozycje bez numeru", () => {
    const out = numberChapters([
      { title: "A", numbered: true },
      { title: "Przerywnik", numbered: false },
      { title: "B", numbered: true },
    ]);
    expect(out.map((c) => c.numeral)).toEqual(["I", null, "II"]);
  });

  it("domyślny spis: IX rozdziałów + Bibliografia bez numeru", () => {
    const out = numberChapters(TABLE_OF_CONTENTS_DEFAULT.chapters);
    expect(out.at(-2)?.numeral).toBe("IX");
    expect(out.at(-1)).toEqual({ title: "Bibliografia", numeral: null });
  });
});

describe("tableOfContentsSchema", () => {
  it("akceptuje treść domyślną", () => {
    expect(
      tableOfContentsSchema.safeParse(TABLE_OF_CONTENTS_DEFAULT).success,
    ).toBe(true);
  });
});
