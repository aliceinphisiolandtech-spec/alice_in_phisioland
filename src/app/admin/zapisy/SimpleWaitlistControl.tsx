"use client";

import React, { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Collapse,
  EmptyState,
  ListCard,
  SPRING,
  Switch,
  inputClass,
  labelClass,
  listItemMotion,
} from "@/components/admin/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { WaitlistListMenu } from "@/components/admin/waitlist/WaitlistListMenu";
import {
  describeWaitlistStatus,
  resolveWaitlistPageStatus,
} from "@/lib/waitlist-status";
import {
  slugifyWaitlistInput,
  slugifyWaitlistName,
} from "@/lib/validators/waitlist";
import {
  deleteWaitlistSubscriberAction,
  toggleWaitlistPageAction,
  updateWaitlistBasicsAction,
} from "@/app/actions/waitlist";
import {
  SUBSCRIBERS_PER_PAGE,
  type WaitlistPageRow,
  type WaitlistSubscriberRow,
} from "./types";

/**
 * Widok listy oczekujących w zakresie Etapu 1.
 *
 * Celowo robi mało: pokazuje link, listę zapisanych osób i pozwala zatrzymać
 * zbieranie oraz poprawić tytuł i adres strony. Układ, motyw, terminy, limit
 * i pozostała treść to kreator z Etapu 2 — patrz `lib/waitlist-features`.
 *
 * Nie jest to okrojona wersja kreatora „na chwilę". To osobny, kompletny widok
 * dla zakresu, który klientka faktycznie zamówiła: resztę ustawiamy my, a ona
 * ma móc sama zatrzymać zapisy, poprawić literówkę w tytule i zobaczyć, kto
 * się zapisał.
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
        <motion.div
          key={row.id}
          {...listItemMotion}
          className="flex flex-col gap-3"
        >
          <CampaignRow
            row={row}
            url={`${siteUrl}/zapisy/${row.slug}`}
            busy={busyId === row.id}
            onToggle={() => handleToggle(row)}
          />

          {/* Lista zapisanych osób — pod kartą kampanii, której dotyczy. */}
          <SubscriberList row={row} />
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
  const [editing, setEditing] = useState(false);

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
            <span className="text-base font-bold text-gray-900">
              {row.name}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                status.tone,
              )}
            >
              {status.label}
            </span>

            <button
              type="button"
              onClick={() => setEditing((open) => !open)}
              className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#0c493e]"
            >
              <Pencil size={11} />
              {editing ? "Zamknij" : "Edytuj"}
            </button>
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

      <Collapse open={editing}>
        <BasicsForm row={row} onDone={() => setEditing(false)} />
      </Collapse>

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
          <span className="text-[#0c493e]">
            +{row.recentCount} w ciągu 7 dni
          </span>
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

/* -------------------------------------------------------------------------- */
/* Edycja nazwy roboczej                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Pola kampanii edytowalne z panelu: nazwa robocza i adres.
 *
 * Te dwie zmiany mają zupełnie różny ciężar i formularz musi to pokazywać.
 * Nazwa robocza jest bezpieczna zawsze — nie widzi jej nikt poza tym ekranem,
 * nie ma jej ani na stronie, ani w linku, ani w wiadomościach. Adres widzi
 * cały świat i jego zmiana unieważnia link wklejony wcześniej w post, dlatego
 * dostaje ostrzeżenie, gdy tylko zacznie się różnić od zapisanego.
 *
 * Tytuł na stronie zostaje stały: to część treści kampanii, którą zmienia się
 * razem z resztą, a nie mimochodem z listy.
 */
function BasicsForm({
  row,
  onDone,
}: {
  row: WaitlistPageRow;
  onDone: () => void;
}) {
  const router = useRouter();

  const [name, setName] = useState(row.name);
  const [slug, setSlug] = useState(row.slug);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /*
   * Porównujemy adres PO pełnej normalizacji, nie to, co stoi w polu.
   * W trakcie pisania wartość bywa przejściowa („promocja-"), a taki stan nie
   * jest jeszcze zmianą — inaczej sam myślnik odblokowywałby przycisk zapisu
   * i wywoływał ostrzeżenie o zepsutym linku.
   */
  const normalizedSlug = slugifyWaitlistName(slug);
  const slugChanged = normalizedSlug !== row.slug;
  const dirty = slugChanged || name.trim() !== row.name;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    const result = await updateWaitlistBasicsAction(row.id, {
      name,
      slug: normalizedSlug,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setError(null);
    toast.success(
      slugChanged
        ? "Zapisane. Stary link już nie działa — skopiuj nowy."
        : "Zapisane.",
    );
    onDone();
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
    >
      <div>
        <label htmlFor={`${row.id}-name`} className={labelClass}>
          Nazwa robocza (widoczna tylko tutaj)
        </label>
        <input
          id={`${row.id}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={saving}
          autoFocus
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${row.id}-slug`} className={labelClass}>
          Adres strony
        </label>
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 font-mono text-xs text-gray-400">
            /zapisy/
          </span>
          <input
            id={`${row.id}-slug`}
            value={slug}
            // Normalizacja przy wpisywaniu, a nie dopiero przy zapisie: pole ma
            // pokazywać to, co faktycznie wyląduje w linku. Wariant „w trakcie
            // pisania" zostawia myślnik na końcu — bez tego nie dałoby się go
            // wpisać ani wstawić spacją.
            onChange={(event) =>
              setSlug(slugifyWaitlistInput(event.target.value))
            }
            disabled={saving}
            className={cn(inputClass, "font-mono text-xs")}
          />
        </div>

        {slugChanged && (
          <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <TriangleAlert size={13} className="mt-0.5 shrink-0" />
            Po zapisaniu link wklejony wcześniej w post przestanie działać — kto
            kliknie stary, trafi na komunikat o nieistniejącej stronie.
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !dirty}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0c493e] px-4 py-2 text-xs font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : null}
          {saving ? "Zapisuję…" : "Zapisz"}
        </button>

        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="cursor-pointer rounded-lg px-3 py-2 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-100"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Lista zapisanych osób                                                       */
/* -------------------------------------------------------------------------- */

const signupDateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Warsaw",
});

