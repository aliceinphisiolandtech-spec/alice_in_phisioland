/**
 * Zegar aplikacji — jedno miejsce, które odpowiada na pytanie „która jest teraz".
 *
 * Wszystko, co decyduje o statusie rabatu (okno czasowe kodu, przeceny, zniżki
 * mailowej) pyta o czas przez `now()`, a nie przez `new Date()`. Dzięki temu
 * panel, koszyk i silnik cenowy widzą dokładnie ten sam dzień.
 *
 * PRZESUNIĘCIE DATY W DEV
 * Poza produkcją datę można ustawić zmienną `NEXT_PUBLIC_DEV_TODAY` w formacie
 * `RRRR-MM-DD`. Powód jest praktyczny: materiał szkoleniowy nagrywa się raz,
 * a ogląda później — bez podmiany daty promocja „do 31.07" jest na nagraniu już
 * wygasła, plakietki pokazują „Wygasł", a lektor mówi coś przeciwnego.
 *
 * Podmieniamy WYŁĄCZNIE rok, miesiąc i dzień. Godzina biegnie normalnie, bo
 * zegar stojący w miejscu psułby wszystko, co mierzy upływ czasu (rate limit,
 * „5 minut temu" przy powiadomieniach, sesje).
 *
 * Zmienna jest `NEXT_PUBLIC_`, bo tę samą datę musi widzieć serwer (filtrowanie
 * promocji) i przeglądarka (plakietki statusu, kalendarz). Wartość powstaje raz,
 * przy starcie modułu, i jest gate'owana `IS_DEV` w miejscu tworzenia — na
 * produkcji do bundla trafia stałe `null`, nawet gdyby zmienna była ustawiona.
 */

const IS_DEV = process.env.NODE_ENV !== "production";

interface ShiftedDay {
  year: number;
  month: number;
  day: number;
}

function parseDevToday(raw: string | undefined): ShiftedDay | null {
  if (!raw) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!match) return null;

  const day = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };

  // Data nieistniejąca (np. 2026-02-30) zostałaby przez JS po cichu przesunięta
  // na 2 marca. Lepiej zignorować literówkę i zostać przy prawdziwym dniu.
  const probe = new Date(day.year, day.month - 1, day.day);
  if (probe.getMonth() !== day.month - 1 || probe.getDate() !== day.day) {
    return null;
  }

  return day;
}

const SHIFTED_DAY = IS_DEV
  ? parseDevToday(process.env.NEXT_PUBLIC_DEV_TODAY)
  : null;

/** Czy data jest w tej chwili przesunięta (dev). Na produkcji zawsze `false`. */
export const isClockShifted = SHIFTED_DAY !== null;

/** „Teraz" dla całej domeny rabatów. */
export function now(): Date {
  const real = new Date();
  if (!SHIFTED_DAY) return real;

  return new Date(
    SHIFTED_DAY.year,
    SHIFTED_DAY.month - 1,
    SHIFTED_DAY.day,
    real.getHours(),
    real.getMinutes(),
    real.getSeconds(),
    real.getMilliseconds(),
  );
}

/** Dzisiejsza północ — punkt odniesienia kalendarza („dziś" w siatce dni). */
export function today(): Date {
  const date = now();
  date.setHours(0, 0, 0, 0);
  return date;
}
