import React from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ThemeTokens } from "@/lib/waitlist-appearance";

/**
 * Wygląd formularza zapisu — bez logiki wysyłki.
 *
 * Istnieje po to, żeby kreator w panelu renderował DOKŁADNIE ten sam formularz
 * co strona publiczna. Gdyby podgląd miał własną kopię stylów, rozjechałby się
 * przy pierwszej zmianie wyglądu i pokazywałby coś, czego odbiorca nigdy nie
 * zobaczy — a to jedyne, do czego podgląd służy.
 *
 * Etykiety (przycisk, zgoda, przypis) są węzłami Reacta, nie napisami: strona
 * podaje zwykły tekst, a kreator wstawia w to samo miejsce pole edytowalne.
 */

export interface WaitlistFormShellProps {
  tokens: ThemeTokens;
  collectName: boolean;

  /** Napis na przycisku — tekst albo pole edycji. */
  ctaLabel: React.ReactNode;
  /** Treść zgody przy checkboksie. */
  consentText: React.ReactNode;
  /** Drobny tekst pod przyciskiem. `null` = brak. */
  footnote?: React.ReactNode;
  /**
   * Licznik wolnych miejsc. Leży POD polem e-mail, a nie nad formularzem:
   * pierwsze, co ma przyciągnąć wzrok, to miejsce na adres — licznik jest
   * powodem, żeby go wpisać teraz, więc czyta się go zaraz po nim, jak
   * podpowiedź do pola. `null` = kampania bez licznika.
   */
  seats?: React.ReactNode;

  /**
   * Tryb makiety: pola są wyłączone, a kliknięcia nie wywołują wysyłki.
   * Używany na kanwie kreatora — tam formularz ma wyglądać, a nie działać.
   */
  preview?: boolean;

  // --- Poniższe wypełnia wyłącznie prawdziwy formularz ---
  ids?: {
    name: string;
    email: string;
    consent: string;
    error: string;
    honeypot: string;
  };
  name?: string;
  email?: string;
  consent?: boolean;
  website?: string;
  onName?: (value: string) => void;
  onEmail?: (value: string) => void;
  onConsent?: (value: boolean) => void;
  onWebsite?: (value: string) => void;
  error?: string | null;
  isSubmitting?: boolean;
  onSubmit?: (event: React.FormEvent) => void;
}

export function WaitlistFormShell({
  tokens,
  collectName,
  ctaLabel,
  consentText,
  footnote,
  seats,
  preview = false,
  ids,
  name = "",
  email = "",
  consent = false,
  website = "",
  onName,
  onEmail,
  onConsent,
  onWebsite,
  error,
  isSubmitting = false,
  onSubmit,
}: WaitlistFormShellProps) {
  const inputClasses = cn(
    "min-h-[52px] w-full rounded-[10px] border px-4 text-[15px] outline-none transition-colors focus:ring-2 disabled:opacity-70",
    tokens.input,
  );

  const disabled = preview || isSubmitting;

  return (
    <form
      onSubmit={onSubmit}
      // Wyłącza angielskie dymki przeglądarki — walidację komunikujemy sami, po polsku.
      noValidate
      className="flex flex-col gap-3.5 sm:gap-4"
      // Na kanwie kreatora formularz jest dekoracją: nie da się w niego wejść
      // tabulatorem ani nic wysłać, żeby nie konkurował z polami edycji treści.
      {...(preview ? { inert: true } : {})}
    >
      {collectName && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={ids?.name}
            className={cn("text-[13px] font-semibold", tokens.heading)}
          >
            Imię
          </label>
          <input
            id={ids?.name}
            type="text"
            autoComplete="given-name"
            value={name}
            onChange={(event) => onName?.(event.target.value)}
            disabled={disabled}
            placeholder="Jak masz na imię?"
            className={inputClasses}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={ids?.email}
          className={cn("text-[13px] font-semibold", tokens.heading)}
        >
          Adres e-mail
        </label>
        <input
          id={ids?.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmail?.(event.target.value)}
          disabled={disabled}
          placeholder="jan@kowalski.pl"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? ids?.error : undefined}
          className={inputClasses}
        />

        {seats && <div className="mt-1">{seats}</div>}
      </div>

      {/*
        Pułapka na boty. Ukryta wizualnie, wyłączona z nawigacji klawiaturą
        i bez autouzupełniania — człowiek nie ma jak jej wypełnić, automat
        wypełnia wszystko, co znajdzie w formularzu. Na kanwie kreatora
        nie ma sensu, więc jej tam nie renderujemy.
      */}
      {!preview && (
        <div className="absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
          <label htmlFor={ids?.honeypot}>Nie wypełniaj tego pola</label>
          <input
            id={ids?.honeypot}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => onWebsite?.(event.target.value)}
          />
        </div>
      )}

      <label
        htmlFor={ids?.consent}
        className={cn(
          "flex items-start gap-3 text-[12px] leading-[160%]",
          preview ? "cursor-default" : "cursor-pointer",
          tokens.body,
        )}
      >
        <input
          id={ids?.consent}
          type="checkbox"
          checked={consent}
          onChange={(event) => onConsent?.(event.target.checked)}
          disabled={disabled}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
        />
        <span className="min-w-0 flex-1">{consentText}</span>
      </label>

      {error && (
        <p
          id={ids?.error}
          role="alert"
          className="rounded-[8px] bg-red-50 px-3 py-2 text-[13px] text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled}
        className={cn(
          "group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[10px] px-6 text-[15px] font-bold transition-transform disabled:pointer-events-none",
          // W podglądzie przycisk nie może wyglądać na wyłączony — ma pokazywać,
          // jak wygląda naprawdę, więc pomijamy wygaszenie i animację najechania.
          preview
            ? "disabled:opacity-100"
            : "hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70",
          tokens.button,
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Zapisuję…
          </>
        ) : (
          <>
            {ctaLabel}
            <ArrowUpRight
              size={18}
              className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </>
        )}
      </button>

      {footnote && (
        <div className={cn("text-center text-[12px]", tokens.muted)}>
          {footnote}
        </div>
      )}
    </form>
  );
}
