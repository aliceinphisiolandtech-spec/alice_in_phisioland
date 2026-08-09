import { describe, expect, it } from "vitest";
import { splitAroundHighlight } from "@/lib/waitlist-text";

/**
 * Podświetlenie fragmentu nagłówka. Najważniejszy przypadek to ten, w którym
 * fragment NIE pasuje — nagłówek musi wtedy wyjść w całości, bo to treść,
 * za którą zapłacono już zasięgiem w poście.
 */
describe("splitAroundHighlight", () => {
  it("rozbija nagłówek wokół wyróżnionego fragmentu", () => {
    expect(splitAroundHighlight("Promocja letnia rusza", "letnia")).toEqual({
      before: "Promocja ",
      highlighted: "letnia",
      after: " rusza",
    });
  });

  it("brak fragmentu oddaje nagłówek w całości", () => {
    expect(splitAroundHighlight("Promocja letnia", null)).toEqual({
      before: "Promocja letnia",
      highlighted: "",
      after: "",
    });
  });

  it("sam biały znak traktujemy jak brak fragmentu", () => {
    expect(splitAroundHighlight("Promocja letnia", "   ")).toEqual({
      before: "Promocja letnia",
      highlighted: "",
      after: "",
    });
  });

  it("fragment spoza nagłówka nie psuje treści", () => {
    expect(splitAroundHighlight("Promocja letnia", "zimowa")).toEqual({
      before: "Promocja letnia",
      highlighted: "",
      after: "",
    });
  });

  it("dopasowuje bez rozróżniania wielkości liter", () => {
    const result = splitAroundHighlight("Promocja Letnia", "letnia");

    expect(result.highlighted).toBe("Letnia");
  });

  it("zwraca pisownię z nagłówka, nie z pola wyróżnienia", () => {
    // Inaczej samo ustawienie podświetlenia zmieniałoby treść nagłówka.
    const result = splitAroundHighlight("PROMOCJA letnia", "promocja");

    expect(result.highlighted).toBe("PROMOCJA");
    expect(result.before + result.highlighted + result.after).toBe(
      "PROMOCJA letnia",
    );
  });

  it("podświetla pierwsze wystąpienie, gdy fragment powtarza się", () => {
    const result = splitAroundHighlight("lato, lato, lato", "lato");

    expect(result.before).toBe("");
    expect(result.highlighted).toBe("lato");
    expect(result.after).toBe(", lato, lato");
  });

  it("złożenie części zawsze odtwarza oryginalny nagłówek", () => {
    const headline = "Zapisy na promocję letnią 2026";
    const result = splitAroundHighlight(headline, "promocję");

    expect(result.before + result.highlighted + result.after).toBe(headline);
  });
});
