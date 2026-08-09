/**
 * Formatowanie tekstów strony zapisów. Czysty moduł — bez Prismy i Reacta,
 * więc korzysta z niego zarówno renderowanie po stronie serwera, jak i podgląd
 * w kreatorze (i da się go przetestować bez bazy).
 */

export interface HighlightedHeadline {
  before: string;
  /** Fragment do podświetlenia. Pusty, gdy nie ma czego podświetlać. */
  highlighted: string;
  after: string;
}

/**
 * Rozbija nagłówek na część przed wyróżnionym fragmentem, sam fragment i resztę.
 *
 * Podświetlenie realizujemy przez dopasowanie tekstu, a nie osobne pola
 * „przed/po", żeby w kreatorze wpisywać normalne zdanie i osobno wskazywać,
 * co podkreślić.
 *
 * Gdy fragment nie występuje w nagłówku (literówka, zmieniony nagłówek po
 * ustawieniu podświetlenia), nie podświetlamy nic i oddajemy nagłówek
 * w całości. Strona kampanii ma wtedy wyglądać zwyczajnie, a nie zniknąć —
 * to jest treść, za którą ktoś już zapłacił zasięgiem w poście.
 *
 * Dopasowanie jest bez rozróżniania wielkości liter, ale zwracamy fragment
 * w PISOWNI Z NAGŁÓWKA: gdyby wracała pisownia z pola „wyróżnij", nagłówek
 * zmieniałby się po samym ustawieniu podświetlenia.
 */
export function splitAroundHighlight(
  headline: string,
  highlight: string | null | undefined,
): HighlightedHeadline {
  const needle = highlight?.trim();

  if (!needle) {
    return { before: headline, highlighted: "", after: "" };
  }

  const index = headline.toLowerCase().indexOf(needle.toLowerCase());

  if (index === -1) {
    return { before: headline, highlighted: "", after: "" };
  }

  return {
    before: headline.slice(0, index),
    highlighted: headline.slice(index, index + needle.length),
    after: headline.slice(index + needle.length),
  };
}
