"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Ticket, CalendarRange, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPln } from "@/lib/pricing";
import { formatDiscountValue, getDiscountStatus } from "@/lib/discounts";
import {
  deleteDiscountAction,
  toggleDiscountAction,
} from "@/app/actions/discounts";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DiscountForm } from "./DiscountForm";
import {
  AddButton,
  Collapse,
  EmptyState,
  FormShell,
  ListCard,
  ListHeader,
  SandboxBadge,
  StatusBadge,
  Switch,
  UsageBar,
  UsageMeter,
  formatWindow,
  listItemMotion,
} from "./_shared";
import type { DiscountRow } from "./types";

type FormMode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; row: DiscountRow };

export const CodesTab = ({
  codes,
  basePrice,
}: {
  codes: DiscountRow[];
  basePrice: number;
}) => {
  const router = useRouter();
  const [form, setForm] = useState<FormMode>({ kind: "closed" });
  // Które ID jest właśnie przetwarzane — blokuje przyciski tylko tego wiersza.
  const [busyId, setBusyId] = useState<string | null>(null);
  // Wiersz czekający na potwierdzenie usunięcia (null = okno zamknięte).
  const [pendingDelete, setPendingDelete] = useState<DiscountRow | null>(null);
  const [isDeleting, startTransition] = useTransition();

  const closeForm = () => setForm({ kind: "closed" });

  const handleSaved = () => {
    closeForm();
    router.refresh();
  };

  const handleToggle = (row: DiscountRow) => {
    setBusyId(row.id);

    startTransition(async () => {
      const res = await toggleDiscountAction(row.id, !row.isActive);
      setBusyId(null);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(
        res.isActive
          ? `Kod ${row.code} włączony.`
          : `Kod ${row.code} wyłączony.`,
      );
      router.refresh();
    });
  };

  /**
   * Wejście w edycję wyłącza działający kod — patrz komentarz w SalesTab.
   * Po zapisaniu włączasz go z powrotem świadomym klikiem.
   */
  const handleStartEdit = (row: DiscountRow) => {
    setForm({ kind: "edit", row });

    if (!row.isActive) return;

    setBusyId(row.id);

    startTransition(async () => {
      const res = await toggleDiscountAction(row.id, false);
      setBusyId(null);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.info(
        `Kod ${row.code} został wyłączony na czas edycji. Włącz go ponownie po zapisaniu.`,
      );
      router.refresh();
    });
  };

  const handleDelete = () => {
    const row = pendingDelete;
    if (!row) return;

    setBusyId(row.id);

    startTransition(async () => {
      const res = await deleteDiscountAction(row.id);
      setBusyId(null);
      setPendingDelete(null);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Kod ${row.code} usunięty.`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {form.kind === "closed" && (
        <ListHeader
          count={codes.length}
          emptyLabel="Nie masz jeszcze żadnego kodu."
          countLabel={(n) => `Kodów w systemie: ${n}`}
          action={
            <AddButton
              onClick={() => setForm({ kind: "new" })}
              label="Dodaj kod"
            />
          }
        />
      )}

      {/* Formularz NOWEGO kodu stoi nad listą — nie ma karty do rozwinięcia.
          Edycja dzieje się w środku właściwej karty (niżej). */}
      <AnimatePresence initial={false}>
        {form.kind === "new" && (
          <FormShell>
            <DiscountForm
              editing={null}
              basePrice={basePrice}
              onDone={handleSaved}
              onCancel={closeForm}
            />
          </FormShell>
        )}
      </AnimatePresence>

      {codes.length === 0 ? (
        <EmptyState
          icon={<Ticket size={24} />}
          title="Brak kodów rabatowych"
          hint="Dodaj pierwszy kod przyciskiem powyżej."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {codes.map((row) => {
              const status = getDiscountStatus(row);
              const isBusy = busyId === row.id;
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
                          <span className="font-mono text-base font-bold tracking-wide text-gray-900">
                            {row.code}
                          </span>
                          <span className="rounded-full bg-[#0c493e] px-2 py-0.5 text-[10px] font-bold text-white">
                            {formatDiscountValue(row)}
                          </span>
                          <StatusBadge status={status} />
                          {row.isSandbox && <SandboxBadge />}
                          {row.stackableWithSale && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                              <Layers size={10} />
                              Łączy się
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarRange
                              size={12}
                              className="text-gray-400"
                            />
                            {formatWindow(row)}
                          </span>

                          <UsageMeter
                            usageLimit={row.usageLimit}
                            usedCount={row.usedCount}
                          />

                          {row.totalDiscountGrosze > 0 && (
                            <span>
                              Udzielono rabatów:{" "}
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
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Switch
                          checked={row.isActive}
                          onChange={() => handleToggle(row)}
                          disabled={isBusy}
                          label={`Włącz lub wyłącz kod ${row.code}`}
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
                              : `Edytuj kod ${row.code}`
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
                          aria-label={`Usuń kod ${row.code}`}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Edycja rozwija się WEWNĄTRZ karty — widać, który kod
                        się zmienia, i nie ma jego duplikatu nad listą. */}
                    <Collapse open={isEditing}>
                      <div className="mt-5 border-t border-gray-100 pt-5">
                        <DiscountForm
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

      <p className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-relaxed text-blue-700/90">
        Limit użyć zmniejsza się dopiero po opłaconym zamówieniu — porzucone
        koszyki nie zjadają puli. Termin ważności jest sprawdzany przy każdej
        próbie użycia kodu, a codzienny cron (23:30) dodatkowo wyłącza
        przeterminowane kody i przysyła o tym powiadomienie.
      </p>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        tone="danger"
        title={`Usunąć kod ${pendingDelete?.code ?? ""}?`}
        description="Zamówienia, w których go użyto, zachowają pełną historię rabatu. Tej operacji nie da się cofnąć."
        confirmLabel="Usuń kod"
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  );
};
