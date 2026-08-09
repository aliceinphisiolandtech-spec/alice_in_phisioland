"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Edycja tekstu w miejscu — na renderowanej stronie kampanii.
 *
 * Zasada: dopóki nie edytujesz, widzisz DOKŁADNIE to, co zobaczy odbiorca
 * (łącznie z podświetleniem fragmentu nagłówka). Kliknięcie podmienia napis na
 * pole o tej samej typografii, w tym samym miejscu. Wyjście z pola wraca do
 * widoku strony.
 *
 * Dlaczego podmiana, a nie stale widoczne pole tekstowe: pole nie potrafi
 * wyrenderować podkreślenia akcentem ani żadnego formatowania. Gdyby nagłówek
 * był na kanwie zawsze polem, kreator pokazywałby stronę bez połowy jej
 * wyglądu — czyli przestałby być wizualny.
 *
 * Dlaczego nie `contentEditable`: wpuszczałby do stanu HTML wklejony ze schowka
 * (formatowanie, obce znaczniki), a my zapisujemy do bazy czysty tekst.
 */

interface InlineEditProps {
  value: string;
  onChange: (value: string) => void;
  /** Podgląd — to, co widać, gdy pole nie jest w edycji. */
  children: React.ReactNode;
  /** Klasy typografii — MUSZĄ być te same dla podglądu i dla pola. */
  className?: string;
  /** Wieloliniowy (opis, treść zgody) czy jednoliniowy (nagłówek, przycisk). */
  multiline?: boolean;
  placeholder?: string;
  /** Etykieta dla czytników ekranu, np. „Nagłówek strony". */
  label: string;
  /** Wyrównanie tekstu w polu — musi odpowiadać podglądowi. */
  align?: "left" | "center";
}

export function InlineEdit({
  value,
  onChange,
  children,
  className,
  multiline = false,
  placeholder,
  label,
  align = "left",
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <InlineEditField
        value={value}
        onChange={onChange}
        onDone={() => setEditing(false)}
        className={className}
        multiline={multiline}
        placeholder={placeholder}
        label={label}
        align={align}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={`Edytuj: ${label}`}
      className={cn(
        "group relative block w-full cursor-text rounded-[4px] text-left",
        // Obrys tylko przy najechaniu — kanwa ma wyglądać jak strona, a nie
        // jak formularz w ramkach. Offset, żeby nie przycinał liter.
        "outline-2 outline-offset-4 outline-transparent transition-[outline-color] hover:outline-[#0c493e]/30 focus-visible:outline-[#0c493e]",
        align === "center" && "text-center",
      )}
    >
      {/* Pusta wartość nie ma w co kliknąć — pokazujemy podpowiedź. */}
      {value.trim() ? (
        children
      ) : (
        <span className={cn(className, "opacity-40")}>
          {placeholder ?? label}
        </span>
      )}
    </button>
  );
}

/**
 * Samo pole. Wydzielone, bo montuje się dopiero po kliknięciu — dzięki temu
 * `autoFocus` i ustawienie kursora na końcu tekstu dzieją się raz, przy
 * wejściu w edycję, zamiast przy każdym renderowaniu kanwy.
 */
function InlineEditField({
  value,
  onChange,
  onDone,
  className,
  multiline,
  placeholder,
  label,
  align,
}: Omit<InlineEditProps, "children"> & { onDone: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Wysokość pola musi nadążać za treścią, inaczej opis chowałby się za
  // paskiem przewijania wewnątrz pola i psuł układ strony pod spodem.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.focus();
    // Kursor na koniec, nie na początek — poprawianie tekstu jest
    // częstsze niż pisanie go od nowa.
    element.setSelectionRange(element.value.length, element.value.length);
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      aria-label={label}
      placeholder={placeholder}
      rows={1}
      onChange={(event) => {
        // Jednoliniowe pola (nagłówek, napis na przycisku) muszą zostać
        // jednoliniowe także po wklejeniu tekstu z Worda.
        const next = multiline
          ? event.target.value
          : event.target.value.replace(/[\r\n]+/g, " ");
        onChange(next);
      }}
      onBlur={onDone}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onDone();
        }
        // Enter kończy edycję tam, gdzie złamanie linii i tak nie ma sensu.
        if (event.key === "Enter" && !multiline) {
          event.preventDefault();
          onDone();
        }
      }}
      className={cn(
        className,
        "block w-full resize-none overflow-hidden rounded-[4px] border-0 bg-transparent p-0",
        "outline-2 outline-offset-4 outline-[#0c493e] placeholder:opacity-40",
        align === "center" && "text-center",
      )}
    />
  );
}
