import { describe, expect, it } from "vitest";
import {
  RETENTION_YEARS,
  WARNING_DAYS,
  describeRetention,
  resolveRetention,
  retentionCutoff,
  retentionWarningCutoff,
} from "@/lib/waitlist-retention";

/**
 * Okres przechowywania. Testujemy granice, bo pomyłka o jeden dzień znaczy tu
 * albo trzymanie danych ponad zadeklarowany czas, albo skasowanie ich za
 * wcześnie — a kasowanie jest nieodwracalne.
 */

const NOW = new Date("2026-08-08T12:00:00.000Z");

/** Data zapisu oddalona o zadaną liczbę dni od terminu usunięcia. */
function signupWithDaysLeft(days: number): Date {
  const signedUp = new Date(NOW);
  signedUp.setDate(signedUp.getDate() + days);
  signedUp.setFullYear(signedUp.getFullYear() - RETENTION_YEARS);
  return signedUp;
}

describe("resolveRetention", () => {
  it("świeży zapis jest w porządku", () => {
    const verdict = resolveRetention(new Date("2026-08-01T10:00:00.000Z"), NOW);

    expect(verdict.status).toBe("ok");
    expect(verdict.daysLeft).toBeGreaterThan(WARNING_DAYS);
  });

  it("termin usunięcia to dokładnie zapis + 3 lata", () => {
    const verdict = resolveRetention(new Date("2026-08-08T12:00:00.000Z"), NOW);

    expect(verdict.deleteAt.toISOString()).toBe("2029-08-08T12:00:00.000Z");
  });

  it("dzień przed terminem to jeszcze nie zaległość", () => {
    const verdict = resolveRetention(signupWithDaysLeft(1), NOW);

    expect(verdict.status).toBe("soon");
    expect(verdict.daysLeft).toBe(1);
  });

  it("po upływie terminu wchodzi stan 'do usunięcia'", () => {
    const verdict = resolveRetention(signupWithDaysLeft(-1), NOW);

    expect(verdict.status).toBe("due");
    expect(verdict.daysLeft).toBeLessThanOrEqual(0);
  });

  it("ostrzegamy dokładnie od WARNING_DAYS przed terminem", () => {
    expect(resolveRetention(signupWithDaysLeft(WARNING_DAYS), NOW).status).toBe(
      "soon",
    );
    expect(
      resolveRetention(signupWithDaysLeft(WARNING_DAYS + 1), NOW).status,
    ).toBe("ok");
  });

  it("zaległość liczona jest w pełnych dobach", () => {
    const verdict = resolveRetention(signupWithDaysLeft(-14), NOW);

    expect(verdict.daysLeft).toBe(-14);
  });

  it("uwzględnia rok przestępny, bo liczymy latami, nie dobami", () => {
    // 29 lutego + 3 lata w JS daje 1 marca — i o to chodzi, data ma być
    // przewidywalna dla człowieka czytającego politykę, a nie liczona w dobach.
    const verdict = resolveRetention(
      new Date("2024-02-29T00:00:00.000Z"),
      NOW,
    );

    expect(verdict.deleteAt.getUTCFullYear()).toBe(2027);
  });
});

describe("granice do zapytań w bazie", () => {
  it("cutoff odcina zapisy starsze niż okres przechowywania", () => {
    const cutoff = retentionCutoff(NOW);

    expect(cutoff.getUTCFullYear()).toBe(NOW.getUTCFullYear() - RETENTION_YEARS);
    // Wszystko starsze od cutoffu musi wychodzić jako "due".
    const older = new Date(cutoff.getTime() - 1000);
    expect(resolveRetention(older, NOW).status).toBe("due");
  });

  it("granica ostrzeżenia obejmuje też zapisy zbliżające się do terminu", () => {
    const warning = retentionWarningCutoff(NOW);

    expect(warning.getTime()).toBeGreaterThan(retentionCutoff(NOW).getTime());
    // Zapis dokładnie na granicy ostrzeżenia nie może być jeszcze "ok".
    expect(resolveRetention(warning, NOW).status).not.toBe("ok");
  });
});

describe("describeRetention", () => {
  it("opisuje czas do terminu", () => {
    expect(describeRetention(resolveRetention(signupWithDaysLeft(1), NOW))).toBe(
      "zostaje 1 dzień",
    );
    expect(
      describeRetention(resolveRetention(signupWithDaysLeft(12), NOW)),
    ).toBe("zostaje 12 dni");
  });

  it("opisuje zaległość", () => {
    expect(
      describeRetention(resolveRetention(signupWithDaysLeft(-5), NOW)),
    ).toBe("5 dni po terminie");
    expect(
      describeRetention(resolveRetention(signupWithDaysLeft(-1), NOW)),
    ).toBe("1 dzień po terminie");
  });

  it("termin mijający dzisiaj nazywa po imieniu", () => {
    expect(describeRetention(resolveRetention(signupWithDaysLeft(0), NOW))).toBe(
      "termin minął dzisiaj",
    );
  });
});
