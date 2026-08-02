"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  FlaskConical,
  Pencil,
  Tag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPln } from "@/lib/pricing";
import {
  toggleSandboxAction,
  updateBasePriceAction,
} from "@/app/actions/pricing-settings";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Switch } from "./_shared";
import type { PriceResult } from "@/lib/pricing-engine";

interface LivePriceHeaderProps {
  /** Wycena widziana przez ZWYKŁĄ klientkę (bez piaskownicy, bez kodu). */
  pricing: PriceResult;
  /** Ile zniżek mailowych jest czynnych — nie da się ich pokazać w kwocie. */
  activeEmailDiscounts: number;
  /** Cena z cennika — ta, którą płacą klientki (grosze). */
  basePrice: number;
  /** Cena ustawiona w piaskownicy; null = piaskownica liczy od cennika. */
  sandboxBasePrice: number | null;
  /** Wycena, którą admin zobaczy w koszyku w trybie testowym. */
  sandboxPricing: PriceResult | null;
  sandboxEnabled: boolean;
  /** Ile rabatów czeka w piaskownicy na publikację. */
  sandboxItemCount: number;
}

/** grosze -> "109" / "109,5" do pola tekstowego. */
function groszeToInput(grosze: number): string {
  return String(grosze / 100).replace(".", ",");
}

function inputToGrosze(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  return Math.round(parsed * 100);
}

/**
 * Cena podstawowa z edycją w miejscu. To jedyna cena zmieniana z panelu —
 * przekreślenia i ceny promocyjne są domeną zakładki Przeceny.
 *
 * Przy włączonej piaskownicy edytujemy CENĘ TESTOWĄ: zapis nie rusza cennika
 * klientek, a kwota wchodzi na produkcję dopiero przy wyjściu z trybu.
 */
const BasePriceEditor = ({
  basePrice,
  sandboxEnabled,
}: {
  basePrice: number;
  sandboxEnabled: boolean;
}) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(groszeToInput(basePrice));
  const [isSaving, startSaving] = useTransition();

  const cancel = () => {
    setValue(groszeToInput(basePrice));
    setIsEditing(false);
  };

  const save = () => {
    const grosze = inputToGrosze(value);

    if (grosze === null) {
      toast.error("Podaj poprawną cenę.");
      return;
    }
    if (grosze === basePrice) {
      setIsEditing(false);
      return;
    }

    startSaving(async () => {
      const res = await updateBasePriceAction(grosze);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(
        res.sandboxOnly
          ? "Cena testowa zapisana. Klientki płacą dalej tyle co wcześniej."
          : "Cena podstawowa zapisana.",
      );
      setIsEditing(false);
      router.refresh();
    });
  };

  const label = sandboxEnabled
    ? "Cena testowa (piaskownica)"
    : "Cena podstawowa";

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={cn(
          "group flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-left transition-colors",
          sandboxEnabled
            ? "hover:border-amber-200 hover:bg-amber-50"
            : "hover:border-gray-200 hover:bg-gray-50",
        )}
      >
        <span>
          <span
            className={cn(
              "block text-[10px] font-bold uppercase tracking-widest",
              sandboxEnabled ? "text-amber-600" : "text-gray-400",
            )}
          >
            {label}
          </span>
          <span className="text-base font-bold text-gray-900">
            {formatPln(basePrice)}
          </span>
        </span>
        <Pencil
          size={14}
          className="text-gray-300 transition-colors group-hover:text-[#0c493e]"
        />
      </button>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div>
        <label
          htmlFor="base-price"
          className={cn(
            "block text-[10px] font-bold uppercase tracking-widest",
            sandboxEnabled ? "text-amber-600" : "text-gray-400",
          )}
        >
          {label} (zł)
        </label>
        <input
          id="base-price"
          autoFocus
          value={value}
          onChange={(e) =>
            setValue(e.target.value.replace(/[^\d.,]/g, "").slice(0, 8))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          inputMode="decimal"
          className="mt-1 w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none transition-all focus:border-[#0c493e] focus:ring-1 focus:ring-[#0c493e]"
        />
      </div>

      <LoadingButton
        type="button"
        onClick={save}
        isLoading={isSaving}
        variant="primary"
        className="rounded-lg text-xs font-bold uppercase tracking-wider"
      >
        Zapisz
      </LoadingButton>

      <button
        type="button"
        onClick={cancel}
        disabled={isSaving}
        aria-label="Anuluj edycję ceny"
        className="mb-0.5 cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
      >
        <X size={16} />
      </button>
    </div>
  );
};

