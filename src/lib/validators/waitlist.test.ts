import { describe, expect, it } from "vitest";
import {
  SaveWaitlistPageSchema,
  slugifyWaitlistName,
} from "@/lib/validators/waitlist";

/**
 * Testy kreatora stron zapisów. Skupiamy się na tym, czego nie widać
 * po kliknięciu „zapisz": normalizacji sluga (bo to trafia do linku w poście)
 * i regułach, które mają zatrzymać opublikowanie strony nie do użycia.
 */

/** Minimalny poprawny komplet — testy nadpisują tylko to, co sprawdzają. */
function validInput(overrides: Record<string, unknown> = {}) {
  return {
    slug: "promocja-lato",
    name: "Promocja letnia 2026",
    headline: "Bądź pierwsza w kolejce",
    highlight: "",
    description: "Szykuję wakacyjną ofertę na e-book i szkolenia.",
    ctaLabel: "Zapisz mnie",
    footnote: "",
    successTitle: "Jesteś na liście!",
    successMessage: "Dam znać mailem, gdy ruszy promocja.",
    consentText:
      "Zgadzam się na otrzymywanie informacji handlowych na podany adres e-mail.",
    mailerliteGroupId: "",
    collectName: false,
    layoutVariant: "card",
    theme: "forest",
    heroImageUrl: "",
    ogImageUrl: "",
    backgroundImageUrl: "",
    overlayOpacity: 50,
    isActive: true,
    opensAt: null,
    closesAt: null,
    maxSignups: null,
    closedMessage: "",
    ...overrides,
  };
}

describe("slugifyWaitlistName", () => {
  it("zamienia spacje na myślniki i schodzi do małych liter", () => {
    expect(slugifyWaitlistName("Promocja Letnia 2026")).toBe(
      "promocja-letnia-2026",
    );
  });

  it("rozkłada polskie znaki diakrytyczne", () => {
    expect(slugifyWaitlistName("Zapisy na ćwiczenia ręką")).toBe(
      "zapisy-na-cwiczenia-reka",
    );
  });

  it("obsługuje 'ł', którego sama normalizacja nie rozkłada", () => {
    expect(slugifyWaitlistName("Późna jesień")).toBe("pozna-jesien");
  });

  it("nie zostawia myślnika na początku ani na końcu", () => {
    expect(slugifyWaitlistName("  ...Lato!!!  ")).toBe("lato");
  });

  it("skleja ciągi znaków specjalnych w pojedynczy myślnik", () => {
    expect(slugifyWaitlistName("e-book // tom 1")).toBe("e-book-tom-1");
  });

  it("przycina do 60 znaków i nie kończy myślnikiem", () => {
    const result = slugifyWaitlistName("a".repeat(58) + " bcd");

    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.endsWith("-")).toBe(false);
  });
});

describe("SaveWaitlistPageSchema", () => {
  it("przyjmuje poprawny komplet danych", () => {
    expect(SaveWaitlistPageSchema.safeParse(validInput()).success).toBe(true);
  });

  it("puste pola opcjonalne normalizuje do null, nie do pustego napisu", () => {
    const result = SaveWaitlistPageSchema.parse(validInput());

    expect(result.highlight).toBeNull();
    expect(result.footnote).toBeNull();
    expect(result.heroImageUrl).toBeNull();
    expect(result.mailerliteGroupId).toBeNull();
  });

  it("odrzuca slug zarezerwowany dla ścieżek systemowych", () => {
    const result = SaveWaitlistPageSchema.safeParse(
      validInput({ slug: "admin" }),
    );

    expect(result.success).toBe(false);
  });

  it("odrzuca slug z polskimi znakami i spacjami", () => {
    expect(
      SaveWaitlistPageSchema.safeParse(validInput({ slug: "późne lato" }))
        .success,
    ).toBe(false);
  });

  it("odrzuca datę zakończenia wcześniejszą niż rozpoczęcia", () => {
    const result = SaveWaitlistPageSchema.safeParse(
      validInput({
        opensAt: "2026-08-20T00:00:00.000Z",
        closesAt: "2026-08-10T23:59:59.999Z",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("closesAt");
  });

  it("układ 'pełne tło' bez grafiki jest odrzucany", () => {
    const result = SaveWaitlistPageSchema.safeParse(
      validInput({ layoutVariant: "hero", heroImageUrl: "" }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("heroImageUrl");
  });

  it("układ 'pełne tło' z grafiką przechodzi", () => {
    const result = SaveWaitlistPageSchema.safeParse(
      validInput({
        layoutVariant: "hero",
        heroImageUrl: "https://images.unsplash.com/photo-1",
      }),
    );

    expect(result.success).toBe(true);
  });

  it("odrzuca adres grafiki bez http(s) — trafia wprost do src i og:image", () => {
    expect(
      SaveWaitlistPageSchema.safeParse(
        validInput({ heroImageUrl: "javascript:alert(1)" }),
      ).success,
    ).toBe(false);

    expect(
      SaveWaitlistPageSchema.safeParse(validInput({ heroImageUrl: "/lokalny.png" }))
        .success,
    ).toBe(false);
  });

  it("wymaga sensownej treści zgody — pusta niczego nie dowodzi", () => {
    expect(
      SaveWaitlistPageSchema.safeParse(validInput({ consentText: "zgoda" }))
        .success,
    ).toBe(false);
  });

  describe("krycie nakładki nad zdjęciem", () => {
    it("przyjmuje pełny zakres 0–100", () => {
      for (const overlayOpacity of [0, 1, 50, 99, 100]) {
        expect(
          SaveWaitlistPageSchema.safeParse(validInput({ overlayOpacity }))
            .success,
        ).toBe(true);
      }
    });

    it("odrzuca wartości spoza zakresu", () => {
      expect(
        SaveWaitlistPageSchema.safeParse(validInput({ overlayOpacity: -1 }))
          .success,
      ).toBe(false);

      expect(
        SaveWaitlistPageSchema.safeParse(validInput({ overlayOpacity: 101 }))
          .success,
      ).toBe(false);
    });

    it("odrzuca wartość ułamkową — suwak oddaje pełne procenty", () => {
      expect(
        SaveWaitlistPageSchema.safeParse(validInput({ overlayOpacity: 50.5 }))
          .success,
      ).toBe(false);
    });
  });

  it("zdjęcie w tle podlega tej samej kontroli adresu co pozostałe grafiki", () => {
    expect(
      SaveWaitlistPageSchema.safeParse(
        validInput({ backgroundImageUrl: "javascript:alert(1)" }),
      ).success,
    ).toBe(false);

    const ok = SaveWaitlistPageSchema.safeParse(
      validInput({
        backgroundImageUrl: "https://images.unsplash.com/photo-2",
      }),
    );

    expect(ok.success).toBe(true);
  });

  it("odrzuca nieznany układ i nieznany motyw", () => {
    expect(
      SaveWaitlistPageSchema.safeParse(validInput({ layoutVariant: "kosmos" }))
        .success,
    ).toBe(false);

    expect(
      SaveWaitlistPageSchema.safeParse(validInput({ theme: "tęcza" })).success,
    ).toBe(false);
  });
});
