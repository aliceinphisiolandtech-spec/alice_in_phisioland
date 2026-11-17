import type { TableOfContentsData } from "@/lib/validators/landing";

/**
 * Spis treści e-booka (Tom 1) — treść startowa.
 *
 * Używana, dopóki sekcja nie zostanie zapisana w CMS (wtedy wygrywa wersja
 * z bazy). Tytuły w zapisie zdaniowym, a nie wersalikami jak na grafice:
 * wersaliki nakłada CSS, a w bazie zostaje tekst czytelny dla wyszukiwarki
 * i czytnika ekranu.
 */
export const TABLE_OF_CONTENTS_DEFAULT: TableOfContentsData = {
  badge: "Tom 1",
  headline: "Spis treści",
  highlight: "treści",
  description:
    "Dziewięć rozdziałów — od fundamentów diagnostyki różnicowej, przez ból i centralne uwrażliwienie, po czerwone flagi i testy kliniczne według EBM.",
  chapters: [
    {
      title: "Wstęp do fizjoterapeutycznej diagnostyki różnicowej",
      numbered: true,
    },
    { title: "Gojenie tkanek – od fizjologii do patologii", numbered: true },
    { title: "Ból jako objaw i choroba", numbered: true },
    { title: "Centralne uwrażliwienie", numbered: true },
    {
      title:
        "Fenotypowanie bólu – użyteczne narzędzie czy intelektualna rozrywka?",
      numbered: true,
    },
    { title: "Czerwone flagi", numbered: true },
    { title: "Dekalog diagnostyczny", numbered: true },
    { title: "Testy kliniczne według EBM", numbered: true },
    {
      title:
        "Diagnostyka różnicowa jako fundament współczesnej praktyki fizjoterapeutycznej",
      numbered: true,
    },
    { title: "Bibliografia", numbered: false },
  ],
};

const ROMAN: Array<[number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** 1 -> "I", 9 -> "IX", 14 -> "XIV". */
export function toRoman(value: number): string {
  let rest = Math.max(0, Math.floor(value));
  let out = "";
  for (const [n, sym] of ROMAN) {
    while (rest >= n) {
      out += sym;
      rest -= n;
    }
  }
  return out;
}

/**
 * Numery rozdziałów liczone z kolejności — pozycje bez numeru (Bibliografia)
 * nie zajmują kolejnej cyfry.
 */
export function numberChapters(
  chapters: TableOfContentsData["chapters"],
): Array<{ title: string; numeral: string | null }> {
  let n = 0;
  return chapters.map((chapter) => ({
    title: chapter.title,
    numeral: chapter.numbered ? toRoman(++n) : null,
  }));
}
