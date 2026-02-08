"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Type,
  MousePointer2,
  BarChart3,
  Save,
  CheckCircle2,
} from "lucide-react";

import { InputGroup } from "../common/InputGroup";
import { StyledInput } from "../common/StyledInput";
import { StyledTextarea } from "../common/StyledTextarea";
import { FormCard } from "../common/FormCard";

import { HeroData } from "@/lib/types/landing";
import { ErrorMsg } from "./ErrorMsg";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn"; // Import cn

// --- SCHEMAT WALIDACJI ---
const heroFormSchema = z.object({
  headline: z.string().min(1, "Nagłówek jest wymagany"),
  highlight: z.string().optional(),
  description: z.string().min(1, "Opis jest wymagany"),
  buttons: z.object({
    primary: z.object({ label: z.string().min(1, "Wymagane") }),
    secondary: z.object({ label: z.string().min(1, "Wymagane") }),
  }),
  socialProof: z.object({
    stats: z.object({
      count: z.string(),
      labelLine1: z.string(),
      labelLine2: z.string(),
    }),
  }),
});

type HeroFormValues = z.infer<typeof heroFormSchema>;

interface HeroFormProps {
  data: HeroData;
}

export function HeroForm({ data }: HeroFormProps) {
  const defaultValues: HeroFormValues = {
    headline: data.headline,
    highlight: data.highlight,
    description: data.description,
    buttons: {
      primary: { label: data.buttons.primary.label },
      secondary: { label: data.buttons.secondary.label },
    },
    socialProof: data.socialProof,
  };

  const {
    register,
    handleSubmit,
    // Dodajemy isDirty i reset
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<HeroFormValues>({
    resolver: zodResolver(heroFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: HeroFormValues) => {
    // 1. Toast Ładowania
    const toastId = toast.loading("Zapisywanie zmian...", {
      description: "Przetwarzamy dane sekcji Hero.",
    });

    try {
      const response = await fetch("/api/admin/cms/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Błąd zapisu");
      }

      // 2. Toast Sukcesu (Podmiana)
      toast.success("Zapisano pomyślnie!", {
        id: toastId, // Podmieniamy toast
        description: "Twoje zmiany są już widoczne na stronie głównej.",
        icon: <CheckCircle2 className="text-[#0c493e]" size={20} />, // Twoja zieleń!
        duration: 4000,
      });

      // Resetujemy stan formularza, aby przycisk znów był "czysty"
      reset(values);
    } catch (error) {
      console.error(error);
      // 3. Toast Błędu (Podmiana)
      toast.error("Wystąpił błąd", {
        id: toastId, // Podmieniamy toast
        description: "Nie udało się zapisać zmian. Spróbuj ponownie.",
        duration: 4000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto pb-20">
      {/* --- GÓRNY PASEK AKCJI --- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Edycja Sekcji Hero
          </h2>
          <p className="text-sm text-gray-500">
            Zarządzaj głównym widokiem strony startowej.
          </p>
        </div>

        {/* ZMODYFIKOWANY PRZYCISK */}
        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          // Zablokuj, jeśli wysyłamy LUB brak zmian
          disabled={isSubmitting || !isDirty}
          className={cn(
            "flex items-center justify-center p-3 transition-all duration-200",
            // Jeśli są zmiany: cursor-pointer. Jeśli nie: grayscale, opacity-50, not-allowed
            isDirty
              ? "cursor-pointer"
              : "grayscale opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 border-transparent shadow-none",
          )}
        >
          <Save size={20} />
        </LoadingButton>
      </div>

      <div className="grid gap-8">
        {/* --- KARTA 1: TREŚĆ --- */}
        <FormCard
          title="Treść i Komunikacja"
          description="To pierwsza rzecz, którą widzi użytkownik. Zadbaj o jasny przekaz."
          icon={Type}
        >
          <div className="grid gap-6">
            <InputGroup label="Nagłówek Główny (H1)">
              <StyledInput
                {...register("headline")}
                className="text-lg font-medium"
                placeholder="Np. Od Teorii Do Diagnozy..."
              />
              <ErrorMsg error={errors.headline} />
            </InputGroup>

            <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 grid md:grid-cols-2 gap-4 items-center">
              <InputGroup label="Wyróżniona fraza (Zielony kolor)">
                <StyledInput
                  {...register("highlight")}
                  className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500/20 text-green-700 font-medium"
                />
                <ErrorMsg error={errors.highlight} />
              </InputGroup>
              <div className="text-xs text-green-700/80 leading-relaxed px-2">
                <CheckCircle2 size={14} className="inline-block mr-1 mb-0.5" />
                To słowo zostanie automatycznie znalezione w nagłówku i
                pokolorowane na zielono. <strong>(case sensitive)</strong>
              </div>
            </div>

            <InputGroup label="Opis pod nagłówkiem">
              <StyledTextarea
                {...register("description")}
                className="min-h-[120px] text-base"
              />
              <ErrorMsg error={errors.description} />
            </InputGroup>
          </div>
        </FormCard>

        <div className="grid md:grid-cols-2 gap-8">
          {/* --- KARTA 2: PRZYCISKI --- */}
          <FormCard
            title="Przyciski (CTA)"
            description="Skieruj użytkownika do odpowiedniej akcji."
            icon={MousePointer2}
          >
            <div className="space-y-5">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 mb-2 block tracking-wider">
                  Przycisk Główny (Pełny)
                </span>
                <InputGroup label="Tekst przycisku">
                  <StyledInput {...register("buttons.primary.label")} />
                  <ErrorMsg error={errors.buttons?.primary?.label} />
                </InputGroup>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 mb-2 block tracking-wider">
                  Przycisk Drugorzędny (Outline)
                </span>
                <InputGroup label="Tekst przycisku">
                  <StyledInput {...register("buttons.secondary.label")} />
                  <ErrorMsg error={errors.buttons?.secondary?.label} />
                </InputGroup>
              </div>
            </div>
          </FormCard>

          {/* --- KARTA 3: STATYSTYKI --- */}
          <FormCard
            title="Social Proof"
            description="Buduj zaufanie liczbami."
            icon={BarChart3}
          >
            <div className="space-y-4">
              <InputGroup label="Główna Liczba">
                <StyledInput
                  {...register("socialProof.stats.count")}
                  className="font-bold text-xl text-center tracking-tight"
                  placeholder="500+"
                />
              </InputGroup>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Linia 1">
                  <StyledInput
                    {...register("socialProof.stats.labelLine1")}
                    className="text-center text-sm"
                  />
                </InputGroup>
                <InputGroup label="Linia 2">
                  <StyledInput
                    {...register("socialProof.stats.labelLine2")}
                    className="text-center text-sm"
                  />
                </InputGroup>
              </div>
            </div>
          </FormCard>
        </div>
      </div>
    </form>
  );
}
