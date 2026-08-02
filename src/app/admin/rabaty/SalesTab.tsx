"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Tag, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPln } from "@/lib/pricing";
import { getDiscountStatus } from "@/lib/discounts";
import { deleteSaleAction, toggleSaleAction } from "@/app/actions/sales";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SaleForm } from "./SaleForm";
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
import type { SaleRow } from "./types";

type FormMode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; row: SaleRow };

function saleLabel(row: SaleRow): string {
  if (row.type === "fixed_price") {
    return `cena ${formatPln(row.fixedPrice ?? 0)}`;
  }
  return `−${row.percentOff ?? 0}%`;
}

export const SalesTab = ({
  sales,
  basePrice,
}: {
  sales: SaleRow[];
  basePrice: number;
}) => {
  const router = useRouter();
  const [form, setForm] = useState<FormMode>({ kind: "closed" });
  const [busyId, setBusyId] = useState<string | null>(null);
  // Wiersz czekający na potwierdzenie usunięcia (null = okno zamknięte).
  const [pendingDelete, setPendingDelete] = useState<SaleRow | null>(null);
  const [isDeleting, startTransition] = useTransition();

  // Ile przecen realnie działa w tej chwili — ostrzegamy, gdy więcej niż jedna.
  const runningCount = sales.filter(
    (row) => getDiscountStatus(row).key === "active",
  ).length;

  const closeForm = () => setForm({ kind: "closed" });

  const handleSaved = () => {
    closeForm();
    router.refresh();
  };

  const handleToggle = (row: SaleRow) => {
    setBusyId(row.id);

    startTransition(async () => {
      const res = await toggleSaleAction(row.id, !row.isActive);
      setBusyId(null);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(
        res.isActive
          ? `Przecena „${row.name}” włączona.`
          : `Przecena „${row.name}” wyłączona.`,
      );
      router.refresh();
    });
  };

  /**
   * Wejście w edycję wyłącza działającą przecenę. Inaczej klientki kupowałyby
   * po cenie, którą właśnie przestawiasz — a każdy zapis pola zmieniałby im
   * kwotę na żywo. Po zapisaniu włączasz ją z powrotem świadomym klikiem.
   */
  const handleStartEdit = (row: SaleRow) => {
    setForm({ kind: "edit", row });

    if (!row.isActive) return;

    setBusyId(row.id);

    startTransition(async () => {
      const res = await toggleSaleAction(row.id, false);
      setBusyId(null);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.info(
        `Przecena „${row.name}” została wyłączona na czas edycji. Włącz ją ponownie po zapisaniu.`,
      );
      router.refresh();
    });
  };

  const handleDelete = () => {
    const row = pendingDelete;
    if (!row) return;

    setBusyId(row.id);

    startTransition(async () => {
      const res = await deleteSaleAction(row.id);
      setBusyId(null);
      setPendingDelete(null);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Przecena „${row.name}” usunięta.`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {form.kind === "closed" && (
        <ListHeader
          count={sales.length}
          emptyLabel="Nie masz jeszcze żadnej przeceny."
          countLabel={(n) => `Przecen w systemie: ${n}`}
          action={
            <AddButton
              onClick={() => setForm({ kind: "new" })}
              label="Dodaj przecenę"
            />
          }
        />
      )}

      {runningCount > 1 && form.kind === "closed" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-800">
          Działa teraz {runningCount} przeceny naraz. Nie sumują się — klientka
          dostaje tę korzystniejszą — ale warto zostawić tylko jedną, żeby
          komunikacja była jednoznaczna.
        </p>
      )}

      {/* Formularz NOWEJ przeceny stoi nad listą — nie ma karty, którą można
          by rozwinąć. Edycja dzieje się w środku właściwej karty (niżej). */}
      <AnimatePresence initial={false}>
        {form.kind === "new" && (
          <FormShell>
            <SaleForm
              editing={null}
              basePrice={basePrice}
              onDone={handleSaved}
              onCancel={closeForm}
            />
          </FormShell>
        )}
      </AnimatePresence>

      {sales.length === 0 ? (
        <EmptyState
          icon={<Tag size={24} />}
          title="Brak przecen"
          hint="Przecena obniża cenę wszystkim, bez wpisywania kodu."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {sales.map((row) => {
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
                          <span className="text-base font-bold text-gray-900">
                            {row.name}
                          </span>
                          <span className="rounded-full bg-[#0c493e] px-2 py-0.5 text-[10px] font-bold text-white">
                            {saleLabel(row)}
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

                          <UsageMeter
                            usageLimit={row.usageLimit}
                            usedCount={row.usedCount}
                          />

                          {row.totalDiscountGrosze > 0 && (
                            <span>
                              Udzielono obniżek:{" "}
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
                          label={`Włącz lub wyłącz przecenę ${row.name}`}
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
                              : `Edytuj przecenę ${row.name}`
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
                          aria-label={`Usuń przecenę ${row.name}`}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Edycja rozwija się WEWNĄTRZ karty — dzięki temu widać,
                        którą przecenę się zmienia, i nie ma jej duplikatu. */}
                    <Collapse open={isEditing}>
                      <div className="mt-5 border-t border-gray-100 pt-5">
                        <SaleForm
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
        title={`Usunąć przecenę „${pendingDelete?.name ?? ""}”?`}
        description="Zamówienia z jej okresu zachowają pełną historię. Tej operacji nie da się cofnąć."
        confirmLabel="Usuń przecenę"
        onConfirm={handleDelete}
        isPending={isDeleting}
      />

      <p className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-relaxed text-blue-700/90">
        Przecena działa automatycznie — klientka nie wpisuje żadnego kodu. Kod
        rabatowy dolicza się na jej wierzch tylko wtedy, gdy ma włączone „Można
        łączyć z przeceną”; w przeciwnym razie system nalicza tę obniżkę, która
        daje niższą cenę.
      </p>
    </div>
  );
};
