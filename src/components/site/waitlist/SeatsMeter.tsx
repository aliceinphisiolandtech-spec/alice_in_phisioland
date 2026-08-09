import React from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ThemeTokens } from "@/lib/waitlist-appearance";
import { resolveSeats } from "@/lib/waitlist-scarcity";

/**
 * Pasek „zostało X z Y miejsc" nad formularzem.
 *
 * Liczby bierze z `lib/waitlist-scarcity` — przy ustawionym prawdziwym limicie
 * są prawdziwe, bez limitu wyliczane. Ten komponent tylko je wyświetla;
 * zastrzeżenia do wariantu wyliczanego opisano w tamtym pliku i w dokumentacji.
 *
 * Kolory idą z tokenów motywu, więc pasek działa też na karcie ze zdjęciem,
 * gdzie treść przechodzi na jasną. `bg-current` bierze kolor z klasy tekstu
 * nałożonej na ten sam element — dzięki temu nie trzeba osobnego tokenu na
 * wypełnienie i pasek nie może rozjechać się z resztą karty.
 */
export function SeatsMeter({
  signupCount,
  maxSignups,
  tokens,
}: {
  signupCount: number;
  maxSignups: number | null;
  tokens: ThemeTokens;
}) {
  const { total, left, filledPercent } = resolveSeats(signupCount, maxSignups);

  // Zero wolnych miejsc pojawia się wyłącznie przy PRAWDZIWYM limicie, a wtedy
  // zamiast formularza i tak jest komunikat o komplecie — pasek byłby wtedy
  // powtórzeniem tej samej informacji.
  if (left <= 0) return null;

  const isLastFew = left <= 3;

  return (
    <div
      className={cn("mb-5 rounded-[12px] border px-4 py-3", tokens.notice)}
      // Licznik zmienia się w tle wraz z zapisami innych osób. `aria-live` nie
      // ma tu sensu (nie zmienia się w reakcji na działanie użytkownika), ale
      // treść musi być czytelna dla czytnika ekranu jako jedno zdanie.
      role="status"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={cn("text-[13px] font-semibold", tokens.heading)}
        >
          {isLastFew && (
            <Flame
              size={13}
              className="mr-1 inline-block shrink-0 align-[-1px]"
              aria-hidden
            />
          )}
          Zostało {left} {seatWord(left)}
        </span>

        <span className={cn("text-[12px] whitespace-nowrap", tokens.muted)}>
          z {total}
        </span>
      </div>

      <div
        className={cn(
          "mt-2 h-1.5 w-full overflow-hidden rounded-full",
          tokens.muted,
          "bg-current/15",
        )}
      >
        <div
          className={cn("h-full rounded-full bg-current", tokens.heading)}
          style={{ width: `${filledPercent}%` }}
        />
      </div>
    </div>
  );
}

/** Polska odmiana: 1 miejsce, 2–4 miejsca, 5+ miejsc (z wyjątkiem 12–14). */
function seatWord(count: number): string {
  if (count === 1) return "miejsce";

  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 12 && lastTwo <= 14) return "miejsc";
  if (last >= 2 && last <= 4) return "miejsca";

  return "miejsc";
}
