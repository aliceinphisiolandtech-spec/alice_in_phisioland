"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MailPlus, X } from "lucide-react";
import { LoadingButton } from "@/components/ui/LoadingButton";
import {
  createEmailDiscountAction,
  updateEmailDiscountAction,
} from "@/app/actions/email-discounts";
import { formatPln } from "@/lib/pricing";
import { computeDiscount } from "@/lib/discounts";
import { isoToLocalInput, localInputToIso } from "@/lib/date-input";
import type { SaveEmailDiscountInput } from "@/lib/validators/discounts";
import {
  DateWindowFields,
  FormSection,
  PricePreview,
  SegmentedControl,
  SwitchRow,
  inputClass,
  labelClass,
} from "./_shared";
import type { EmailDiscountRow, WaitlistSourceRow } from "./types";

interface EmailDiscountFormProps {
  editing: EmailDiscountRow | null;
  /** Aktualna cena sprzedaży z cennika — podstawa podglądu (grosze). */
  basePrice: number;
  /**
   * Kampania zapisów, której zebrane adresy mają trafić na listę tej zniżki.
   * Dotyczy wyłącznie NOWEJ zniżki — przy edycji lista już istnieje i zarządza
   * się nią w karcie.
   */
  waitlistSource?: WaitlistSourceRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** Nazwa robocza podpowiedziana z kampanii — mieści się w limicie 60 znaków. */
function suggestName(source: WaitlistSourceRow): string {
  return `Lista: ${source.name}`.slice(0, 60);
}

export const EmailDiscountForm = ({
  editing,
  basePrice,
  waitlistSource = null,
  onDone,
  onCancel,
}: EmailDiscountFormProps) => {
  // Adresy dopisujemy tylko przy tworzeniu — patrz opis propa.
  const source = editing ? null : waitlistSource;

  const [name, setName] = useState(
    editing?.name ?? (source ? suggestName(source) : ""),
  );
  const [type, setType] = useState<"percent" | "amount">(
    editing?.type ?? "percent",
  );
  const [percent, setPercent] = useState(
    editing?.percentOff != null ? String(editing.percentOff) : "15",
  );
  const [amountZl, setAmountZl] = useState(
    editing?.amountOff != null ? String(editing.amountOff / 100) : "",
  );

  const [limitEnabled, setLimitEnabled] = useState(editing?.usageLimit != null);
  const [usageLimit, setUsageLimit] = useState(
    editing?.usageLimit != null ? String(editing.usageLimit) : "20",
  );

  const [windowEnabled, setWindowEnabled] = useState(
    Boolean(editing?.validFrom || editing?.validUntil),
  );
  const [validFrom, setValidFrom] = useState(
    isoToLocalInput(editing?.validFrom ?? null),
  );
  const [validUntil, setValidUntil] = useState(
    isoToLocalInput(editing?.validUntil ?? null),
  );

  const [isSaving, startSaving] = useTransition();

  const parsedPercent = Number(percent);
  const parsedAmountGrosze = Math.round(
    Number(amountZl.replace(",", ".")) * 100,
  );

  const previewValid =
    type === "percent"
      ? Number.isInteger(parsedPercent) &&
        parsedPercent >= 1 &&
        parsedPercent <= 95
      : Number.isFinite(parsedAmountGrosze) && parsedAmountGrosze >= 100;

  const preview = previewValid
    ? computeDiscount(basePrice, {
        type,
        percentOff: type === "percent" ? parsedPercent : null,
        amountOff: type === "amount" ? parsedAmountGrosze : null,
      })
    : null;

  const handleSubmit = () => {
    const input: SaveEmailDiscountInput = {
      name,
      type,
      percentOff: type === "percent" ? parsedPercent : null,
      amountOff: type === "amount" ? parsedAmountGrosze : null,
      usageLimit: limitEnabled && usageLimit !== "" ? Number(usageLimit) : null,
      validFrom: windowEnabled ? localInputToIso(validFrom) : null,
      validUntil: windowEnabled ? localInputToIso(validUntil, true) : null,
    };

    startSaving(async () => {
      const res = editing
        ? await updateEmailDiscountAction(editing.id, input)
        : await createEmailDiscountAction(input, source?.id ?? null);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (editing) {
        toast.success("Zapisano zmiany.");
      } else if (source) {
        // Liczba z serwera, nie z `source.subscriberCount`: między wejściem
        // w formularz a zapisem ktoś mógł dojść do listy, a adres już obecny
        // na innej liście tej samej zniżki nie zostanie dopisany drugi raz.
        const added =
          "addedFromWaitlist" in res ? (res.addedFromWaitlist ?? 0) : 0;

        toast.success(
          `Zniżka utworzona, adresów z listy: ${added}. Sprawdź listę i włącz zniżkę.`,
        );
      } else {
        toast.success("Zniżka utworzona. Dodaj adresy i włącz ją.");
      }

      onDone();
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-[#0c493e]">
          {editing
            ? `Edytuj zniżkę „${editing.name}”`
            : source
              ? "Nowa zniżka dla zebranej listy"
              : "Nowa zniżka dla puli osób"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Zamknij formularz"
          className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={18} />
        </button>
      </div>

      {/* Skąd wzięła się ta zniżka i co się stanie po kliknięciu „Utwórz".
          Adresów nie da się tu obejrzeć ani odznaczyć — dlatego zamiast
          pustej obietnicy podajemy konkretną liczbę i nazwę kampanii. */}
      {source && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#c5e96b]/60 bg-[#c5e96b]/15 p-3.5">
          <MailPlus size={16} className="mt-0.5 shrink-0 text-[#0c493e]" />
          <p className="text-xs leading-relaxed text-[#0c493e]">
            Adresy z kampanii <strong>„{source.name}”</strong> —{" "}
            <strong>{source.subscriberCount}</strong>{" "}
            {source.subscriberCount === 1 ? "adres" : "adresów"} — trafią na
            listę tej zniżki od razu po jej utworzeniu. Zniżka powstanie
            wyłączona, więc zdążysz sprawdzić listę, zanim zacznie działać.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-7">
        <FormSection
          title="Co to za zniżka"
          description={
            source
              ? "Nazwa widoczna dla klientki w podsumowaniu i wysokość obniżki. Listę adresów dopiszemy sami."
              : "Nazwa widoczna dla klientki w podsumowaniu i wysokość obniżki. Adresy dodasz po zapisaniu."
          }
        >
          <div className="flex gap-4 max-[560px]:flex-col">
            <div className="flex-1">
              <label htmlFor="ef-name" className={labelClass}>
                Nazwa zniżki
              </label>
              <input
                id="ef-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lista VIP"
                maxLength={60}
                autoComplete="off"
                className={inputClass}
              />
            </div>

            <div className="w-[220px] max-[560px]:w-full">
              <span className={labelClass}>Typ zniżki</span>
              <SegmentedControl
                name="email-type"
                value={type}
                onChange={setType}
                options={[
                  { value: "percent", label: "Procentowa" },
                  { value: "amount", label: "Kwotowa" },
                ]}
              />
            </div>
          </div>

          <div className="w-40 max-[560px]:w-full">
            {type === "percent" ? (
              <>
                <label htmlFor="ef-percent" className={labelClass}>
                  Zniżka (%)
                </label>
                <input
                  id="ef-percent"
                  value={percent}
                  onChange={(e) =>
                    setPercent(e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  inputMode="numeric"
                  placeholder="15"
                  className={inputClass}
                />
              </>
            ) : (
              <>
                <label htmlFor="ef-amount" className={labelClass}>
                  Zniżka (zł)
                </label>
                <input
                  id="ef-amount"
                  value={amountZl}
                  onChange={(e) =>
                    setAmountZl(
                      e.target.value.replace(/[^\d.,]/g, "").slice(0, 7),
                    )
                  }
                  inputMode="decimal"
                  placeholder="20"
                  className={inputClass}
                />
              </>
            )}
          </div>

          <PricePreview
            label="Osoba z listy zapłaci"
            finalAmount={preview ? preview.finalAmount : null}
            baseAmount={basePrice}
            formatPrice={formatPln}
          />
        </FormSection>

        <FormSection
          title="Kiedy i jak długo działa"
          description="Oba ograniczenia są opcjonalne — wyłączone znaczy „bez limitu”."
        >
          <SwitchRow
            checked={limitEnabled}
            onChange={() => setLimitEnabled((value) => !value)}
            title="Ogranicz liczbę użyć"
            description="Liczy się liczba ZAKUPÓW, nie adresów: lista 50 osób z limitem 10 oznacza, że zniżkę wykorzysta pierwsze 10 kupujących."
          >
            <div className="w-40 max-[560px]:w-full">
              <label htmlFor="ef-limit" className={labelClass}>
                Limit użyć
              </label>
              <input
                id="ef-limit"
                value={usageLimit}
                onChange={(e) =>
                  setUsageLimit(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                placeholder="20"
                className={inputClass}
              />
            </div>
          </SwitchRow>

          <SwitchRow
            checked={windowEnabled}
            onChange={() => setWindowEnabled((value) => !value)}
            title="Ogranicz czasowo"
            description="Zniżka działa tylko w wybranym przedziale dat i kończy się o 23:59 ostatniego dnia. Bez tego trwa, dopóki jej nie wyłączysz."
          >
            <DateWindowFields
              idPrefix="ef"
              from={validFrom}
              until={validUntil}
              onFrom={setValidFrom}
              onUntil={setValidUntil}
            />
          </SwitchRow>
        </FormSection>

        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <LoadingButton
            type="button"
            onClick={handleSubmit}
            isLoading={isSaving}
            variant="primary"
            className="flex-1 text-xs font-bold uppercase tracking-wider"
          >
            {editing ? "Zapisz zmiany" : "Utwórz zniżkę"}
          </LoadingButton>

          <LoadingButton
            type="button"
            onClick={onCancel}
            variant="secondary"
            className="text-xs font-bold uppercase tracking-wider"
          >
            Anuluj
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};
