"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { createSaleAction, updateSaleAction } from "@/app/actions/sales";
import { MIN_CHARGE_GROSZE, formatPln } from "@/lib/pricing";
import { computeDiscount } from "@/lib/discounts";
import { isoToLocalInput, localInputToIso } from "@/lib/date-input";
import type { SaveSaleInput } from "@/lib/validators/discounts";
import {
  DateWindowFields,
  FormSection,
  PricePreview,
  SegmentedControl,
  SwitchRow,
  inputClass,
  labelClass,
} from "./_shared";
import type { SaleRow } from "./types";

interface SaleFormProps {
  editing: SaleRow | null;
  /** Aktualna cena sprzedaży z cennika — podstawa podglądu (grosze). */
  basePrice: number;
  onDone: () => void;
  onCancel: () => void;
}

export const SaleForm = ({
  editing,
  basePrice,
  onDone,
  onCancel,
}: SaleFormProps) => {
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<"percent" | "fixed_price">(
    editing?.type ?? "percent",
  );
  const [percent, setPercent] = useState(
    editing?.percentOff != null ? String(editing.percentOff) : "20",
  );
  const [priceZl, setPriceZl] = useState(
    editing?.fixedPrice != null ? String(editing.fixedPrice / 100) : "",
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
  const parsedPriceGrosze = Math.round(Number(priceZl.replace(",", ".")) * 100);

  const previewValid =
    type === "percent"
      ? Number.isInteger(parsedPercent) &&
        parsedPercent >= 1 &&
        parsedPercent <= 95
      : Number.isFinite(parsedPriceGrosze) &&
        parsedPriceGrosze >= MIN_CHARGE_GROSZE;

  const previewFinal = previewValid
    ? type === "percent"
      ? computeDiscount(basePrice, {
          type: "percent",
          percentOff: parsedPercent,
          amountOff: null,
        }).finalAmount
      : Math.min(parsedPriceGrosze, basePrice)
    : null;

  const handleSubmit = () => {
    const input: SaveSaleInput = {
      name,
      type,
      percentOff: type === "percent" ? parsedPercent : null,
      fixedPrice: type === "fixed_price" ? parsedPriceGrosze : null,
      usageLimit: limitEnabled && usageLimit !== "" ? Number(usageLimit) : null,
      validFrom: windowEnabled ? localInputToIso(validFrom) : null,
      validUntil: windowEnabled ? localInputToIso(validUntil, true) : null,
    };

    startSaving(async () => {
      const res = editing
        ? await updateSaleAction(editing.id, input)
        : await createSaleAction(input);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(
        editing
          ? "Zapisano zmiany."
          : "Przecena utworzona (na razie wyłączona).",
      );
      onDone();
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-[#0c493e]">
          {editing ? `Edytuj przecenę „${editing.name}”` : "Nowa przecena"}
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

      <div className="flex flex-col gap-7">
        <FormSection
          title="Co to za promocja"
          description="Nazwa widoczna dla klientki w podsumowaniu i wysokość obniżki."
        >
          <div className="flex gap-4 max-[560px]:flex-col">
            <div className="flex-1">
              <label htmlFor="sf-name" className={labelClass}>
                Nazwa promocji
              </label>
              <input
                id="sf-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Promocja premierowa"
                maxLength={60}
                autoComplete="off"
                className={inputClass}
              />
            </div>

            <div className="w-[240px] max-[560px]:w-full">
              <span className={labelClass}>Typ przeceny</span>
              <SegmentedControl
                name="sale-type"
                value={type}
                onChange={setType}
                options={[
                  { value: "percent", label: "Procent" },
                  { value: "fixed_price", label: "Cena docelowa" },
                ]}
              />
            </div>
          </div>

          <div className="w-40 max-[560px]:w-full">
            {type === "percent" ? (
              <>
                <label htmlFor="sf-percent" className={labelClass}>
                  Przecena (%)
                </label>
                <input
                  id="sf-percent"
                  value={percent}
                  onChange={(e) =>
                    setPercent(e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  inputMode="numeric"
                  placeholder="20"
                  className={inputClass}
                />
              </>
            ) : (
              <>
                <label htmlFor="sf-price" className={labelClass}>
                  Cena promocyjna (zł)
                </label>
                <input
                  id="sf-price"
                  value={priceZl}
                  onChange={(e) =>
                    setPriceZl(
                      e.target.value.replace(/[^\d.,]/g, "").slice(0, 7),
                    )
                  }
                  inputMode="decimal"
                  placeholder="89"
                  className={inputClass}
                />
              </>
            )}
          </div>

          <PricePreview
            finalAmount={previewFinal}
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
            description="Przecena wyłączy się po wyczerpaniu puli. Licznik rośnie dopiero po opłaconym zamówieniu."
          >
            <div className="w-40 max-[560px]:w-full">
              <label htmlFor="sf-limit" className={labelClass}>
                Limit użyć
              </label>
              <input
                id="sf-limit"
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
            description="Przecena działa tylko w wybranym przedziale dat i kończy się o 23:59 ostatniego dnia. Bez tego trwa, dopóki jej nie wyłączysz."
          >
            <DateWindowFields
              idPrefix="sf"
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
            {editing ? "Zapisz zmiany" : "Utwórz przecenę"}
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
