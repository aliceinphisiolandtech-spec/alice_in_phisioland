"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, TriangleAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  EmptyState,
  ListCard,
  SPRING,
  Switch,
  listItemMotion,
} from "@/components/admin/ui/primitives";
import {
  describeWaitlistStatus,
  resolveWaitlistPageStatus,
} from "@/lib/waitlist-status";
import { toggleWaitlistPageAction } from "@/app/actions/waitlist";
import type { WaitlistPageRow } from "./types";

/**
 * Widok listy oczekujących w zakresie Etapu 1.
 *
 * Celowo robi bardzo mało: pokazuje link, licznik zapisów i pozwala zatrzymać
 * zbieranie. Tworzenie i edycja stron to Etap 2 — patrz `lib/waitlist-features`.
 *
 * Nie jest to okrojona wersja kreatora „na chwilę". To osobny, kompletny widok
 * dla zakresu, który klientka faktycznie zamówiła: treść, limit i termin
 * ustawiamy my, a ona ma móc w każdej chwili wyłączyć zapisy sama.
 */
export function SimpleWaitlistControl({
  pages,
  siteUrl,
}: {
  pages: WaitlistPageRow[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggle(row: WaitlistPageRow) {
    setBusyId(row.id);
    const result = await toggleWaitlistPageAction(row.id, !row.isActive);
    setBusyId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      row.isActive
        ? "Zapisy zatrzymane — strona pokazuje komunikat o zamknięciu."
        : "Zapisy wznowione — link znów działa.",
    );
    router.refresh();
  }

  if (pages.length === 0) {
    return (
      <EmptyState
        icon={<Users size={22} />}
        title="Brak stron zapisów"
        hint="Strona zapisów zostanie tu wyświetlona, gdy tylko powstanie."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pages.map((row) => (
        <motion.div key={row.id} {...listItemMotion}>
          <CampaignRow
            row={row}
            url={`${siteUrl}/zapisy/${row.slug}`}
            busy={busyId === row.id}
            onToggle={() => handleToggle(row)}
          />
        </motion.div>
      ))}
    </div>
  );
}

function CampaignRow({
  row,
  url,
  busy,
  onToggle,
}: {
  row: WaitlistPageRow;
  url: string;
  busy: boolean;
  onToggle: () => void;
}) {
  const status = describeWaitlistStatus(
    resolveWaitlistPageStatus({
      isActive: row.isActive,
      opensAt: row.opensAt ? new Date(row.opensAt) : null,
      closesAt: row.closesAt ? new Date(row.closesAt) : null,
      maxSignups: row.maxSignups,
      signupCount: row.subscriberCount,
    }),
  );

  return (
    <ListCard busy={busy} tone={status.cardTone}>
      <div className="flex items-start justify-between gap-4 max-[640px]:flex-col">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-gray-900">{row.name}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                status.tone,
              )}
            >
              {status.label}
            </span>
          </div>

          <p className="text-xs text-gray-500">{describeLimits(row)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {row.isActive ? "Zbiera" : "Zatrzymane"}
          </span>
          <Switch
            checked={row.isActive}
            onChange={onToggle}
            disabled={busy}
            label={`Przełącz zapisy: ${row.name}`}
            size="sm"
          />
        </div>
      </div>

      <LinkRow url={url} />

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
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

      {/*
        Adresy, które nie doszły do MailerLite. Klientka nic z tym nie zrobi,
        ale musi wiedzieć, że lista w MailerLite jest chwilowo niepełna —
        inaczej wysłałaby kampanię do części zapisanych osób, nie wiedząc o tym.
      */}
      {row.unsyncedCount > 0 && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <TriangleAlert size={13} className="mt-0.5 shrink-0" />
          {row.unsyncedCount}{" "}
          {row.unsyncedCount === 1 ? "adres czeka" : "adresów czeka"} na
          przekazanie do MailerLite. System spróbuje ponownie automatycznie —
          jeśli to nie zniknie do jutra, daj znać.
        </p>
      )}
    </ListCard>
  );
}

/** Limit i termin są ustawiane przez nas, więc tutaj tylko o nich informujemy. */
function describeLimits(row: WaitlistPageRow): string {
  const parts: string[] = [];

  if (row.maxSignups !== null) {
    parts.push(`limit ${row.maxSignups} miejsc`);
  }

  if (row.closesAt) {
    parts.push(
      `zbiera do ${new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "long",
        timeZone: "Europe/Warsaw",
      }).format(new Date(row.closesAt))}`,
    );
  }

  return parts.length > 0
    ? parts.join(" · ")
    : "Bez limitu miejsc i bez daty zakończenia.";
}

/**
 * Kopiowanie z jawną obsługą odmowy: `navigator.clipboard` wymaga bezpiecznego
 * kontekstu i potrafi rzucić wyjątkiem. Cicha awaria przycisku „kopiuj" jest
 * gorsza niż jego brak — ktoś wkleiłby do posta poprzednią zawartość schowka.
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
          Otwórz
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
