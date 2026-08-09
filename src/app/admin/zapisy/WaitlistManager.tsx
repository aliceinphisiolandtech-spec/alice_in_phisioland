"use client";

import React, { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { MailPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  EmptyState,
  ListHeader,
  SPRING,
  listItemMotion,
} from "@/components/admin/ui/primitives";
import {
  deleteWaitlistPageAction,
  duplicateWaitlistPageAction,
  toggleWaitlistPageAction,
} from "@/app/actions/waitlist";
import { CampaignCard } from "./CampaignCard";
import type { WaitlistPageRow } from "./types";

/**
 * Lista kampanii.
 *
 * Tworzenie i edycja żyją na osobnych trasach (`/admin/zapisy/nowa` oraz
 * `/admin/zapisy/<id>`), bo kreator renderuje pełną stronę kampanii i
 * potrzebuje całej szerokości. Tutaj zostaje przegląd i operacje, które mają
 * działać jednym kliknięciem bez wchodzenia w edycję: włącznik, kopia,
 * pobranie CSV, usunięcie.
 */
export function WaitlistManager({
  pages,
  siteUrl,
}: {
  pages: WaitlistPageRow[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WaitlistPageRow | null>(
    null,
  );
  const [isDeleting, startDelete] = useTransition();

  async function handleToggle(row: WaitlistPageRow) {
    setBusyId(row.id);
    const result = await toggleWaitlistPageAction(row.id, !row.isActive);
    setBusyId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      row.isActive ? "Zapisy zamknięte." : "Zapisy otwarte — link działa.",
    );
    router.refresh();
  }

  async function handleDuplicate(row: WaitlistPageRow) {
    setBusyId(row.id);
    const result = await duplicateWaitlistPageAction(row.id);
    setBusyId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      `Kopia gotowa pod adresem /zapisy/${result.slug}. Jest wyłączona — włącz ją, gdy treść będzie gotowa.`,
    );
    router.refresh();
  }

  function handleDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;

    startDelete(async () => {
      const result = await deleteWaitlistPageAction(
        target.id,
        target.subscriberCount,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPendingDelete(null);
      toast.success("Kampania usunięta.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <ListHeader
        count={pages.length}
        emptyLabel="Nie masz jeszcze żadnej strony zapisów."
        countLabel={(count) =>
          count === 1 ? "1 strona zapisów" : `${count} stron zapisów`
        }
        action={<NewCampaignButton />}
      />

      {pages.length === 0 ? (
        <EmptyState
          icon={<MailPlus size={22} />}
          title="Brak stron zapisów"
          hint="Załóż pierwszą stronę, żeby zbierać adresy pod nadchodzącą akcję."
        />
      ) : (
        <motion.div layout className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {pages.map((row) => (
              <motion.div key={row.id} {...listItemMotion}>
                <CampaignCard
                  row={row}
                  siteUrl={siteUrl}
                  busy={busyId === row.id}
                  onToggle={() => handleToggle(row)}
                  onDuplicate={() => handleDuplicate(row)}
                  onDelete={() => setPendingDelete(row)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        tone="danger"
        title={`Usunąć „${pendingDelete?.name ?? ""}”?`}
        description={
          pendingDelete && pendingDelete.subscriberCount > 0 ? (
            <>
              Razem ze stroną zniknie{" "}
              <strong>
                {pendingDelete.subscriberCount}{" "}
                {pendingDelete.subscriberCount === 1
                  ? "zebrany adres"
                  : "zebranych adresów"}
              </strong>
              . Kontakty przekazane wcześniej do MailerLite zostaną tam
              nietknięte, ale ślad zgody (treść, data, IP) przepadnie. Pobierz
              najpierw plik CSV, jeśli ma zostać w dokumentacji. Tej operacji
              nie da się cofnąć.
            </>
          ) : (
            "Ta strona nie zebrała jeszcze żadnego adresu. Tej operacji nie da się cofnąć."
          )
        }
        confirmLabel="Usuń kampanię"
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  );
}

/**
 * Odsyła do kreatora. Link, nie przycisk otwierający formularz — to jest
 * przejście na inną stronę, więc ma działać jak każdy link: otwierać się
 * w nowej karcie środkowym przyciskiem i pokazywać adres na pasku stanu.
 */
function NewCampaignButton() {
  return (
    <motion.div whileTap={{ scale: 0.97 }} transition={SPRING}>
      <Link
        href="/admin/zapisy/nowa"
        className="flex shrink-0 items-center gap-2 rounded-xl bg-[#0c493e] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#0a3b32]"
      >
        <Plus size={16} />
        Nowa strona
      </Link>
    </motion.div>
  );
}
