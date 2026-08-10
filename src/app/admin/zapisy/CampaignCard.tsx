"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BarChart3,
  Check,
  Copy,
  CopyPlus,
  ExternalLink,
  Pencil,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Collapse,
  ListCard,
  SPRING,
  Switch,
} from "@/components/admin/ui/primitives";
import { WaitlistListMenu } from "@/components/admin/waitlist/WaitlistListMenu";
import {
  describeWaitlistStatus,
  resolveWaitlistPageStatus,
} from "@/lib/waitlist-status";
import { WAITLIST_LAYOUTS, WAITLIST_THEMES } from "@/lib/waitlist-appearance";
import { SignupsChart } from "./SignupsChart";
import type { WaitlistPageRow } from "./types";

/**
 * Jedna kampania na liście.
 *
 * Najważniejszy element to LINK — po to powstaje cała ta strona. Dlatego ma
 * własny wiersz z przyciskiem kopiowania, a nie jest schowany w edycji.
 */

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "long",
  timeZone: "Europe/Warsaw",
});

export function CampaignCard({
  row,
  siteUrl,
  busy,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  row: WaitlistPageRow;
  siteUrl: string;
  busy: boolean;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [showStats, setShowStats] = useState(false);

  const status = describeWaitlistStatus(
    resolveWaitlistPageStatus({
      isActive: row.isActive,
      opensAt: row.opensAt ? new Date(row.opensAt) : null,
      closesAt: row.closesAt ? new Date(row.closesAt) : null,
    }),
  );

  const url = `${siteUrl}/zapisy/${row.slug}`;
  const layoutLabel = WAITLIST_LAYOUTS.find(
    (layout) => layout.value === row.layoutVariant,
  )?.label;
  const themeLabel = WAITLIST_THEMES.find(
    (theme) => theme.value === row.theme,
  )?.label;

  return (
    <ListCard busy={busy} tone={status.cardTone}>
      <div className="flex items-start justify-between gap-4 max-[640px]:flex-col">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-gray-900">{row.name}</span>
            <StatusBadge label={status.label} tone={status.tone} />
            {row.unsyncedCount > 0 && <UnsyncedBadge count={row.unsyncedCount} />}
          </div>

          <p className="text-xs text-gray-500">
            {layoutLabel} · {themeLabel} ·{" "}
            {row.collectName ? "zbiera imię i e-mail" : "zbiera sam e-mail"} ·{" "}
            {row.mailerliteGroupId
              ? "wysyła do MailerLite"
              : "zapis tylko do bazy"}
          </p>

          <p className="mt-1 text-xs text-gray-400">{describeWindow(row)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {row.isActive ? "Włączona" : "Wyłączona"}
          </span>
          <Switch
            checked={row.isActive}
            onChange={onToggle}
            disabled={busy}
            label={`Przełącz kampanię ${row.name}`}
            size="sm"
          />
        </div>
      </div>

      <LinkRow url={url} />

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Users size={13} className="text-gray-400" />
          <strong className="text-sm font-bold text-gray-900">
            {row.subscriberCount}
          </strong>
          {row.subscriberCount === 1 ? "zapisana osoba" : "zapisanych osób"}
        </span>

        {row.recentCount > 0 && (
          <span className="text-[#0c493e]">+{row.recentCount} w ciągu 7 dni</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
        <CardLink icon={<Pencil size={13} />} label="Edytuj" href={`/admin/zapisy/${row.id}`} />
        <CardAction
          icon={<CopyPlus size={13} />}
          label="Zrób kopię"
          onClick={onDuplicate}
          title="Utworzy wyłączoną kopię jako punkt wyjścia dla kolejnej akcji"
        />
        <CardAction
          icon={<BarChart3 size={13} />}
          label={showStats ? "Ukryj wykres" : "Pokaż wykres"}
          onClick={() => setShowStats((open) => !open)}
        />

        {/* Działania na zebranej liście (CSV, zniżka) siedzą pod trzema
            kropkami — rząd akcji karty dotyczy samej kampanii i nie ma
            puchnąć razem z tym, co da się zrobić z adresami. */}
        {row.subscriberCount > 0 && (
          <WaitlistListMenu
            pageId={row.id}
            subscriberCount={row.subscriberCount}
            triggerClassName="h-[30px] w-[30px] border border-gray-200 hover:border-gray-300"
          />
        )}

        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={13} />
          Usuń
        </button>
      </div>

      <Collapse open={showStats}>
        <div className="pt-4">
          <SignupsChart data={row.dailySignups} />
        </div>
      </Collapse>
    </ListCard>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Wiersz z linkiem. Kopiowanie przez `navigator.clipboard`, ale z jawną
 * obsługą odmowy: API wymaga bezpiecznego kontekstu (HTTPS albo localhost),
 * więc na podglądzie po HTTP potrafi rzucić wyjątkiem. Cicha awaria przycisku
 * „kopiuj" jest gorsza niż jego brak — użytkownik wkleiłby stary schowek.
 */
function LinkRow({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-600">
          {url}
        </span>

        <motion.button
          type="button"
          onClick={copy}
          whileTap={{ scale: 0.94 }}
          transition={SPRING}
          title="Skopiuj link do schowka"
          className={cn(
            "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
            copied
              ? "bg-[#0c493e] text-white"
              : "text-gray-500 hover:bg-white hover:text-[#0c493e]",
          )}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Skopiowano" : "Kopiuj"}
        </motion.button>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          title="Otwórz stronę w nowej karcie"
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-white hover:text-[#0c493e]"
        >
          <ExternalLink size={13} />
          Podgląd
        </a>
      </div>

      {failed && (
        <p className="mt-1.5 text-xs text-amber-600">
          Przeglądarka nie pozwoliła skopiować automatycznie — zaznacz adres
          powyżej i skopiuj ręcznie.
        </p>
      )}
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        tone,
      )}
    >
      {label}
    </span>
  );
}

/** Sygnał, że kontakty czekają w bazie zamiast być w MailerLite. */
function UnsyncedBadge({ count }: { count: number }) {
  return (
    <span
      title="Te kontakty są bezpieczne w naszej bazie, ale nie dotarły jeszcze do MailerLite. Dobowy cron ponawia wysyłkę."
      className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700"
    >
      <TriangleAlert size={10} />
      {count} do dosłania
    </span>
  );
}

/** Wygląd plakietki akcji — wspólny dla przycisków i linków w stopce karty. */
const ACTION_CLASSES =
  "flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900";

function CardAction({
  icon,
  label,
  onClick,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={ACTION_CLASSES}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Ta sama plakietka co `CardAction`, ale prowadzi na inną stronę.
 *
 * Edycja to przejście do kreatora, więc musi być linkiem: ma się otwierać
 * w nowej karcie środkowym przyciskiem i pokazywać adres na pasku stanu.
 */
function CardLink({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link href={href} className={ACTION_CLASSES}>
      {icon}
      {label}
    </Link>
  );
}

/** Okno zapisów słowami — data bez godziny, bo kreator operuje pełnymi dobami. */
function describeWindow(row: WaitlistPageRow): string {
  if (!row.opensAt && !row.closesAt) return "Bez ograniczeń czasowych";

  const from = row.opensAt
    ? dateFormatter.format(new Date(row.opensAt))
    : "od zawsze";
  const until = row.closesAt
    ? dateFormatter.format(new Date(row.closesAt))
    : "bezterminowo";

  return `${from} — ${until}`;
}