/** Ścieżka dojścia do ceny: kwota bazowa → kolejne obniżki. */
const Breakdown = ({ pricing }: { pricing: PriceResult }) => (
  <div className="mt-2.5 flex flex-wrap items-center gap-2">
    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
      {formatPln(pricing.baseAmount)}
    </span>

    {pricing.lines.map((line) => (
      <span
        key={`${line.kind}-${line.name}`}
        className="flex items-center gap-1.5"
      >
        <ArrowRight size={12} className="text-gray-300" />
        <span className="flex items-center gap-1.5 rounded-lg bg-[#c5e96b]/25 px-2.5 py-1 text-xs font-medium text-[#0c493e]">
          {line.kind === "sale" ? <Tag size={11} /> : <Users size={11} />}
          <span className="max-w-[160px] truncate">{line.name}</span>
          <span className="font-bold">{line.label}</span>
        </span>
      </span>
    ))}
  </div>
);

/**
 * Odpowiedź na pytanie, które admin zadaje najczęściej: ile klientka płaci
 * w tej chwili. Liczone tym samym silnikiem co koszyk i celowo BEZ trybu
 * piaskownicy — to ma być widok z zewnątrz, nie podgląd testowy.
 *
 * Ten sam kafel trzyma przełącznik piaskownicy: stan „co widzi klientka"
 * i „czy jestem w trybie testowym" to jedno pytanie, więc odpowiedź stoi
 * w jednym miejscu.
 */
