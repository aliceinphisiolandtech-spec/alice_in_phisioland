import { describe, expect, it } from "vitest";
import { resolveWaitlistPageStatus } from "@/lib/waitlist-status";

/**
 * Testy okna zapisów. Sprawdzamy przede wszystkim granice i sprzeczne
 * ustawienia — czyli te przypadki, w których pomyłka objawia się dopiero
 * w trakcie trwającej kampanii i kosztuje realne zapisy.
 */

const NOW = new Date("2026-08-10T12:00:00.000Z");

function page(overrides: Partial<Parameters<typeof resolveWaitlistPageStatus>[0]> = {}) {
  return { isActive: true, opensAt: null, closesAt: null, ...overrides };
}

describe("resolveWaitlistPageStatus", () => {
  it("kampania bez dat i włączona przyjmuje zapisy", () => {
    expect(resolveWaitlistPageStatus(page(), NOW)).toBe("open");
  });

  it("wyłącznik ma pierwszeństwo przed trwającym oknem czasowym", () => {
    const status = resolveWaitlistPageStatus(
      page({
        isActive: false,
        opensAt: new Date("2026-08-01T00:00:00.000Z"),
        closesAt: new Date("2026-08-31T00:00:00.000Z"),
      }),
      NOW,
    );

    expect(status).toBe("closed");
  });

  it("przed datą startu zapisy jeszcze nie ruszyły", () => {
    const status = resolveWaitlistPageStatus(
      page({ opensAt: new Date("2026-08-11T00:00:00.000Z") }),
      NOW,
    );

    expect(status).toBe("not_started");
  });

  it("po dacie zamknięcia zapisy są zamknięte", () => {
    const status = resolveWaitlistPageStatus(
      page({ closesAt: new Date("2026-08-09T23:59:59.999Z") }),
      NOW,
    );

    expect(status).toBe("closed");
  });

  it("dokładnie w sekundzie startu zapisy są już otwarte", () => {
    expect(resolveWaitlistPageStatus(page({ opensAt: NOW }), NOW)).toBe("open");
  });

  it("dokładnie w sekundzie zamknięcia zapisy są jeszcze otwarte", () => {
    expect(resolveWaitlistPageStatus(page({ closesAt: NOW }), NOW)).toBe("open");
  });

  it("sprzeczne daty (start po zamknięciu) dają 'jeszcze nie', nie 'już po'", () => {
    const status = resolveWaitlistPageStatus(
      page({
        opensAt: new Date("2026-09-01T00:00:00.000Z"),
        closesAt: new Date("2026-08-01T00:00:00.000Z"),
      }),
      NOW,
    );

    expect(status).toBe("not_started");
  });

  describe("twardy limit miejsc", () => {
    it("bez limitu liczba zapisów nie ma znaczenia", () => {
      const status = resolveWaitlistPageStatus(
        page({ maxSignups: null, signupCount: 10_000 }),
        NOW,
      );

      expect(status).toBe("open");
    });

    it("ostatnie wolne miejsce jeszcze wchodzi", () => {
      const status = resolveWaitlistPageStatus(
        page({ maxSignups: 100, signupCount: 99 }),
        NOW,
      );

      expect(status).toBe("open");
    });

    it("po zajęciu ostatniego miejsca lista jest zamknięta", () => {
      const status = resolveWaitlistPageStatus(
        page({ maxSignups: 100, signupCount: 100 }),
        NOW,
      );

      expect(status).toBe("full");
    });

    it("przekroczenie limitu też daje komplet, nie otwarte", () => {
      const status = resolveWaitlistPageStatus(
        page({ maxSignups: 100, signupCount: 143 }),
        NOW,
      );

      expect(status).toBe("full");
    });

    it("limit 0 zatrzymuje zapisy natychmiast", () => {
      const status = resolveWaitlistPageStatus(
        page({ maxSignups: 0, signupCount: 0 }),
        NOW,
      );

      expect(status).toBe("full");
    });

    it("wyłącznik ma pierwszeństwo przed limitem", () => {
      const status = resolveWaitlistPageStatus(
        page({ isActive: false, maxSignups: 100, signupCount: 5 }),
        NOW,
      );

      expect(status).toBe("closed");
    });

    it("kampania sprzed startu pokazuje 'jeszcze nie', a nie 'brak miejsc'", () => {
      const status = resolveWaitlistPageStatus(
        page({
          opensAt: new Date("2026-08-11T00:00:00.000Z"),
          maxSignups: 10,
          signupCount: 10,
        }),
        NOW,
      );

      expect(status).toBe("not_started");
    });

    it("po terminie pokazuje 'zamknięte', a nie 'brak miejsc'", () => {
      const status = resolveWaitlistPageStatus(
        page({
          closesAt: new Date("2026-08-09T23:59:59.999Z"),
          maxSignups: 10,
          signupCount: 10,
        }),
        NOW,
      );

      expect(status).toBe("closed");
    });
  });

  it("sama data startu w przeszłości nie zamyka zapisów", () => {
    const status = resolveWaitlistPageStatus(
      page({ opensAt: new Date("2026-07-01T00:00:00.000Z") }),
      NOW,
    );

    expect(status).toBe("open");
  });
});
