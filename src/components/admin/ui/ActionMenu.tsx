"use client";

import React, { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Menu „trzy kropki" dla działań, które nie mieszczą się w rzędzie przycisków.
 *
 * Zbudowane na Radix DropdownMenu, a nie na własnym `div` z `onClick`, bo
 * z gotowego prymitywu dostajemy obsługę klawiatury (strzałki, Escape, Home,
 * End), zamykanie kliknięciem obok, pułapkę focusa i role ARIA. Wszystko to
 * trzeba by tu odtworzyć ręcznie, a menu w panelu bywa jedyną drogą do
 * operacji — nie może być nieosiągalne z klawiatury.
 *
 * Pozycje są elementami `ActionMenuItem`: albo link (pobranie pliku), albo
 * przycisk (działanie w kodzie). Ta sama pozycja może pokazać spinner, gdy
 * działanie trwa — patrz `isLoading` i `keepOpen`.
 */

export interface ActionMenuProps {
  /** Opis triggera dla czytnika ekranu — menu nie ma widocznej etykiety. */
  label: string;
  children: React.ReactNode;
  /** Do której krawędzi triggera przykleić menu. */
  align?: "start" | "end";
  /** Trwa działanie uruchomione z menu — kropki zamieniamy na spinner. */
  busy?: boolean;
  /** Nadpisanie wyglądu triggera (rząd akcji vs. nagłówek listy). */
  triggerClassName?: string;
}

const TRIGGER_BASE =
  "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#0c493e] data-[state=open]:bg-gray-100 data-[state=open]:text-[#0c493e]";

export function ActionMenu({
  label,
  children,
  align = "end",
  busy = false,
  triggerClassName,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(TRIGGER_BASE, triggerClassName)}
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <MoreHorizontal size={16} />
          )}
        </button>
      </DropdownMenu.Trigger>

      {/* forceMount + AnimatePresence — bez tego Radix odmontowuje treść
          natychmiast i animacja zamknięcia nie ma czego animować. */}
      <AnimatePresence>
        {open && (
          <DropdownMenu.Portal forceMount>
            <DropdownMenu.Content
              asChild
              forceMount
              align={align}
              sideOffset={6}
              collisionPadding={12}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.14 }}
                className="z-[90] w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg outline-none"
              >
                {children}
              </motion.div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
  );
}

export interface ActionMenuItemProps {
  icon: React.ReactNode;
  label: string;
  /** Zdanie pod etykietą — po co ta pozycja jest. */
  description?: React.ReactNode;
  /** Link (np. pobranie pliku). Wyklucza się z `onSelect`. */
  href?: string;
  onSelect?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  /** "danger" dla operacji nieodwracalnych — czerwony, odsunięty kreską. */
  tone?: "danger" | "default";
  /**
   * Zostaw menu otwarte po kliknięciu. Dla działań, które coś ładują —
   * inaczej menu znika razem ze spinnerem i nie widać, że cokolwiek trwa.
   */
  keepOpen?: boolean;
}

export function ActionMenuItem({
  icon,
  label,
  description,
  href,
  onSelect,
  isLoading = false,
  disabled = false,
  tone = "default",
  keepOpen = false,
}: ActionMenuItemProps) {
  const isDisabled = disabled || isLoading;
  const isDanger = tone === "danger";

  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 shrink-0",
          isDanger
            ? "text-red-400 group-hover:text-red-600"
            : "text-gray-400 group-hover:text-[#0c493e]",
        )}
      >
        {isLoading ? <Loader2 size={15} className="animate-spin" /> : icon}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm font-semibold",
            isDanger ? "text-red-600" : "text-gray-800",
          )}
        >
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-relaxed text-gray-500">
            {description}
          </span>
        )}
      </span>
    </>
  );

  const className = cn(
    "group flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60",
    isDanger
      ? // Kreska nad pozycją odsuwa ją od reszty: kasowanie listy nie ma
        // sąsiadować z pobraniem CSV tak blisko, żeby dało się je pomylić.
        "mt-1.5 border-t border-gray-100 pt-3 data-[highlighted]:bg-red-50"
      : "data-[highlighted]:bg-gray-50",
  );

  return (
    <DropdownMenu.Item
      asChild
      disabled={isDisabled}
      onSelect={(event) => {
        if (keepOpen) event.preventDefault();
        onSelect?.();
      }}
    >
      {href ? (
        <a href={href} className={className}>
          {content}
        </a>
      ) : (
        <button type="button" className={className}>
          {content}
        </button>
      )}
    </DropdownMenu.Item>
  );
}
