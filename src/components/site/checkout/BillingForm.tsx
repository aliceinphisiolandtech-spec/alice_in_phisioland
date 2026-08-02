"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Session } from "next-auth";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { cn } from "@/lib/utils/cn";
import { User, Building2 } from "lucide-react";
import { BillingFormData, BillingSchema } from "@/lib/validators/orders";

interface BillingFormProps {
  session: Session;
  onSubmit: (data: BillingFormData) => void;
  isLoading: boolean;
}

// Sprawdzane w czasie builda — na produkcji cały blok wypada z bundle'a.
const IS_DEV = process.env.NODE_ENV !== "production";

const pick = <T,>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const IMIONA = ["Anna", "Katarzyna", "Magdalena", "Piotr", "Tomasz", "Zofia"];
const NAZWISKA = [
  "Kowalska",
  "Nowak",
  "Wiśniewska",
  "Lewandowski",
  "Zielińska",
  "Kaczmarek",
];
const FIRMY = [
  "Gabinet Fizjoterapii",
  "RehaPunkt",
  "Fizjo Klinika",
  "Centrum Ruchu",
];
const ULICE = ["Kwiatowa", "Polna", "Leśna", "Słoneczna", "Ogrodowa", "Lipowa"];
const MIASTA = ["Warszawa", "Kraków", "Gdańsk", "Wrocław", "Poznań", "Łódź"];

/**
 * NIP z poprawną sumą kontrolną. Sam formularz sprawdza tylko 10 cyfr, ale
 * gdyby ktoś włączył FAKTUROWNIA_FORCE, losowy ciąg zostałby odrzucony przez
 * API — a debugowanie takiego błędu to strata czasu.
 */
function randomNip(): string {
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const digits = Array.from({ length: 9 }, () =>
      Math.floor(Math.random() * 10),
    );
    const checksum =
      digits.reduce((sum, digit, i) => sum + digit * weights[i], 0) % 11;

    if (checksum !== 10) return [...digits, checksum].join("");
  }

  // Znany poprawny NIP jako awaryjne wyjście — pętla praktycznie nigdy tu nie dojdzie.
  return "1234563218";
}

// Helper dla Inputa
const StyledInput = ({
  label,
  error,
  register,
  name,
  placeholder,
  maxLength,
  onChangeCustom, // Nowy prop do customowej obsługi zmian
}: {
  label: string;
  error?: string;
  register: any;
  name: string;
  placeholder?: string;
  maxLength?: number;
  onChangeCustom?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const { onChange, ...rest } = register(name); // Wyciągamy oryginalny onChange z RHF

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>
      <input
        {...rest}
        onChange={(e) => {
          // Jeśli mamy customowy handler (np. formatowanie), użyj go
          if (onChangeCustom) {
            onChangeCustom(e);
          }
          // I zawsze wywołaj oryginalny onChange z RHF, żeby formularz wiedział o zmianie
          onChange(e);
        }}
        maxLength={maxLength}
        placeholder={placeholder}
        className={cn(
          "flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm transition-all outline-none",
          "placeholder:text-gray-400 focus:border-[#0c493e] focus:ring-1 focus:ring-[#0c493e]",
          error && "border-red-500 focus:ring-red-500",
        )}
      />
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
  );
};

