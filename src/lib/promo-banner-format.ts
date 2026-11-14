/**
 * Formatowanie paska promocji — czyste funkcje bez importów serwerowych,
 * bo tego samego formatu używa podgląd na żywo w formularzu przeceny.
 */

// Daty w panelu wpisuje się w czasie polskim, a serwer działa w UTC —
// bez jawnej strefy start 23.11 00:00 (= 22.11 23:00 UTC) pokazałby się jako 22.11.
const TIME_ZONE = "Europe/Warsaw";

function dateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("pl-PL", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month"), year: get("year") };
}

/** Zakres dat w zwięzłym polskim zapisie: "23–30.11.2026", "28.11–2.12.2026". */
export function formatPromoRange(
  from: Date | null,
  until: Date | null,
): string | null {
  const full = (d: Date) => {
    const p = dateParts(d);
    return `${p.day}.${p.month}.${p.year}`;
  };

  if (from && until) {
    const a = dateParts(from);
    const b = dateParts(until);

    if (a.year !== b.year) return `${full(from)}–${full(until)}`;
    if (a.month !== b.month) return `${a.day}.${a.month}–${full(until)}`;
    if (a.day !== b.day) return `${a.day}–${full(until)}`;
    return full(until);
  }

  if (from) return `od ${full(from)}`;
  if (until) return `do ${full(until)}`;
  return null;
}

/** Tekst paska: własny, a gdy pusty — nazwa przeceny. */
export function resolveBannerText(
  bannerText: string | null | undefined,
  saleName: string,
): string {
  const custom = bannerText?.trim();
  return custom ? custom : saleName.trim();
}
