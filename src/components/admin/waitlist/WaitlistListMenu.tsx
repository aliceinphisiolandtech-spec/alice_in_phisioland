"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, TicketPercent, Trash2 } from "lucide-react";
import { ActionMenu, ActionMenuItem } from "@/components/admin/ui/ActionMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { clearWaitlistSubscribersAction } from "@/app/actions/waitlist";

/**
 * Co można zrobić z zebraną listą adresów.
 *
 * Wcześniej stał tu sam link „Pobierz CSV". Doszły dwie kolejne drogi —
 * zrobienie z listy zniżki i wyczyszczenie jej — a trzy równorzędne przyciski
 * przy nagłówku zaczęłyby konkurować z tym, po co ta sekcja w ogóle jest
 * (czyli z samą listą osób). Stąd trzy kropki: działania są na wyciągnięcie
 * ręki, ale nie krzyczą.
 *
 * Wspólne dla obu widoków panelu (kreator i sam wyłącznik), żeby lista działań
 * nie rozjechała się między nimi.
 */
export function WaitlistListMenu({
  pageId,
  subscriberCount,
  triggerClassName,
  onCleared,
}: {
  pageId: string;
  subscriberCount: number;
  triggerClassName?: string;
  /** Wywoływane po wyczyszczeniu listy — pozwala zresetować stronicowanie. */
  onCleared?: () => void;
}) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, startClearing] = useTransition();

  /**
   * Przejście do rabatów z zaznaczoną kampanią. Same adresy zostają na
   * serwerze — przenosimy ID kampanii, a listę przepisuje akcja tworząca
   * zniżkę. Wysyłanie kilkuset adresów przez pasek URL byłoby i kruche,
   * i niepotrzebnym wyciekiem danych osobowych do historii przeglądarki.
   */
  function createDiscount() {
    startNavigation(() => {
      router.push(`/admin/rabaty?tab=emails&zapisy=${pageId}`);
    });
  }

  function clearList() {
    startClearing(async () => {
      // Liczbę widoczną w panelu wysyłamy razem z żądaniem: jeśli w międzyczasie
      // ktoś się zapisał, serwer odrzuci operację zamiast skasować jego zapis
      // przy okazji.
      const result = await clearWaitlistSubscribersAction(
        pageId,
        subscriberCount,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setConfirmClear(false);
      toast.success(`Lista wyczyszczona — usuniętych adresów: ${result.removed}.`);
      onCleared?.();
      router.refresh();
    });
  }

  return (
    <>
      <ActionMenu
        label="Więcej działań dla listy adresów"
        busy={isNavigating}
        triggerClassName={triggerClassName}
      >
        <ActionMenuItem
          icon={<Download size={15} />}
          label="Pobierz CSV"
          description="Adresy razem ze śladem zgody: treść, data i IP. To jest dokument na wypadek żądania z RODO."
          href={`/api/admin/waitlist/${pageId}/export`}
        />

        <ActionMenuItem
          icon={<TicketPercent size={15} />}
          label="Utwórz zniżkę dla tej listy"
          description={`Przejdziesz do rabatów, a wszystkie zebrane adresy (${subscriberCount}) trafią na listę nowej zniżki.`}
          onSelect={createDiscount}
          isLoading={isNavigating}
          // Menu zostaje otwarte, bo to jedyne miejsce, w którym widać spinner —
          // przejście na stronę rabatów potrafi chwilę potrwać.
          keepOpen
        />

        <ActionMenuItem
          icon={<Trash2 size={15} />}
          label="Usuń wszystkie adresy"
          description="Kampania i jej link zostają — znika tylko lista zapisanych osób."
          tone="danger"
          onSelect={() => setConfirmClear(true)}
        />
      </ActionMenu>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={(open) => !open && setConfirmClear(false)}
        tone="danger"
        title="Wyczyścić całą listę zapisanych?"
        description={
          <>
            Usuniesz{" "}
            <strong>
              {subscriberCount}{" "}
              {subscriberCount === 1 ? "zebrany adres" : "zebranych adresów"}
            </strong>{" "}
            razem ze śladem zgody (treść, data, IP). Kontakty przekazane
            wcześniej do MailerLite zostaną tam nietknięte. Pobierz najpierw
            plik CSV, jeśli ma zostać w dokumentacji — tej operacji nie da się
            cofnąć.
          </>
        }
        confirmLabel="Usuń wszystkie adresy"
        onConfirm={clearList}
        isPending={isClearing}
      />
    </>
  );
}
