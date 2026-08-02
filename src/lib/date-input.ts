/**
 * Konwersje między datą z bazy (ISO, UTC) a wartością pola formularza.
 *
 * Formularze trzymają datę jako CZAS LOKALNY admina w formacie
 * `RRRR-MM-DDTGG:MM` — bez strefy. Admin kończący promocję „31.07" ma na myśli
 * koniec swojego 31 lipca, nie UTC. Konwersja w obie strony siedzi w jednym
 * pliku, żeby żadne pole nie zaczęło liczyć inaczej.
 *
 * Godzina nie jest wybierana z panelu — kalendarz dopisuje 00:00 do początku
 * okna i 23:59 do jego końca (patrz components/ui/DatePicker).
 */

const pad = (value: number) => String(value).padStart(2, "0");

/** Date -> "RRRR-MM-DDTGG:MM" w czasie lokalnym. */
export function toLocalInput(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** "RRRR-MM-DDTGG:MM" -> Date w czasie lokalnym. `null` przy pustej/błędnej wartości. */
export function parseLocalInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    0,
    0,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

/** ISO z bazy -> wartość pola formularza. */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return toLocalInput(date);
}

/**
 * Wartość pola formularza -> ISO do bazy.
 *
 * `inclusive` domyka wybraną minutę (`:59.999`) i jest używane dla „ważny do".
 * Bez tego wybranie 23:59 kończyłoby promocję sekundę przed końcem dnia,
 * a wpisane 18:00 znaczyłoby „do 17:59:59" — czyli nie to, co widać w polu.
 */
export function localInputToIso(
  value: string,
  inclusive = false,
): string | null {
  const date = parseLocalInput(value);
  if (!date) return null;

  if (inclusive) date.setSeconds(59, 999);

  return date.toISOString();
}

const dateTimeFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Wartość pola -> "31.07.2026" (napis na przycisku kalendarza). */
export function formatLocalDate(value: string): string {
  const date = parseLocalInput(value);
  return date ? dateFormatter.format(date) : "";
}

/**
 * Data z bazy -> tekst na listę rabatów.
 *
 * Godzinę pokazujemy tylko wtedy, gdy niesie informację. Granice całego dnia
 * (00:00 dla początku, 23:59 dla końca) są domyślne, więc „01.08.2026 — 31.08.2026"
 * czyta się lepiej niż ten sam zakres z dwiema zerowymi godzinami.
 */
export function formatBoundary(iso: string, kind: "from" | "until"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const isDayEdge =
    kind === "from"
      ? date.getHours() === 0 && date.getMinutes() === 0
      : date.getHours() === 23 && date.getMinutes() === 59;

  return isDayEdge ? dateFormatter.format(date) : dateTimeFormatter.format(date);
}
