import { describe, expect, it } from "vitest";

import {
  formatBoundary,
  isoToLocalInput,
  localInputToIso,
  parseLocalInput,
  toLocalInput,
} from "@/lib/date-input";

/**
 * Konwersje między datą z bazy (ISO/UTC) a wartością pola formularza (czas lokalny).
 *
 * Najważniejsza reguła: okno promocji ustawia się w PEŁNYCH DOBACH — kalendarz
 * dopisuje 00:00 do początku i 23:59 do końca, a `localInputToIso(..., true)`
 * domyka wybraną minutę do :59.999. Bez tego promocja "do 31.08" kończyłaby się
 * minutę (albo dobę) wcześniej, niż widać w panelu.
 */

describe("toLocalInput / parseLocalInput", () => {
  it("zamienia datę na wartość pola w czasie lokalnym", () => {
    expect(toLocalInput(new Date(2026, 7, 31, 23, 59))).toBe(
      "2026-08-31T23:59",
    );
  });

  it("uzupełnia zerami jednocyfrowe składowe", () => {
    expect(toLocalInput(new Date(2026, 0, 5, 8, 7))).toBe("2026-01-05T08:07");
  });

  it("round-trip zachowuje wartość", () => {
    const value = "2026-08-31T23:59";
    const parsed = parseLocalInput(value);

    expect(parsed).not.toBeNull();
    expect(toLocalInput(parsed!)).toBe(value);
  });

  it("odrzuca wartość w złym formacie", () => {
    expect(parseLocalInput("")).toBeNull();
    expect(parseLocalInput("31.08.2026")).toBeNull();
    expect(parseLocalInput("2026-08-31")).toBeNull();
  });
});

describe("localInputToIso", () => {
  it("bez `inclusive` zostawia sekundy na zerze", () => {
    const iso = localInputToIso("2026-08-01T00:00");

    expect(iso).not.toBeNull();
    expect(new Date(iso!).getSeconds()).toBe(0);
    expect(new Date(iso!).getMilliseconds()).toBe(0);
  });

  it("`inclusive` domyka wybraną minutę do :59.999", () => {
    const iso = localInputToIso("2026-08-31T23:59", true);
    const date = new Date(iso!);

    expect(date.getSeconds()).toBe(59);
    expect(date.getMilliseconds()).toBe(999);
    // Ostatnia milisekunda 31 sierpnia, a nie pierwsza 1 września.
    expect(date.getDate()).toBe(31);
    expect(date.getMonth()).toBe(7);
  });

  it("koniec okna wypada po jego początku (ta sama doba)", () => {
    const from = localInputToIso("2026-08-01T00:00");
    const until = localInputToIso("2026-08-01T23:59", true);

    expect(new Date(until!).getTime()).toBeGreaterThan(
      new Date(from!).getTime(),
    );
  });

  it("zwraca null przy pustej wartości", () => {
    expect(localInputToIso("")).toBeNull();
    expect(localInputToIso("", true)).toBeNull();
  });
});

describe("isoToLocalInput", () => {
  it("przepisuje ISO na wartość pola", () => {
    const iso = new Date(2026, 7, 31, 23, 59).toISOString();

    expect(isoToLocalInput(iso)).toBe("2026-08-31T23:59");
  });

  it("pusta wartość dla null i śmieci", () => {
    expect(isoToLocalInput(null)).toBe("");
    expect(isoToLocalInput("nie-data")).toBe("");
  });
});

describe("formatBoundary", () => {
  it("granica całej doby pokazuje samą datę", () => {
    const from = new Date(2026, 7, 1, 0, 0).toISOString();
    const until = new Date(2026, 7, 31, 23, 59).toISOString();

    expect(formatBoundary(from, "from")).toBe("01.08.2026");
    expect(formatBoundary(until, "until")).toBe("31.08.2026");
  });

  it("nietypowa godzina jest pokazywana", () => {
    const from = new Date(2026, 7, 1, 18, 30).toISOString();

    expect(formatBoundary(from, "from")).toContain("18:30");
  });

  it("pusta wartość dla nieparsowalnej daty", () => {
    expect(formatBoundary("nie-data", "from")).toBe("");
  });
});