export const BillingForm = ({
  session,
  onSubmit,
  isLoading,
}: BillingFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue, // Potrzebne do ręcznego ustawiania sformatowanej wartości
    formState: { errors },
  } = useForm<BillingFormData>({
    resolver: zodResolver(BillingSchema),
    defaultValues: {
      billingType: "personal",
      billingName: session.user?.name || "",
      billingCountry: "PL",
    },
  });

  const billingType = watch("billingType");

  // --- FORMATOWANIE NIP (Tylko cyfry, max 10) ---
  const handleNipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    e.target.value = value; // Aktualizuj widok
    setValue("billingNip", value); // Aktualizuj stan formularza
  };

  // --- DEV: wypełnienie losowymi danymi ---
  // Osobne warianty, bo to typ konta decyduje, czy webhook w ogóle wejdzie
  // w ścieżkę fakturową (NIP jest jej warunkiem).
  const fillRandom = (type: "personal" | "company") => {
    const options = { shouldValidate: true } as const;

    setValue("billingType", type, options);
    setValue(
      "billingName",
      type === "company"
        ? `${pick(FIRMY)} ${pick(NAZWISKA)}`
        : `${pick(IMIONA)} ${pick(NAZWISKA)}`,
      options,
    );
    setValue(
      "billingAddress",
      `ul. ${pick(ULICE)} ${1 + Math.floor(Math.random() * 99)}/${1 + Math.floor(Math.random() * 20)}`,
      options,
    );
    setValue("billingCity", pick(MIASTA), options);
    setValue(
      "billingPostalCode",
      `${String(Math.floor(Math.random() * 100)).padStart(2, "0")}-${String(
        Math.floor(Math.random() * 1000),
      ).padStart(3, "0")}`,
      options,
    );
    setValue("billingNip", type === "company" ? randomNip() : "", options);
    setValue("billingCountry", "PL", options);
  };

  // --- FORMATOWANIE KODU POCZTOWEGO (XX-XXX) ---
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Usuń nie-cyfry

    if (value.length > 2) {
      value = `${value.slice(0, 2)}-${value.slice(2, 5)}`;
    }

    e.target.value = value;
    setValue("billingPostalCode", value);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-[#103830] flex items-center gap-2">
          1. Dane do faktury
        </h2>

        {/* --- DEBUG (tylko lokalnie, nie buduje się na produkcji) --- */}
        {IS_DEV && (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Debug · wypełnij losowymi danymi
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillRandom("personal")}
                className="flex-1 cursor-pointer rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
              >
                Osoba prywatna
              </button>
              <button
                type="button"
                onClick={() => fillRandom("company")}
                title="Wypełnia też NIP — webhook wejdzie w ścieżkę fakturową"
                className="flex-1 cursor-pointer rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
              >
                Firma (z NIP)
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-amber-700/80">
              W dev faktura NIE jest wystawiana w Fakturowni — wywołanie jest
              blokowane w src/app/actions/fakturownia.ts.
            </p>
          </div>
        )}

        {/* Przełącznik Typu Konta */}
        <div className="grid grid-cols-2 gap-4">
          <label
            className={cn(
              "cursor-pointer rounded-xl border-2 p-4 flex items-center justify-center gap-3 transition-all",
              billingType === "personal"
                ? "border-[#0c493e] bg-[#0c493e]/5 text-[#0c493e]"
                : "border-gray-100 hover:border-gray-200 text-gray-500",
            )}
          >
            <input
              {...register("billingType")}
              type="radio"
              value="personal"
              className="hidden"
            />
            <User className="w-5 h-5" />
            <span className="font-semibold text-sm ">Osoba prywatna</span>
          </label>

          <label
            className={cn(
              "cursor-pointer rounded-xl border-2 p-4 flex items-center justify-center gap-3 transition-all",
              billingType === "company"
                ? "border-[#0c493e] bg-[#0c493e]/5 text-[#0c493e]"
                : "border-gray-100 hover:border-gray-200 text-gray-500",
            )}
          >
            <input
              {...register("billingType")}
              type="radio"
              value="company"
              className="hidden"
            />
            <Building2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Firma / DG</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {/* Imię i Nazwisko / Nazwa Firmy */}
        <StyledInput
          label={billingType === "company" ? "Nazwa firmy" : "Imię i nazwisko"}
          name="billingName"
          register={register}
          error={errors.billingName?.message}
          placeholder={
            billingType === "company" ? "Moja Firma Sp. z o.o." : "Jan Kowalski"
          }
        />

        {/* NIP (Tylko dla firmy) - Z FORMATOWANIEM */}
        {billingType === "company" && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <StyledInput
              label="NIP"
              name="billingNip"
              register={register}
              error={errors.billingNip?.message}
              placeholder="0000000000"
              maxLength={10}
              onChangeCustom={handleNipChange} // <-- Tutaj podpinamy logikę
            />
          </div>
        )}

        {/* Adres */}
        <StyledInput
          label="Adres zamieszkania / siedziby"
          name="billingAddress"
          register={register}
          error={errors.billingAddress?.message}
          placeholder="ul. Kwiatowa 12/3"
        />

        {/* Kod pocztowy + Miasto + Kraj */}
        <div className="flex gap-4">
          <div className="w-1/3">
            <StyledInput
              label="Kod"
              name="billingPostalCode"
              register={register}
              error={errors.billingPostalCode?.message}
              placeholder="00-000"
              maxLength={6} // XX-XXX to 6 znaków
              onChangeCustom={handlePostalCodeChange} // <-- Tutaj podpinamy logikę
            />
          </div>
          <div className="w-2/3">
            <StyledInput
              label="Miasto"
              name="billingCity"
              register={register}
              error={errors.billingCity?.message}
              placeholder="Warszawa"
            />
          </div>

          {/* ZABLOKOWANY INPUT DLA POLSKI (Ukryty na mobile, widoczny na desktop jeśli chcesz, lub zostawiamy hidden input) */}
          {/* Dla uproszczenia układu (żeby kod pocztowy nie był za wąski) możemy ukryć wizualnie kraj i zostawić tylko hidden input, 
              skoro i tak jest zablokowany na PL. Ale jeśli chcesz go widzieć: */}
          <input type="hidden" {...register("billingCountry")} value="PL" />
        </div>
      </div>

      <div className="pt-2">
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          variant="primary"
          className="w-full text-sm font-semibold rounded-xl"
        >
          Zapisz i przejdź do płatności
        </LoadingButton>
      </div>
    </form>
  );
};
