"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X, Layers } from "lucide-react";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { cn } from "@/lib/utils/cn";
import {
  createDiscountAction,
  updateDiscountAction,
} from "@/app/actions/discounts";
import { formatPln } from "@/lib/pricing";
import { computeDiscount } from "@/lib/discounts";
import { isoToLocalInput, localInputToIso } from "@/lib/date-input";
import type { SaveDiscountInput } from "@/lib/validators/coupon";
import {
  DateWindowFields,
  FormSection,
  PricePreview,
  SegmentedControl,
  SwitchRow,
  inputClass,
  labelClass,
} from "./_shared";
import type { DiscountRow } from "./types";

interface DiscountFormProps {
  /** null = tworzymy nowy kod. */
  editing: DiscountRow | null;
  /** Aktualna cena sprzedaży z cennika — podstawa podglądu (grosze). */
  basePrice: number;
  onDone: () => void;
  onCancel: () => void;
}

export const DiscountForm = ({
  editing,
  basePrice,
  onDone,
  onCancel,
}: DiscountFormProps) => {
  const [code, setCode] = useState(editing?.code ?? "");
  const [type, setType] = useState<"percent" | "amount">(
    editing?.type ?? "percent",
  );
  const [percent, setPercent] = useState(
    editing?.percentOff != null ? String(editing.percentOff) : "10",
  );
  // Rabat kwotowy pokazujemy adminowi w złotówkach, w bazie trzymamy grosze.
  const [amountZl, setAmountZl] = useState(
    editing?.amountOff != null ? String(editing.amountOff / 100) : "",
  );

  // Limity są opcjonalne — suwak decyduje, czy w ogóle istnieją.
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

  const [stackable, setStackable] = useState(
    editing?.stackableWithSale ?? false,
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
    const input: SaveDiscountInput = {
      code,
      type,
      percentOff: type === "percent" ? parsedPercent : null,
      amountOff: type === "amount" ? parsedAmountGrosze : null,
      usageLimit: limitEnabled && usageLimit !== "" ? Number(usageLimit) : null,
      validFrom: windowEnabled ? localInputToIso(validFrom) : null,
      validUntil: windowEnabled ? localInputToIso(validUntil, true) : null,
      stackableWithSale: stackable,
    };

    startSaving(async () => {
      const res = editing
        ? await updateDiscountAction(editing.id, input)
        : await createDiscountAction(input);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(
        editing ? "Zapisano zmiany." : "Kod utworzony (na razie wyłączony).",
      );
      onDone();
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-[#0c493e]">
          {editing ? `Edytuj kod ${editing.code}` : "Nowy kod rabatowy"}
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
          title="Co to za rabat"
          description="Nazwa, którą klientka wpisuje w koszyku, i wysokość obniżki."
        >
          {/* --- NAZWA + TYP --- */}
          <div className="flex gap-4 max-[560px]:flex-col">
            <div className="flex-1">
              <label htmlFor="df-code" className={labelClass}>
                Nazwa kodu
              </label>
              <input
                id="df-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PREMIERA20"
                maxLength={32}
                autoComplete="off"
                className={cn(inputClass, "uppercase tracking-wide")}
              />
            </div>

            <div className="w-[220px] max-[560px]:w-full">
              <span className={labelClass}>Typ rabatu</span>
              <SegmentedControl
                name="code-type"
                value={type}
                onChange={setType}
                options={[
                  { value: "percent", label: "Procentowy" },
                  { value: "amount", label: "Kwotowy" },
                ]}
              />
            </div>
          </div>

          {/* --- WARTOŚĆ RABATU --- */}
          <div className="w-40 max-[560px]:w-full">
            {type === "percent" ? (
              <>
                <label htmlFor="df-percent" className={labelClass}>
                  Rabat (%)
                </label>
                <input
                  id="df-percent"
                  value={percent}
                  onChange={(e) =>
                    setPercent(e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  inputMode="numeric"
                  placeholder="10"
                  className={inputClass}
                />
              </>
            ) : (
              <>
                <label htmlFor="df-amount" className={labelClass}>
                  Rabat (zł)
                </label>
                <input
                  id="df-amount"
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
            finalAmount={preview ? preview.finalAmount : null}
            baseAmount={basePrice}
            formatPrice={formatPln}
          />
        </FormSection>

        <FormSection
          title="Kiedy i jak działa"
          description="Wszystkie ograniczenia są opcjonalne — wyłączone znaczy „bez limitu”."
        >
          {/* --- LIMIT UŻYĆ --- */}
          <SwitchRow
            checked={limitEnabled}
            onChange={() => setLimitEnabled((value) => !value)}
            title="Ogranicz liczbę użyć"
            description="Kod przestanie działać po wyczerpaniu puli. Licznik rośnie dopiero po opłaconym zamówieniu."
          >
            <div className="w-40 max-[560px]:w-full">
              <label htmlFor="df-limit" className={labelClass}>
                Limit użyć
              </label>
              <input
                id="df-limit"
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

          {/* --- OKNO CZASOWE --- */}
          <SwitchRow
            checked={windowEnabled}
            onChange={() => setWindowEnabled((value) => !value)}
            title="Ogranicz czasowo"
            description="Kod działa tylko w wybranym przedziale dat. Ostatni dzień liczy się w całości — kod wyłącza się o 23:59."
          >
            <DateWindowFields
              idPrefix="df"
              from={validFrom}
              until={validUntil}
              onFrom={setValidFrom}
              onUntil={setValidUntil}
            />
          </SwitchRow>

          {/* --- NAKŁADANIE --- */}
          <SwitchRow
            checked={stackable}
            onChange={() => setStackable((value) => !value)}
            title="Można łączyć z przeceną"
            description={
              stackable
                ? "Kod naliczy się NA WIERZCH aktywnej przeceny lub zniżki mailowej — cena spadnie dwa razy."
                : "Kod nie sumuje się z promocją. System naliczy tę obniżkę, która daje klientce niższą cenę."
            }
            icon={<Layers size={16} />}
            tone="warn"
          />
        </FormSection>

        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <LoadingButton
            type="button"
            onClick={handleSubmit}
            isLoading={isSaving}
            variant="primary"
            className="flex-1 text-xs font-bold uppercase tracking-wider"
          >
            {editing ? "Zapisz zmiany" : "Utwórz kod"}
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
