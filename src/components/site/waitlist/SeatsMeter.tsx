import React from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ThemeTokens } from "@/lib/waitlist-appearance";
import { resolveSeats } from "@/lib/waitlist-scarcity";

/**
 * Licznik „zostało X miejsc z Y" — jedna linijka pod polem e-mail.
 *
 * Był tu wcześniej ramkowany kafelek nad formularzem i to był błąd: pierwszą
 * rzeczą na karcie ma być miejsce na adres, a nie skrzynka z liczbami.
 * Licznik nie sprzedaje sam z siebie — jest powodem, żeby wpisać adres TERAZ,
 * więc czyta się go zaraz po polu, jak podpowiedź. Stąd brak ramki i tła:
 * cały ciężar wizualny zostaje przy polu i przycisku.
 *
 * Liczby bierze z `lib/waitlist-scarcity` — przy ustawionym prawdziwym limicie
 * są prawdziwe, bez limitu wyliczane. Ten komponent tylko je wyświetla;
 * zastrzeżenia do wariantu wyliczanego opisano w tamtym pliku i w dokumentacji.
 *
 * Kolory idą z tokenów motywu, więc licznik działa na każdym z nich.
 * `bg-current` bierze kolor z klasy tekstu nałożonej na ten sam element —
 * dzięki temu nie trzeba osobnego tokenu na wypełnienie paska i nie może on
 * rozjechać się z resztą karty.
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
      className="flex items-center gap-3"
      // Licznik zmienia się w tle wraz z zapisami innych osób. `aria-live` nie
      // ma tu sensu (nie zmienia się w reakcji na działanie użytkownika), ale
      // treść musi być czytelna dla czytnika ekranu jako jedno zdanie.
      role="status"
    >
      {/*
        Pasek bez własnej ramki i tła kafelka — ciężar niesie sam wypełniony
        fragment, dlatego jest grubszy niż typowy separator i w kolorze tekstu
        nagłówka. Wypełnienie wchodzi płynnie, żeby wzrok trafił tam po polu
        e-mail, a nie przed nim.
      */}
      <div
        className={cn(
          "h-1.5 min-w-0 flex-1 overflow-hidden rounded-full",
          tokens.muted,
          "bg-current/20",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-current",
            "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-1000 motion-safe:ease-out",
            isLastFew ? "text-red-500" : tokens.heading,
          )}
          style={{ width: `${filledPercent}%` }}
        />
      </div>

      <span
        className={cn(
          "shrink-0 text-[13px] leading-none font-semibold whitespace-nowrap",
          // Ostatnie miejsca dostają czerwień — to jedyny moment, w którym
          // licznik ma prawo krzyknąć głośniej niż przycisk.
          isLastFew ? "text-red-500" : tokens.heading,
        )}
      >
        {isLastFew && (
          <Flame
            size={13}
            className="mr-1 inline-block shrink-0 align-[-1px]"
            aria-hidden
          />
        )}
        Zostało {left} {seatWord(left)}
        <span className={cn("ml-1 font-normal", tokens.muted)}>z {total}</span>
      </span>
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
