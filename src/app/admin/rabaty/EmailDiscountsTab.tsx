"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Trash2,
  Users,
  CalendarRange,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPln } from "@/lib/pricing";
import { formatDiscountValue, getDiscountStatus } from "@/lib/discounts";
import {
  addEmailsAction,
  clearEmailsAction,
  deleteEmailDiscountAction,
  removeEmailAction,
  toggleEmailDiscountAction,
} from "@/app/actions/email-discounts";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmailDiscountForm } from "./EmailDiscountForm";
import {
  AddButton,
  Collapse,
  EmptyState,
  FormShell,
  ListCard,
  ListHeader,
  SandboxBadge,
  StatusBadge,
  SPRING,
  Switch,
  UsageBar,
  UsageMeter,
  formatWindow,
  inputClass,
  listItemMotion,
} from "./_shared";
import type { EmailDiscountRow, WaitlistSourceRow } from "./types";

type FormMode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; row: EmailDiscountRow };

/** Zarządzanie listą adresów objętych zniżką. */
const EmailList = ({ row }: { row: EmailDiscountRow }) => {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [isPending, startTransition] = useTransition();
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, startClearing] = useTransition();

  const handleClear = () => {
    startClearing(async () => {
      const res = await clearEmailsAction(row.id);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      setConfirmClear(false);
      toast.success(`Lista wyczyszczona — usuniętych adresów: ${res.removed}.`);
      router.refresh();
    });
  };

  const handleAdd = () => {
    if (raw.trim() === "") {
      toast.error("Wklej przynajmniej jeden adres e-mail.");
      return;
    }

    startTransition(async () => {
      const res = await addEmailsAction(row.id, raw);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      setRaw("");

      const parts = [`Dodano adresów: ${res.added}`];
      if (res.skipped) parts.push(`już na liście: ${res.skipped}`);
      if (res.invalid?.length) parts.push(`odrzucono: ${res.invalid.length}`);

      toast.success(parts.join(", ") + ".");
      router.refresh();
    });
  };

  const handleRemove = (memberId: string, email: string) => {
    startTransition(async () => {
      const res = await removeEmailAction(memberId);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Usunięto ${email} z listy.`);
      router.refresh();
    });
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-start gap-2 max-[560px]:flex-col">
        <div className="flex-1">
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              // Enter dodaje, Shift+Enter robi nową linię. Wklejanie wielu
              // linii naraz działa dalej — schowek nie przechodzi przez keydown.
              if (e.key !== "Enter" || e.shiftKey) return;

              e.preventDefault();

              // Enter na pustym polu ma nic nie robić zamiast rzucać błędem,
              // a podwójne wciśnięcie w trakcie zapisu nie może dublować żądania.
              if (isPending || raw.trim() === "") return;

              handleAdd();
            }}
            rows={2}
            placeholder="Wpisz adres i naciśnij Enter — albo wklej całą listę naraz"
            className={cn(inputClass, "w-full resize-y")}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Enter dodaje, Shift+Enter przechodzi do nowej linii. Wklejona lista
            może być oddzielona przecinkami, średnikami albo nowymi liniami.
          </p>
        </div>
        <LoadingButton
          type="button"
          onClick={handleAdd}
          isLoading={isPending}
          variant="secondary"
          className="shrink-0 rounded-lg text-xs font-bold uppercase tracking-wider max-[560px]:w-full"
        >
          Dodaj
        </LoadingButton>
      </div>

      {row.members.length === 0 ? (
        <p className="mt-3 text-xs text-gray-400">
          Lista jest pusta — zniżka nikomu się nie naliczy.
        </p>
      ) : (
        <>
          {/* Kasowanie całej listy stoi NAD nią, przy liczniku: pod listą
              kilkuset adresów nikt by go nie znalazł, a przy okazji trafiałby
              tam palcem, celując w ostatni krzyżyk. */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Na liście: {row.members.length}
            </span>

            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={isPending || isClearing}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={12} />
              Usuń wszystkie
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <AnimatePresence initial={false} mode="popLayout">
                {row.members.map((member) => (
                  <motion.span
                    key={member.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={SPRING}
                    className="flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-3 pr-1.5 text-xs text-gray-600"
                  >
                    {member.email}
                    <button
                      type="button"
                      onClick={() => handleRemove(member.id, member.email)}
                      disabled={isPending || isClearing}
                      aria-label={`Usuń ${member.email} z listy`}
                      className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-100 hover:text-red-500 disabled:cursor-not-allowed"
                    >
                      <X size={11} />
                    </button>
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={(open) => !open && setConfirmClear(false)}
        tone="danger"
        title="Wyczyścić listę adresów?"
        description={
          <>
            Z listy zniknie{" "}
            <strong>
              {row.members.length}{" "}
              {row.members.length === 1 ? "adres" : "adresów"}
            </strong>
            , a sama zniżka „{row.name}” zostanie — tylko przestanie się
            komukolwiek naliczać. Zamówienia zachowają pełną historię. Tej
            operacji nie da się cofnąć.
          </>
        }
        confirmLabel="Usuń wszystkie adresy"
        onConfirm={handleClear}
        isPending={isClearing}
      />
    </div>
  );
};

export const EmailDiscountsTab = ({
  discounts,
  basePrice,
  waitlistSource = null,
}: {
  discounts: EmailDiscountRow[];
  basePrice: number;
  /**
   * Kampania zapisów, z której admin przyszedł po zniżkę dla zebranej listy.
   * Otwiera formularz od razu — kliknięcie w menu przy liście adresów było
   * już decyzją „chcę taką zniżkę", więc drugi klik w „Dodaj zniżkę" byłby
   * pytaniem o to samo.
   */
  waitlistSource?: WaitlistSourceRow | null;
}) => {
  const router = useRouter();
  const [form, setForm] = useState<FormMode>(
    waitlistSource ? { kind: "new" } : { kind: "closed" },
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Wiersz czekający na potwierdzenie usunięcia (null = okno zamknięte).
  const [pendingDelete, setPendingDelete] = useState<EmailDiscountRow | null>(
    null,
  );
  const [isDeleting, startTransition] = useTransition();

  /**
   * Zamknięcie formularza kasuje też `?zapisy=` z adresu.
   *
   * Bez tego odświeżenie strony (albo powrót przyciskiem wstecz) otwierałoby
   * formularz jeszcze raz i kusiło do zrobienia drugiej takiej samej zniżki —
   * a lista adresów została już przepisana do pierwszej.
   */
  const closeForm = () => {
    setForm({ kind: "closed" });
    if (waitlistSource) router.replace("/admin/rabaty?tab=emails");
  };

  const handleSaved = () => {
    closeForm();
    router.refresh();
  };

  const handleToggle = (row: EmailDiscountRow) => {
    if (!row.isActive && row.members.length === 0) {
      toast.error(
        "Najpierw dodaj adresy — inaczej zniżka nikomu nie zadziała.",
      );
      return;
    }

    setBusyId(row.id);

    startTransition(async () => {
      const res = await toggleEmailDiscountAction(row.id, !row.isActive);
      setBusyId(null);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(
        res.isActive
          ? `Zniżka „${row.name}” włączona.`
          : `Zniżka „${row.name}” wyłączona.`,
      );
      router.refresh();
    });
  };

  /**
   * Wejście w edycję wyłącza działającą zniżkę — patrz komentarz w SalesTab.
   * Po zapisaniu włączasz ją z powrotem świadomym klikiem.
   */
  const handleStartEdit = (row: EmailDiscountRow) => {
    setForm({ kind: "edit", row });

    if (!row.isActive) return;

    setBusyId(row.id);

    startTransition(async () => {
      const res = await toggleEmailDiscountAction(row.id, false);
      setBusyId(null);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.info(
        `Zniżka „${row.name}” została wyłączona na czas edycji. Włącz ją ponownie po zapisaniu.`,
      );
      router.refresh();
    });
  };

  const handleDelete = () => {
    const row = pendingDelete;
    if (!row) return;

    setBusyId(row.id);

    startTransition(async () => {
      const res = await deleteEmailDiscountAction(row.id);
      setBusyId(null);
      setPendingDelete(null);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Zniżka „${row.name}” usunięta.`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {form.kind === "closed" && (
        <ListHeader
          count={discounts.length}
          emptyLabel="Nie masz jeszcze żadnej zniżki dla wybranych osób."
          countLabel={(n) => `Zniżek w systemie: ${n}`}
          action={
            <AddButton
              onClick={() => setForm({ kind: "new" })}
              label="Dodaj zniżkę"
            />
          }
        />
      )}

      {/* Formularz NOWEJ zniżki stoi nad listą — nie ma karty do rozwinięcia.
          Edycja dzieje się w środku właściwej karty (niżej). */}
      <AnimatePresence initial={false}>
        {form.kind === "new" && (
          <FormShell>
            <EmailDiscountForm
              editing={null}
              basePrice={basePrice}
              waitlistSource={waitlistSource}
              onDone={handleSaved}
              onCancel={closeForm}
            />
          </FormShell>
        )}
      </AnimatePresence>

      {discounts.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="Brak zniżek dla wybranych osób"
          hint="Zniżka naliczy się sama osobom z listy — bez wpisywania kodu."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {discounts.map((row) => {
              const status = getDiscountStatus(row);
              const isBusy = busyId === row.id;
              const isExpanded = expandedId === row.id;
              const isEditing = form.kind === "edit" && form.row.id === row.id;

              return (
                <motion.div key={row.id} {...listItemMotion}>
                  <ListCard
                    busy={isBusy}
                    tone={
                      row.isSandbox
                        ? "sandbox"
                        : status.key === "active"
                          ? "live"
                          : "idle"
                    }
                  >
                    <div className="flex items-start justify-between gap-4 max-[560px]:flex-col">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-gray-900">
                            {row.name}
                          </span>
                          <span className="rounded-full bg-[#0c493e] px-2 py-0.5 text-[10px] font-bold text-white">
                            {formatDiscountValue(row)}
                          </span>
                          <StatusBadge status={status} />
                          {row.isSandbox && <SandboxBadge />}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarRange
                              size={12}
                              className="text-gray-400"
                            />
                            {formatWindow(row)}
                          </span>

                          <span>Adresów na liście: {row.members.length}</span>

                          <UsageMeter
                            usageLimit={row.usageLimit}
                            usedCount={row.usedCount}
                          />

                          {row.totalDiscountGrosze > 0 && (
                            <span>
                              Udzielono zniżek:{" "}
                              <span className="font-semibold text-gray-600">
                                {formatPln(row.totalDiscountGrosze)}
                              </span>
                            </span>
                          )}
                        </div>

                        <UsageBar
                          usageLimit={row.usageLimit}
                          usedCount={row.usedCount}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : row.id)
                          }
                          className="mt-2 flex cursor-pointer items-center gap-1 text-xs font-bold text-[#0c493e] transition-colors hover:text-[#0a3b32]"
                        >
                          <ChevronDown
                            size={14}
                            className={cn(
                              "transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                          {isExpanded
                            ? "Ukryj listę adresów"
                            : "Zarządzaj listą adresów"}
                        </button>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Switch
                          checked={row.isActive}
                          onChange={() => handleToggle(row)}
                          disabled={isBusy}
                          label={`Włącz lub wyłącz zniżkę ${row.name}`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            isEditing ? closeForm() : handleStartEdit(row)
                          }
                          disabled={isBusy}
                          aria-label={
                            isEditing
                              ? "Zamknij edycję"
                              : `Edytuj zniżkę ${row.name}`
                          }
                          className={cn(
                            "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed",
                            isEditing
                              ? "bg-[#0c493e]/10 text-[#0c493e]"
                              : "text-gray-400 hover:bg-gray-100 hover:text-[#0c493e]",
                          )}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPendingDelete(row)}
                          disabled={isBusy}
                          aria-label={`Usuń zniżkę ${row.name}`}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <Collapse open={isExpanded}>
                      <EmailList row={row} />
                    </Collapse>

                    {/* Edycja rozwija się WEWNĄTRZ karty — widać, którą zniżkę
                        się zmienia, i nie ma jej duplikatu nad listą. */}
                    <Collapse open={isEditing}>
                      <div className="mt-5 border-t border-gray-100 pt-5">
                        <EmailDiscountForm
                          editing={row}
                          basePrice={basePrice}
                          onDone={handleSaved}
                          onCancel={closeForm}
                        />
                      </div>
                    </Collapse>
                  </ListCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        tone="danger"
        title={`Usunąć zniżkę „${pendingDelete?.name ?? ""}”?`}
        description={`Razem z nią zniknie lista ${pendingDelete?.members.length ?? 0} adresów. Zamówienia zachowają pełną historię. Tej operacji nie da się cofnąć.`}
        confirmLabel="Usuń zniżkę"
        onConfirm={handleDelete}
        isPending={isDeleting}
      />

      <p className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-relaxed text-blue-700/90">
        Zniżka nalicza się automatycznie osobom, których adres logowania jest na
        liście — bez wpisywania kodu. Nie sumuje się z przeceną: jeśli obie
        działają naraz, klientka dostaje tę korzystniejszą.
      </p>
    </div>
  );
};