/**
 * Kto się zapisał — rozwijana lista pod kartą kampanii, po stronach.
 *
 * Zwinięta domyślnie: to są dane osobowe, więc nie mają wisieć na ekranie
 * przy każdym wejściu w panel, tylko wtedy, gdy ktoś świadomie po nie sięga.
 *
 * Pierwsza strona przychodzi z serwera razem z całym panelem, kolejne dociąga
 * przeglądarka. Dlatego nie ma tu żadnego „pokazuję ostatnie N": każdy zapis
 * jest osiągalny, a rozmiar odpowiedzi nie rośnie razem z listą.
 */
function SubscriberList({ row }: { row: WaitlistPageRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Osoba czekająca na potwierdzenie usunięcia (null = okno zamknięte).
  const [pendingDelete, setPendingDelete] =
    useState<WaitlistSubscriberRow | null>(null);
  const [isDeleting, startDelete] = useTransition();

  /*
   * Dociągnięta strona nadpisuje tę z serwera dopiero wtedy, gdy istnieje.
   * Przy pierwszym rozwinięciu nie ma na co czekać ani czego pobierać — dane
   * przyszły już z panelem.
   */
  const [fetched, setFetched] = useState<{
    items: WaitlistSubscriberRow[];
    total: number;
  } | null>(null);

  const items = fetched?.items ?? row.subscribers;
  const total = fetched?.total ?? row.subscriberCount;
  const pageCount = Math.max(1, Math.ceil(total / SUBSCRIBERS_PER_PAGE));

  async function goToPage(next: number) {
    if (loading || next < 1 || next > pageCount) return;

    // Powrót na pierwszą stronę to zejście do danych z serwera — świeższych
    // niż cokolwiek, co zdążyliśmy pobrać wcześniej.
    if (next === 1) {
      setFetched(null);
      setPage(1);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(
        `/api/admin/waitlist/${row.id}/subscribers?page=${next}`,
      );

      if (!response.ok) throw new Error("Nie udało się pobrać listy.");

      const data = await response.json();
      setFetched({ items: data.items, total: data.total });
      setPage(next);
    } catch {
      setLoadError("Nie udało się pobrać tej strony. Spróbuj jeszcze raz.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Przeładowanie widoku po usunięciu wiersza.
   *
   * `router.refresh()` odświeża tylko dane, które przyszły z serwerem — czyli
   * pierwszą stronę. Dla dalszych stron trzeba pobrać je jeszcze raz, a gdy
   * skasowany wiersz był na niej ostatni, cofnąć się o jedną: inaczej panel
   * pokazywałby pustą stronę nr 3 przy dwóch istniejących.
   */
  async function reloadAfterDelete(targetPage: number) {
    if (targetPage <= 1) {
      setFetched(null);
      setPage(1);
      router.refresh();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/waitlist/${row.id}/subscribers?page=${targetPage}`,
      );

      if (!response.ok) throw new Error("Nie udało się pobrać listy.");

      const data = await response.json();

      if (data.items.length === 0) {
        await reloadAfterDelete(targetPage - 1);
        return;
      }

      setFetched({ items: data.items, total: data.total });
      setPage(targetPage);
    } catch {
      setLoadError("Nie udało się odświeżyć listy. Odśwież stronę panelu.");
    } finally {
      setLoading(false);
    }

    router.refresh();
  }

  function handleDelete() {
    const target = pendingDelete;
    if (!target) return;

    startDelete(async () => {
      const result = await deleteWaitlistSubscriberAction(target.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPendingDelete(null);
      toast.success(`Adres ${target.email} usunięty z listy.`);
      await reloadAfterDelete(page);
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={total === 0}
          className={cn(
            "flex items-center gap-2 text-sm font-bold text-gray-900",
            total === 0 ? "cursor-default" : "cursor-pointer",
          )}
        >
          <Users size={15} className="text-gray-400" />
          Zapisane osoby
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
            {total}
          </span>
          {total > 0 && (
            <ChevronDown
              size={15}
              className={cn(
                "text-gray-400 transition-transform",
                open && "rotate-180",
              )}
            />
          )}
        </button>

        {/*
          Działania na liście są dostępne zawsze, nie tylko po rozwinięciu:
          eksport to jedyna droga do pełnego śladu zgody (treść, moment, IP),
          którego wymaga RODO.
        */}
        {total > 0 && (
          <WaitlistListMenu
            pageId={row.id}
            subscriberCount={total}
            // Po wyczyszczeniu listy zejdź do danych z serwera — dotąd
            // pokazywana strona nr 3 już nie istnieje.
            onCleared={() => {
              setFetched(null);
              setPage(1);
              setOpen(false);
            }}
          />
        )}
      </div>

      {total === 0 ? (
        <p className="border-t border-gray-100 px-4 py-4 text-xs text-gray-500">
          Nikt jeszcze się nie zapisał. Adresy pojawią się tutaj od razu po
          pierwszym zapisie.
        </p>
      ) : (
        <Collapse open={open}>
          <div className="border-t border-gray-100">
            <ul
              className={cn(
                "divide-y divide-gray-100 transition-opacity",
                loading && "opacity-50",
              )}
            >
              {items.map((subscriber) => (
                <SubscriberRow
                  key={subscriber.id}
                  subscriber={subscriber}
                  onDelete={() => setPendingDelete(subscriber)}
                  disabled={isDeleting || loading}
                />
              ))}
            </ul>

            {loadError && (
              <p
                role="alert"
                className="border-t border-gray-100 px-4 py-3 text-xs text-red-700"
              >
                {loadError}
              </p>
            )}

            {/* Sterowanie stronami ma sens dopiero wtedy, gdy jest ich więcej niż jedna. */}
            {pageCount > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
                <span className="text-xs text-gray-500">
                  Strona {page} z {pageCount} · {total} zapisanych
                </span>

                <div className="flex items-center gap-1">
                  <PageButton
                    onClick={() => goToPage(page - 1)}
                    disabled={loading || page === 1}
                    label="Poprzednia strona"
                  >
                    <ChevronLeft size={15} />
                  </PageButton>

                  <PageButton
                    onClick={() => goToPage(page + 1)}
                    disabled={loading || page === pageCount}
                    label="Następna strona"
                  >
                    {loading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <ChevronRight size={15} />
                    )}
                  </PageButton>
                </div>
              </div>
            )}
          </div>
        </Collapse>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        tone="danger"
        title="Usunąć ten adres z listy?"
        description={
          <>
            Z listy zniknie <strong>{pendingDelete?.email}</strong> razem ze
            śladem zgody (treść, data, IP). Jeśli kontakt trafił wcześniej do
            MailerLite, zostanie tam nietknięty — trzeba go usunąć osobno. Tej
            operacji nie da się cofnąć.
          </>
        }
        confirmLabel="Usuń adres"
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  );
}

/** Strzałka przewijania stron — sam kształt, bez własnej logiki. */
function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      // Sama strzałka nic nie mówi czytnikowi ekranu — nazwa idzie atrybutem.
      aria-label={label}
      title={label}
      className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0c493e] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function SubscriberRow({
  subscriber,
  onDelete,
  disabled,
}: {
  subscriber: WaitlistSubscriberRow;
  onDelete: () => void;
  disabled: boolean;
}) {
  const sync = describeSync(subscriber.syncStatus);

  return (
    <li className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-900">{subscriber.email}</p>
        {subscriber.name && (
          <p className="truncate text-xs text-gray-500">{subscriber.name}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {sync && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              sync.tone,
            )}
          >
            {sync.label}
          </span>
        )}

        <span className="text-xs whitespace-nowrap text-gray-400">
          {signupDateFormatter.format(new Date(subscriber.createdAt))}
        </span>

        {/*
          Kosz wygaszony do czasu najechania na wiersz — kasowanie pojedynczej
          osoby to rzadki wyjątek (żądanie z RODO, literówka w adresie), a nie
          codzienna operacja. Na dotyku nie ma stanu „hover", więc `focus`
          i pełna widoczność na małych ekranach zostają: `opacity-100` schodzi
          do `sm:opacity-0`, żeby przycisk nie był tam nieosiągalny.
        */}
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          aria-label={`Usuń ${subscriber.email} z listy`}
          title="Usuń z listy"
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-300 opacity-100 transition-all hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

/**
 * Status przekazania do MailerLite -> etykieta.
 *
 * Stan udany nie dostaje etykiety w ogóle: tak wygląda zdecydowana większość
 * wierszy, a lista złożona z powtarzającego się „Przekazany" przestaje
 * cokolwiek komunikować. Widoczne są tylko te, z którymi coś jest nie tak.
 */
function describeSync(status: string): { label: string; tone: string } | null {
  switch (status) {
    case "pending":
      return { label: "Czeka", tone: "bg-amber-50 text-amber-700" };
    case "failed":
      return { label: "Błąd wysyłki", tone: "bg-red-50 text-red-700" };
    case "skipped":
      return { label: "Tylko u nas", tone: "bg-gray-100 text-gray-600" };
    default:
      return null;
  }
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
