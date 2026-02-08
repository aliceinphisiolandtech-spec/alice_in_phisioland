/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Type,
  ListChecks,
  LayoutGrid,
  ArrowRightLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

import { InputGroup } from "../common/InputGroup";
import { StyledInput } from "../common/StyledInput";
import { StyledTextarea } from "../common/StyledTextarea";
import { FormCard } from "../common/FormCard";
import { ErrorMsg } from "./ErrorMsg";
import { LoadingButton } from "@/components/ui/LoadingButton";

import { contentPreviewSchema } from "@/lib/validators/landing";
import { ContentPreviewData } from "@/lib/types/landing";

type ContentPreviewFormValues = z.infer<typeof contentPreviewSchema>;

interface Props {
  data: ContentPreviewData;
}

export function ContentPreviewForm({ data }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ContentPreviewFormValues>({
    resolver: zodResolver(contentPreviewSchema),
    defaultValues: {
      headline:
        typeof data.headline === "string"
          ? data.headline
          : (data.headline as any).line1 + " " + (data.headline as any).line2,
      highlight: data.highlight || "",
      description: data.description,
      checklist: data.checklist.map((item) => ({ text: item })),
      features: data.features,
      transformation: data.transformation,
    },
  });

  // 1. Checklist Array (Max 6)
  const {
    fields: checklistFields,
    append: appendChecklist,
    remove: removeChecklist,
  } = useFieldArray({
    control,
    name: "checklist",
  });

  // 2. Features Array (Max 4)
  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray({
    control,
    name: "features",
  });

  // 3. Transformation Array (Max 5)
  const {
    fields: transFields,
    append: appendTrans,
    remove: removeTrans,
  } = useFieldArray({
    control,
    name: "transformation",
  });

  // --- HANDLERS Z LIMITAMI ---

  const handleAppendChecklist = () => {
    if (checklistFields.length >= 6) {
      toast.error("Osiągnięto limit", {
        description: "Maksymalnie 6 punktów korzyści.",
        icon: <AlertCircle className="text-red-500" size={20} />,
      });
      return;
    }
    appendChecklist({ text: "" });
  };

  const handleAppendFeature = () => {
    if (featureFields.length >= 4) {
      toast.error("Osiągnięto limit", {
        description: "Maksymalnie 4 kluczowe funkcje.",
        icon: <AlertCircle className="text-red-500" size={20} />,
      });
      return;
    }
    appendFeature({ title: "", description: "" });
  };

  const handleAppendTrans = () => {
    if (transFields.length >= 5) {
      toast.error("Osiągnięto limit", {
        description: "Maksymalnie 5 elementów transformacji.",
        icon: <AlertCircle className="text-red-500" size={20} />,
      });
      return;
    }
    appendTrans({ problemTitle: "", problemDesc: "", solution: "" });
  };

  const onSubmit = async (values: ContentPreviewFormValues) => {
    const toastId = toast.loading("Zapisywanie zmian...");
    try {
      const response = await fetch("/api/admin/cms/contentPreview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Błąd zapisu");

      toast.success("Zapisano pomyślnie!", {
        id: toastId,
        icon: <CheckCircle2 className="text-[#0c493e]" size={20} />,
      });
      reset(values);
    } catch (error) {
      toast.error("Wystąpił błąd", {
        id: toastId,
        icon: <AlertCircle className="text-red-500" size={20} />,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Sekcja: Co jest w środku?
          </h2>
          <p className="text-sm text-gray-500">
            Edytuj nagłówek, listę korzyści i transformację (Problem -
            Rozwiązanie).
          </p>
        </div>

        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting || !isDirty}
          className={cn(
            "flex items-center justify-center p-3 transition-all duration-200",
            isDirty
              ? "cursor-pointer"
              : "grayscale opacity-50 cursor-default bg-gray-400 hover:bg-gray-400 border-transparent shadow-none",
          )}
        >
          <Save size={20} />
        </LoadingButton>
      </div>

      <div className="grid gap-8">
        {/* --- 1. NAGŁÓWEK --- */}
        <FormCard title="Główny Przekaz" icon={Type}>
          <div className="grid gap-6">
            <InputGroup label="Nagłówek">
              <StyledInput
                {...register("headline")}
                placeholder="Wpisz nagłówek..."
              />
              <ErrorMsg error={errors.headline} />
            </InputGroup>

            <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
              <InputGroup label="Wyróżniona fraza (Highlight)">
                <StyledInput
                  {...register("highlight")}
                  className="bg-white border-green-200 text-green-700 font-medium"
                  placeholder="Wpisz frazę do wyróżnienia..."
                />
              </InputGroup>
              <p className="text-xs text-green-700/80 mt-2 px-1">
                To słowo zostanie automatycznie znalezione w nagłówku i
                podkreślone.
              </p>
            </div>

            <InputGroup label="Opis">
              <StyledTextarea
                {...register("description")}
                className="min-h-[100px]"
              />
              <ErrorMsg error={errors.description} />
            </InputGroup>
          </div>
        </FormCard>

        {/* --- 2. CHECKLISTA (Max 6) --- */}
        <FormCard title="Lista Korzyści (Checklista)" icon={ListChecks}>
          <div className="space-y-3">
            {checklistFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center group">
                <div className="flex-1">
                  <StyledInput
                    {...register(`checklist.${index}.text`)}
                    placeholder={`Punkt ${index + 1}`}
                  />
                  <ErrorMsg error={errors.checklist?.[index]?.text} />
                </div>
                <button
                  type="button"
                  onClick={() => removeChecklist(index)}
                  className="p-2 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAppendChecklist}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-2 text-sm font-medium text-gray-500 transition-colors",
                  checklistFields.length >= 6
                    ? "opacity-50 cursor-default" // Blokada hover
                    : "hover:border-gray-300 hover:text-gray-700 cursor-pointer", // Normalny stan
                )}
              >
                <Plus size={16} /> Dodaj punkt
              </button>
              {checklistFields.length >= 6 && (
                <span className="text-xs text-center text-red-400">
                  Osiągnięto limit 6 punktów
                </span>
              )}
            </div>
          </div>
        </FormCard>

        {/* --- 3. FUNKCJE (Max 4) --- */}
        <FormCard title="Kluczowe Funkcje (Kafelki)" icon={LayoutGrid}>
          <p className="text-sm text-gray-500 mb-4">
            Ikony są przypisane automatycznie w kolejności (Network, Microscope,
            Brain, Shield).
          </p>
          <div className="space-y-6">
            {featureFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100 relative group"
              >
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                >
                  <Trash2 size={16} />
                </button>

                <div className="space-y-3 pr-8">
                  <InputGroup label={`Funkcja ${index + 1} - Tytuł`}>
                    <StyledInput
                      {...register(`features.${index}.title`)}
                      className="bg-white"
                      placeholder="Tytuł funkcji"
                    />
                    <ErrorMsg error={errors.features?.[index]?.title} />
                  </InputGroup>
                  <InputGroup label="Opis">
                    <StyledTextarea
                      {...register(`features.${index}.description`)}
                      className="bg-white h-20"
                      placeholder="Opis funkcji"
                    />
                    <ErrorMsg error={errors.features?.[index]?.description} />
                  </InputGroup>
                </div>
              </div>
            ))}

            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAppendFeature}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors",
                  featureFields.length >= 4
                    ? "opacity-50 cursor-default" // Blokada hover
                    : "hover:border-gray-300 hover:text-gray-700 cursor-pointer", // Normalny stan
                )}
              >
                <Plus size={16} /> Dodaj Funkcję
              </button>
              {featureFields.length >= 4 && (
                <span className="text-xs text-center text-red-400">
                  Osiągnięto limit 4 funkcji
                </span>
              )}
            </div>
          </div>
        </FormCard>

        {/* --- 4. TRANSFORMACJA (Max 5) --- */}
        <FormCard
          title="Transformacja (Problem → Rozwiązanie)"
          icon={ArrowRightLeft}
        >
          <div className="space-y-6">
            {transFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100 relative group"
              >
                <button
                  type="button"
                  onClick={() => removeTrans(index)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 cursor-pointer z-10 transition-colors"
                >
                  <Trash2 size={18} />
                </button>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* LEWA STRONA: PROBLEM */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">
                      Problem
                    </h4>
                    <InputGroup label="Tytuł Problemu (Pogrubiony)">
                      <StyledInput
                        {...register(`transformation.${index}.problemTitle`)}
                        className="bg-white"
                        placeholder="Np. Brak Pewności..."
                      />
                      <ErrorMsg
                        error={errors.transformation?.[index]?.problemTitle}
                      />
                    </InputGroup>
                    <InputGroup label="Opis Problemu">
                      <StyledInput
                        {...register(`transformation.${index}.problemDesc`)}
                        className="bg-white"
                        placeholder="Dalsza część zdania..."
                      />
                      <ErrorMsg
                        error={errors.transformation?.[index]?.problemDesc}
                      />
                    </InputGroup>
                  </div>

                  {/* PRAWA STRONA: ROZWIĄZANIE */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider">
                      Rozwiązanie
                    </h4>
                    <InputGroup label="Pełne zdanie rozwiązania">
                      <StyledTextarea
                        {...register(`transformation.${index}.solution`)}
                        className="bg-white h-[108px]"
                        placeholder="Co zyskuje klient?"
                      />
                      <ErrorMsg
                        error={errors.transformation?.[index]?.solution}
                      />
                    </InputGroup>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAppendTrans}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors",
                  transFields.length >= 5
                    ? "opacity-50 cursor-default" // Blokada hover
                    : "hover:border-gray-300 hover:text-gray-700 cursor-pointer", // Normalny stan
                )}
              >
                <Plus size={16} /> Dodaj Transformację
              </button>
              {transFields.length >= 5 && (
                <span className="text-xs text-center text-red-400">
                  Osiągnięto limit 5 transformacji
                </span>
              )}
            </div>
          </div>
        </FormCard>
      </div>
    </form>
  );
}
