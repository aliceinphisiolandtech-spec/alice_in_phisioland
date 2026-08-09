"use client";

import React, { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Collapse } from "@/components/admin/ui/primitives";
import { RETENTION_YEARS } from "@/lib/waitlist-retention";
import {
  deleteAllExpiredSubscribersAction,
  deleteExpiredSubscriberAction,
  type RetentionCleanupResult,
} from "@/app/actions/waitlist-retention";
import type { RetentionOverview } from "@/lib/waitlist-retention-data";

/**
 * Przypomnienie o okresie przechowywania danych z list zapisów.
 *
 * Polityka prywatności deklaruje usunięcie po {RETENTION_YEARS} latach.
 * Ten kafelek pilnuje, żeby deklaracja miała pokrycie: liczy dni, pokazuje
 * czyje adresy i daje przycisk. Kasowania NIE robi automat — decyzja i moment
 * należą do administratorki, bo operacja jest nieodwracalna.
 */

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "long",
  timeZone: "Europe/Warsaw",
});

export function RetentionWidget({ data }: { data: RetentionOverview }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isBulkPending, startBulk] = useTransition();

  const hasWork = data.dueCount > 0 || data.soonCount > 0;

  async function handleDeleteOne(id: string) {
    setBusyId(id);
    const response = await deleteExpiredSubscriberAction(id);
    setBusyId(null);

    if (response.error) {
      toast.error(response.error);
      return;
    }

    if (response.result) reportOutcome([response.result]);
    router.refresh();
  }

  function handleDeleteAll() {
    startBulk(async () => {
      const response = await deleteAllExpiredSubscribersAction();

      if (response.error) {
        toast.error(response.error);
        return;
      }

      setConfirmAll(false);
      if (response.results) reportOutcome(response.results);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "rounded-xl p-2.5",
              data.dueCount > 0
                ? "bg-red-50 text-red-600"
                : "bg-[#0c493e]/5 text-[#0c493e]",
            )}
          >
            {data.dueCount > 0 ? (
              <TriangleAlert size={20} />
            ) : (
              <ShieldCheck size={20} />
            )}
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Ochrona danych — zapisy</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Polityka prywatności obiecuje usunięcie adresów po{" "}
              {RETENTION_YEARS} latach od zapisu.
            </p>
          </div>
        </div>

        {hasWork && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            {open ? "Zwiń" : "Pokaż listę"}
            <ChevronDown
              size={14}
              className={cn("transition-transform", open && "rotate-180")}
            />
          </button>
        )}
      </div>

      {/* --- LICZNIKI --- */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Counter
          value={data.dueCount}
          label="do usunięcia teraz"
          tone={data.dueCount > 0 ? "danger" : "calm"}
        />
        <Counter
          value={data.soonCount}
          label="termin w ciągu 30 dni"
          tone={data.soonCount > 0 ? "warn" : "calm"}
        />
      </div>

      {!hasWork && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#0c493e]/[0.03] px-4 py-3 text-sm text-gray-600">
          <CalendarClock size={15} className="mt-0.5 shrink-0 text-gray-400" />
          {data.nextDeadline ? (
            <span>
              Nic nie wymaga teraz uwagi. Najbliższy termin usunięcia:{" "}
              <strong className="font-semibold text-gray-800">
                {dateFormatter.format(new Date(data.nextDeadline))}
              </strong>
              .
            </span>
          ) : (
            <span>Nie ma jeszcze żadnych zapisów do pilnowania.</span>
          )}
        </p>
      )}

      {/* --- LISTA --- */}
      <Collapse open={open && hasWork}>
        <div className="pt-4">
          <div className="max-h-[320px] overflow-y-auto rounded-xl border border-gray-100">
            <AnimatePresence initial={false}>
              {data.entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between gap-3 border-b border-gray-50 px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {entry.email}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {entry.campaign} · zapis{" "}
                      {dateFormatter.format(new Date(entry.signedUpAt))}
                      {entry.inMailerlite && " · jest w MailerLite"}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      entry.status === "due"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {entry.label}
                  </span>

                  {entry.status === "due" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteOne(entry.id)}
                      disabled={busyId === entry.id}
                      title="Usuń ten adres"
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {busyId === entry.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {data.truncated && (
            <p className="mt-2 text-xs text-gray-400">
              Pokazano pierwsze 100 pozycji — po usunięciu pojawią się kolejne.
            </p>
          )}

          {data.dueCount > 0 && (
            <button
              type="button"
              onClick={() => setConfirmAll(true)}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-700"
            >
              <Trash2 size={14} />
              Usuń wszystkie po terminie ({data.dueCount})
            </button>
          )}

          <Instructions />
        </div>
      </Collapse>

      <ConfirmDialog
        open={confirmAll}
        onOpenChange={setConfirmAll}
        tone="danger"
        title={`Usunąć ${data.dueCount} przeterminowanych adresów?`}
        description={
          <>
            Adresy zostaną usunięte z tej aplikacji, a z MailerLite zniknie
            powiązanie z kampanią. Osoby zapisane także na inne listy zostaną
            tam zachowane. <strong>Operacji nie da się cofnąć.</strong>
            {data.dueCount > 50 && (
              <>
                {" "}
                Jednorazowo usuwamy do 50 adresów — kliknij ponownie, żeby
                dokończyć.
              </>
            )}
          </>
        }
        confirmLabel="Usuń dane"
        onConfirm={handleDeleteAll}
        isPending={isBulkPending}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Counter({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "danger" | "warn" | "calm";
}) {
  const styles = {
    danger: "border-red-100 bg-red-50/50 text-red-600",
    warn: "border-amber-100 bg-amber-50/50 text-amber-700",
    calm: "border-gray-100 bg-gray-50 text-gray-400",
  }[tone];

  return (
    <div className={cn("rounded-xl border px-4 py-3", styles)}>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-xs font-medium">{label}</p>
    </div>
  );
}

/**
 * Instrukcja „co robi ten przycisk". Bez niej administratorka nie ma jak
 * wiedzieć, czy po kliknięciu sprawa jest zamknięta, czy trzeba jeszcze
 * czegoś dopilnować w MailerLite — a to jest różnica między zgodnością
 * a jej pozorem.
 */
function Instructions() {
  return (
    <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500">
      <p className="mb-1.5 font-bold text-gray-700">Co robi usunięcie</p>
      <ul className="list-disc space-y-1 pl-4">
        <li>
          kasuje adres i dowód zgody (treść, datę, IP) z tej aplikacji —
          bezpowrotnie,
        </li>
        <li>
          w MailerLite usuwa kontakt całkowicie, jeśli należał tylko do tej
          kampanii,
        </li>
        <li>
          jeśli osoba jest też na innych listach (np. kupiła e-book), zostaje
          tam zachowana — wypisujemy ją wyłącznie z grupy tej kampanii, bo tamte
          dane przetwarzasz na innej podstawie.
        </li>
      </ul>
      <p className="mt-2">
        Jeśli przy adresie pojawi się ostrzeżenie o MailerLite, sprawdź go
        ręcznie w panelu MailerLite — u nas został już usunięty.
      </p>
    </div>
  );
}

/** Zamienia wyniki operacji na jeden zrozumiały komunikat. */
function reportOutcome(results: RetentionCleanupResult[]) {
  const failed = results.filter((r) => r.outcome === "mailerlite_failed");
  const removed = results.length - failed.length;

  if (removed > 0) {
    toast.success(
      removed === 1
        ? "Adres usunięty."
        : `Usunięto ${removed} ${removed < 5 ? "adresy" : "adresów"}.`,
    );
  }

  if (failed.length > 0) {
    toast.warning(
      `MailerLite nie odpowiedział przy ${failed.length} ${
        failed.length === 1 ? "adresie" : "adresach"
      } — sprawdź je ręcznie: ${failed.map((r) => r.email).join(", ")}`,
      { duration: 15000 },
    );
  }
}