export const LivePriceHeader = ({
  pricing,
  activeEmailDiscounts,
  basePrice,
  sandboxBasePrice,
  sandboxPricing,
  sandboxEnabled,
  sandboxItemCount,
}: LivePriceHeaderProps) => {
  const router = useRouter();
  const [isToggling, startToggling] = useTransition();
  // Otwarte okno potwierdzenia publikacji (wyjście z piaskownicy ze zmianami).
  const [confirmingPublish, setConfirmingPublish] = useState(false);

  const hasDiscount = pricing.totalDiscount > 0;

  // W piaskownicy edytujemy cenę testową; gdy jeszcze jej nie ustawiono,
  // startujemy od aktualnego cennika.
  const editablePrice =
    sandboxEnabled && sandboxBasePrice !== null ? sandboxBasePrice : basePrice;

  // Cena testowa równa cennikowi nie jest zmianą — bez tego okno potwierdzenia
  // straszy komunikatem „cena zmieni się z 139,00 zł na 139,00 zł".
  const priceToPublish =
    sandboxBasePrice !== null && sandboxBasePrice !== basePrice
      ? sandboxBasePrice
      : null;

  // Czy wyjście z trybu cokolwiek opublikuje.
  const hasPendingChanges = sandboxItemCount > 0 || priceToPublish !== null;

  const handleSandboxToggle = () => {
    // Wyjście z piaskownicy publikuje wszystko, co w niej powstało — to moment,
    // w którym zmiany stają się widoczne dla klientek. Wymaga potwierdzenia.
    if (sandboxEnabled && hasPendingChanges) {
      setConfirmingPublish(true);
      return;
    }

    runToggle(!sandboxEnabled);
  };

  const runToggle = (next: boolean, publish = true) => {
    startToggling(async () => {
      const res = await toggleSandboxAction(next, { publish });
      setConfirmingPublish(false);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (res.enabled) {
        toast.success(
          "Piaskownica włączona. Zmiany, nowe rabaty i cena widzisz tylko Ty.",
        );
      } else if (!publish) {
        // Nic nie poszło do klientek — komunikat musi to powiedzieć wprost,
        // inaczej „wyłączona" brzmi jak „opublikowana".
        toast.success(
          hasPendingChanges
            ? "Tryb testowy wyłączony. Zmiany czekają dalej w piaskownicy — klientki ich nie widzą."
            : "Piaskownica wyłączona.",
        );
      } else {
        const parts: string[] = [];
        if (res.published) parts.push(`${res.published} rabat(ów)`);
        if (res.publishedPriceGrosze != null) {
          parts.push(`cenę ${formatPln(res.publishedPriceGrosze)}`);
        }

        toast.success(
          parts.length
            ? `Piaskownica wyłączona. Opublikowano: ${parts.join(" i ")}.`
            : "Piaskownica wyłączona.",
        );
      }

      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        "mb-6 overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors duration-300",
        sandboxEnabled ? "border-amber-300" : "border-gray-200",
      )}
    >
      {/* --- CO PŁACI KLIENTKA --- */}
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 p-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Klientka płaci teraz
          </p>
          <div className="mt-1">
            <span className="text-3xl font-bold text-[#0c493e]">
              {formatPln(pricing.finalAmount)}
            </span>
          </div>

          {hasDiscount && <Breakdown pricing={pricing} />}

          {!hasDiscount && (
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Wallet size={14} className="text-gray-400" />
              Brak czynnych promocji — obowiązuje cena podstawowa.
            </p>
          )}
        </div>

        <BasePriceEditor
          basePrice={editablePrice}
          sandboxEnabled={sandboxEnabled}
        />
      </div>

      {/* Zniżki mailowe zależą od konkretnego adresu, więc nie da się ich
          uczciwie wliczyć do jednej kwoty „dla wszystkich". */}
      {activeEmailDiscounts > 0 && (
        <p className="border-t border-gray-100 bg-gray-50/60 px-5 py-2.5 text-xs text-gray-500">
          Dodatkowo działa {activeEmailDiscounts} zniżka(-i) dla wybranych osób
          — nalicza się tylko adresom z listy, więc nie wchodzi do kwoty
          powyżej.
        </p>
      )}

      {/* --- PIASKOWNICA --- */}
      <div
        className={cn(
          "flex items-start justify-between gap-4 border-t px-5 py-4 transition-colors duration-300",
          sandboxEnabled
            ? "border-amber-200 bg-amber-50"
            : "border-gray-100 bg-gray-50/40",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "mt-0.5 shrink-0 rounded-lg p-2 transition-colors duration-300",
              sandboxEnabled
                ? "bg-amber-400/20 text-amber-700"
                : "bg-gray-200/70 text-gray-400",
            )}
          >
            <FlaskConical size={16} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">
              {sandboxEnabled ? "Piaskownica włączona" : "Piaskownica"}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
              {sandboxEnabled ? (
                <>
                  Wszystko, co teraz utworzysz lub zmienisz, widzisz{" "}
                  <strong>tylko Ty</strong> — kwota powyżej to nadal widok
                  klientki. Twoje zakupy testowe nie liczą się do statystyk i
                  nie wystawiają faktur.
                  {sandboxItemCount > 0 && (
                    <>
                      {" "}
                      Czeka na publikację: <strong>{sandboxItemCount}</strong>.
                    </>
                  )}
                </>
              ) : sandboxItemCount > 0 ? (
                // Tryb wyłączony bez publikacji: wersje robocze istnieją, ale
                // nie widać ich w koszyku. Bez tej informacji zniknęłyby
                // z pola widzenia razem z wyłączonym trybem.
                <>
                  Wyłączona. W środku czeka{" "}
                  <strong>{sandboxItemCount}</strong> niepublikowana zmiana(-y)
                  — klientki jej nie widzą. Włącz tryb, żeby do niej wrócić albo
                  ją opublikować.
                </>
              ) : (
                <>
                  Włącz, żeby testować rabaty na sobie. Trwające promocje
                  działają dalej — izolowane jest tylko to, co zmienisz w trybie
                  testowym.
                </>
              )}
            </p>

            {/* Ile admin realnie zapłaci w koszyku w tym trybie — z ceną
                testową i rabatami oznaczonymi jako piaskownicowe. Bez tego
                cena testowa wygląda na liczbę, która na nic nie wpływa. */}
            {sandboxEnabled && sandboxPricing && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-white/70 px-3 py-2.5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                    Ty widzisz w koszyku
                  </span>
                  <span className="text-lg font-bold text-[#0c493e]">
                    {formatPln(sandboxPricing.finalAmount)}
                  </span>
                </div>

                {sandboxPricing.totalDiscount > 0 && (
                  <Breakdown pricing={sandboxPricing} />
                )}
              </div>
            )}
          </div>
        </div>

        <Switch
          checked={sandboxEnabled}
          onChange={handleSandboxToggle}
          disabled={isToggling}
          label="Włącz lub wyłącz piaskownicę"
        />
      </div>

      <ConfirmDialog
        open={confirmingPublish}
        onOpenChange={setConfirmingPublish}
        title="Opublikować zmiany z piaskownicy?"
        description={
          <>
            Publikacja udostępni klientkom:
            {sandboxItemCount > 0 && (
              <>
                {" "}
                <strong>{sandboxItemCount}</strong> rabat(ów) — te, które masz
                włączone, zaczną działać od razu.
              </>
            )}
            {priceToPublish !== null && (
              <>
                {" "}
                Cena podstawowa zmieni się z{" "}
                <strong>{formatPln(basePrice)}</strong> na{" "}
                <strong>{formatPln(priceToPublish)}</strong>.
              </>
            )}
            <span className="mt-2 block">
              Możesz też wyłączyć sam tryb testowy — zmiany zostaną wtedy
              schowane w piaskownicy i wrócą, gdy włączysz ją ponownie.
            </span>
          </>
        }
        confirmLabel="Opublikuj i wyłącz"
        onConfirm={() => runToggle(false)}
        altLabel="Wyłącz bez publikacji"
        onAlt={() => runToggle(false, false)}
        isPending={isToggling}
      />
    </div>
  );
};
