/**
 * Budowanie plików CSV do pobrania z panelu.
 *
 * Czysty moduł (bez Prismy i importów serwerowych) — testowalny bez bazy.
 *
 * Trzy decyzje, które nie są oczywiste z samego kodu:
 *
 * 1. **Średnik zamiast przecinka.** Excel w polskiej lokalizacji traktuje
 *    przecinek jako separator dziesiętny i plik rozdzielony przecinkami wrzuca
 *    w całości do jednej kolumny. Średnik działa od razu, bez kreatora importu.
 *
 * 2. **BOM na początku pliku.** Bez niego Excel czyta UTF-8 jako stronę kodową
 *    Windows-1252 i polskie znaki zamieniają się w krzaki.
 *
 * 3. **Neutralizacja formuł.** Wartości pochodzą od użytkowników z internetu,
 *    a komórka zaczynająca się od `=`, `+`, `-` lub `@` jest dla Excela
 *    formułą, nie tekstem. To jest wektor ataku (CSV injection): plik z listą
 *    maili może wykonać coś na komputerze osoby, która go otworzy.
 */

/** Znak zapytania Excela: bez tego polskie znaki się sypią. */
export const CSV_BOM = "\uFEFF";

const SEPARATOR = ";";

/** Znaki, od których Excel rozpoznaje formułę. */
const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Jedna komórka: neutralizacja formuły, a potem cytowanie.
 *
 * Kolejność ma znaczenie — apostrof neutralizujący musi trafić do środka
 * cudzysłowów, inaczej sam zostałby potraktowany jako część składni.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  let text = String(value);

  if (text.length > 0 && FORMULA_PREFIXES.includes(text[0])) {
    text = `'${text}`;
  }

  // Cytujemy zawsze, gdy w środku jest separator, cudzysłów albo złamanie
  // linii. Cudzysłów w środku podwajamy — tak wymaga RFC 4180.
  if (
    text.includes(SEPARATOR) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvCell).join(SEPARATOR);
}

/**
 * Składa cały plik: nagłówek + wiersze, z BOM-em i zakończeniami CRLF
 * (RFC 4180 — i tego oczekuje Excel).
 */
export function buildCsv(
  header: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  return CSV_BOM + [csvRow(header), ...rows.map(csvRow)].join("\r\n") + "\r\n";
}

/**
 * Nazwa pliku bezpieczna w nagłówku `Content-Disposition`.
 *
 * Zostawiamy wyłącznie ASCII: polskie znaki w nazwie pliku wymagałyby
 * kodowania RFC 5987, a część przeglądarek i tak zapisze wtedy plik pod
 * przypadkową nazwą. Prostota jest tu więcej warta niż ogonki.
 */
export function csvFilename(parts: string[]): string {
  const base = parts
    .join("-")
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "eksport"}.csv`;
}
