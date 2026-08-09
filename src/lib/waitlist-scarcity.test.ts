import { describe, expect, it } from "vitest";
import { resolveScarcity, resolveSeats } from "@/lib/waitlist-scarcity";

/**
 * Licznik miejsc. Testujemy przede wszystkim niezmienniki, bo to one decydują,
 * czy licznik nie zacznie kiedyś pokazywać czegoś absurdalnego na żywej stronie
 * (zera, liczby ujemnej, puli mniejszej niż liczba zapisanych).
 */

describe("resolveScarcity (pula wyliczana, bez prawdziwego limitu)", () => {
  it("pusta lista pokazuje kilka wolnych miejsc, nie komplet", () => {
    expect(resolveScarcity(0)).toMatchObject({ total: 10, left: 6 });
  });

  it("wolne miejsca spadają wraz z zapisami", () => {
    expect(resolveScarcity(1).left).toBe(5);
    expect(resolveScarcity(3).left).toBe(3);
    expect(resolveScarcity(5).left).toBe(1);
  });

  it("gdy miejsca się kończą, pula przeskakuje o próg wyżej", () => {
    expect(resolveScarcity(5)).toMatchObject({ total: 10, left: 1 });
    expect(resolveScarcity(6)).toMatchObject({ total: 20, left: 10 });
    expect(resolveScarcity(16)).toMatchObject({ total: 30, left: 10 });
  });

  it("nigdy nie pokazuje zera wolnych miejsc — to jest cały sens licznika", () => {
    for (let signups = 0; signups <= 500; signups += 1) {
      expect(resolveScarcity(signups).left).toBeGreaterThanOrEqual(1);
    }
  });

  it("pula zawsze mieści liczbę zapisanych", () => {
    for (let signups = 0; signups <= 500; signups += 7) {
      const { total, left } = resolveScarcity(signups);

      expect(total).toBeGreaterThan(signups);
      expect(left).toBeLessThanOrEqual(total);
    }
  });

  it("pula nigdy nie maleje przy kolejnym zapisie", () => {
    let previous = 0;

    for (let signups = 0; signups <= 300; signups += 1) {
      const { total } = resolveScarcity(signups);
      expect(total).toBeGreaterThanOrEqual(previous);
      previous = total;
    }
  });

  it("nie wywraca się na wartościach niemożliwych", () => {
    expect(resolveScarcity(-5).left).toBeGreaterThanOrEqual(1);
    expect(resolveScarcity(Number.NaN).total).toBe(10);
  });

  it("procent zapełnienia mieści się w zakresie 0–100", () => {
    for (let signups = 0; signups <= 200; signups += 3) {
      const { filledPercent } = resolveScarcity(signups);

      expect(filledPercent).toBeGreaterThanOrEqual(0);
      expect(filledPercent).toBeLessThanOrEqual(100);
    }
  });
});

describe("resolveSeats (prawdziwy limit ma pierwszeństwo)", () => {
  it("przy ustawionym limicie pokazuje liczby zgodne z rzeczywistością", () => {
    expect(resolveSeats(30, 100)).toMatchObject({ total: 100, left: 70 });
  });

  it("po wyczerpaniu prawdziwego limitu pokazuje zero — bez upiększania", () => {
    expect(resolveSeats(100, 100).left).toBe(0);
    expect(resolveSeats(140, 100).left).toBe(0);
  });

  it("brak limitu przełącza na pulę wyliczaną", () => {
    expect(resolveSeats(0, null)).toEqual(resolveScarcity(0));
    expect(resolveSeats(42, null)).toEqual(resolveScarcity(42));
  });

  it("limit 0 nie dzieli przez zero — wpada w pulę wyliczaną", () => {
    expect(resolveSeats(0, 0)).toEqual(resolveScarcity(0));
  });
});
