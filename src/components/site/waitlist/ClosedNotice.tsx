import React from "react";
import { CalendarClock, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ThemeTokens } from "@/lib/waitlist-appearance";

/**
 * Komunikat zamiast formularza, gdy kampania jeszcze nie ruszyła albo już się
 * skończyła. Kreator pokazuje go jako podgląd stanu „zamknięte", żeby dało się
 * sprawdzić treść komunikatu bez czekania na datę.
 */
export function ClosedNotice({
  status,
  message,
  opensAt,
  tokens,
}: {
  status: "closed" | "not_started" | "full";
  message: string | null;
  opensAt: Date | null;
  tokens: ThemeTokens;
}) {
  const isUpcoming = status === "not_started";
  const isFull = status === "full";

  /**
   * Komplet dostaje własny komunikat, a nie „zapisy zamknięte".
   *
   * Powód nie jest kosmetyczny: „wszystkie miejsca zajęte" mówi, że akcja się
   * udała i warto pilnować kolejnej, a „zamknięte" brzmi jak koniec tematu.
   * Przy tym samym zdarzeniu to jest różnica w tym, czy ktoś wróci.
   */
  const fallback = isUpcoming
    ? "Zapisy jeszcze się nie rozpoczęły. Zajrzyj tu ponownie za chwilę."
    : isFull
      ? "Wszystkie miejsca zostały już zajęte. Dziękuję za zainteresowanie — przy kolejnej akcji odezwę się wcześniej!"
      : "Zapisy na tę listę zostały już zamknięte. Dziękujemy za zainteresowanie!";

  /**
   * Własna treść z kreatora dotyczy WYŁĄCZNIE zamknięcia i braku startu.
   *
   * Komplet dostaje swój stały komunikat, bo tekst wpisany pod „zapisy
   * zamknięte" (zwykle w stylu „oferta już ruszyła") przy wyczerpanym limicie
   * mówi nieprawdę. Jedno pole obsługujące oba stany zawsze skłamie w jednym
   * z nich — a to jest ostatnia rzecz, jaką widzi ktoś, kto właśnie nie zdążył.
   */
  const text = isFull ? fallback : message?.trim() || fallback;

  return (
    <div
      className={cn("rounded-[12px] border px-5 py-6 text-center", tokens.notice)}
    >
      <div
        className={cn(
          "mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full",
          tokens.noticeIcon,
        )}
      >
        {isUpcoming ? (
          <CalendarClock size={20} />
        ) : isFull ? (
          <Users size={20} />
        ) : (
          <Lock size={20} />
        )}
      </div>

      <div
        className={cn(
          "text-[15px] leading-[160%] whitespace-pre-line",
          tokens.heading,
        )}
      >
        {text}
      </div>

      {isUpcoming && opensAt && (
        <p className={cn("mt-3 text-[13px]", tokens.muted)}>
          Start zapisów:{" "}
          {new Intl.DateTimeFormat("pl-PL", {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "Europe/Warsaw",
          }).format(opensAt)}
        </p>
      )}
    </div>
  );
}
