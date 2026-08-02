"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { today } from "@/lib/dev-clock";
import {
  formatLocalDate,
  parseLocalInput,
  toLocalInput,
} from "@/lib/date-input";

/**
 * Wybór daty — kalendarz w dymku zamiast natywnego `input[type=date]`.
 *
 * Natywne pole wygląda inaczej w każdej przeglądarce i nie pokazuje kontekstu:
 * jaki to dzień tygodnia, ile zostało do końca miesiąca, gdzie wypada dziś.
 * Przy planowaniu promocji to jest właśnie ta informacja, której się szuka.
 *
 * Wartość to CZAS LOKALNY w formacie `RRRR-MM-DDTGG:MM` (patrz lib/date-input),
 * ale godzina NIE jest wybierana z panelu — ustawia ją `dayTime`, żeby okno
 * promocji zawsze obejmowało całe dni. Pusty string = brak daty.
 */

/** Tydzień zaczynamy od poniedziałku — kalendarz dla polskiego admina. */
const WEEK_STARTS_ON = 1 as const;
const WEEKDAYS = ["pon", "wt", "śr", "czw", "pt", "sob", "ndz"];

interface DatePickerProps {
  /** "RRRR-MM-DDTGG:MM" albo "" */
  value: string;
  onChange: (value: string) => void;
  /**
   * Godzina dopisywana do wybranego dnia: "00:00" dla początku okna,
   * "23:59" dla końca. Dzięki temu wybór samych dat obejmuje pełne doby.
   */
  dayTime?: string;
  id?: string;
  placeholder?: string;
  /** Opis dla czytników ekranu, gdy pole nie ma widocznej etykiety. */
  ariaLabel?: string;
}

function parseTime(value: string): { hours: number; minutes: number } {
  const [hours, minutes] = value.split(":").map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

/** date-fns zwraca "sierpień 2026" — nagłówek chcemy z wielkiej litery. */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const DatePicker = ({
  value,
  onChange,
  dayTime = "00:00",
  id,
  placeholder = "Wybierz datę",
  ariaLabel,
}: DatePickerProps) => {
  const selected = parseLocalInput(value);

  const [open, setOpen] = useState(false);
  // Miesiąc pokazywany w siatce. Trzymany osobno od zaznaczenia, bo admin
  // przewijający kalendarz nie wybiera jeszcze daty.
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selected ?? today()),
  );

  const currentDay = today();

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth), {
      weekStartsOn: WEEK_STARTS_ON,
    }),
    end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: WEEK_STARTS_ON }),
  });

  const handleOpenChange = (next: boolean) => {
    // Po otwarciu wracamy do miesiąca wybranej daty — inaczej kalendarz
    // pamiętałby, dokąd admin przewinął przy poprzedniej edycji.
    if (next) setViewMonth(startOfMonth(selected ?? today()));
    setOpen(next);
  };

  const selectDay = (day: Date) => {
    const { hours, minutes } = parseTime(dayTime);

    onChange(
      toLocalInput(
        new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          hours,
          minutes,
        ),
      ),
    );
    // Data to jedyna decyzja w tym oknie — nie ma po co trzymać go otwartego.
    setOpen(false);
  };

  return (
    <div className="relative">
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            aria-label={ariaLabel}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm outline-none transition-all",
              "focus:border-[#0c493e] focus:ring-1 focus:ring-[#0c493e]",
              value ? "text-gray-900" : "text-gray-400",
              open
                ? "border-[#0c493e] ring-1 ring-[#0c493e]"
                : "border-gray-200 hover:border-gray-300",
              // Miejsce na krzyżyk czyszczący, żeby data go nie dotykała.
              value && "pr-9",
            )}
          >
            <CalendarDays size={14} className="shrink-0 text-gray-400" />
            <span className="truncate">
              {value ? formatLocalDate(value) : placeholder}
            </span>
          </button>
        </Popover.Trigger>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Wyczyść datę"
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}

        {/* forceMount + AnimatePresence — bez tego Radix odmontowuje treść
            natychmiast i animacja zamknięcia nie ma czego animować. */}
        <AnimatePresence>
          {open && (
            <Popover.Portal forceMount>
              <Popover.Content
                asChild
                forceMount
                side="bottom"
                align="start"
                sideOffset={8}
                // Kalendarz ma otwierać się POD polem i zostawać przy nim.
                // Bez tych trzech ustawień Radix przy krótkim oknie przerzuca
                // go nad pole i przesuwa w bok — panel wygląda wtedy, jakby
                // dymek skakał po formularzu.
                avoidCollisions={false}
                collisionPadding={12}
                sticky="always"
              >
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                  className="z-[80] w-[18rem] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl outline-none"
                >
                  {/* --- MIESIĄC --- */}
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                      aria-label="Poprzedni miesiąc"
                      className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <span className="text-sm font-bold text-gray-900">
                      {capitalize(
                        format(viewMonth, "LLLL yyyy", { locale: pl }),
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                      aria-label="Następny miesiąc"
                      className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* --- DNI TYGODNIA --- */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {WEEKDAYS.map((day) => (
                      <span
                        key={day}
                        className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-gray-400"
                      >
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* --- SIATKA DNI --- */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {days.map((day) => {
                      const isSelected = selected
                        ? isSameDay(day, selected)
                        : false;
                      const isToday = isSameDay(day, currentDay);
                      const isOutside = !isSameMonth(day, viewMonth);

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => selectDay(day)}
                          aria-pressed={isSelected}
                          className={cn(
                            "h-9 cursor-pointer rounded-lg text-sm transition-colors",
                            isSelected
                              ? "bg-[#0c493e] font-bold text-white"
                              : isOutside
                                ? "text-gray-300 hover:bg-gray-50"
                                : "text-gray-700 hover:bg-[#c5e96b]/25",
                            // Dzisiaj podkreślamy obwódką, a nie wypełnieniem —
                            // wypełnienie znaczy „wybrane" i te dwa stany nie
                            // mogą wyglądać tak samo.
                            isToday &&
                              !isSelected &&
                              "font-bold text-[#0c493e] ring-1 ring-inset ring-[#0c493e]/40",
                          )}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  {/* --- SKRÓTY --- */}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                    <button
                      type="button"
                      onClick={() => selectDay(currentDay)}
                      className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0c493e] transition-colors hover:bg-[#c5e96b]/25"
                    >
                      Dziś
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onChange("");
                        setOpen(false);
                      }}
                      className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      Wyczyść
                    </button>
                  </div>
                </motion.div>
              </Popover.Content>
            </Popover.Portal>
          )}
        </AnimatePresence>
      </Popover.Root>
    </div>
  );
};
