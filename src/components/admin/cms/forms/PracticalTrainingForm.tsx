/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  GraduationCap,
  LayoutGrid,
  MousePointer2,
  Award,
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

import { practicalTrainingSchema } from "@/lib/validators/landing";
import { PracticalTrainingData } from "@/lib/types/landing";

type PracticalTrainingFormValues = z.infer<typeof practicalTrainingSchema>;

interface Props {
  data: PracticalTrainingData;
}

export function PracticalTrainingForm({ data }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<PracticalTrainingFormValues>({
    resolver: zodResolver(practicalTrainingSchema),
    defaultValues: {
      headline:
        typeof data.headline === "string"
          ? data.headline
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data.headline as any).line1 +
            " " +
            (data.headline as any).highlight,
      highlight: data.highlight || "",
      description: data.description,
      badge: data.badge,
      features: data.features,
      button: {
        label: data.button.label,
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "features",
  });

  const handleAppendFeature = () => {
    if (fields.length >= 2) {
      toast.error("Osiągnięto limit", {
        description: "Ta sekcja obsługuje maksymalnie 2 główne cechy.",
        icon: <AlertCircle className="text-red-500" size={20} />,
      });
      return;
    }
    append({ title: "", description: "" });
  };

  const onSubmit = async (values: PracticalTrainingFormValues) => {
    const toastId = toast.loading("Zapisywanie zmian...");
    try {
      const response = await fetch("/api/admin/cms/practicalTraining", {
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
            Sekcja: Szkolenie Praktyczne
          </h2>
          <p className="text-sm text-gray-500">
            Edytuj sekcję promującą szkolenie stacjonarne.
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
              : "grayscale opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 border-transparent shadow-none",
          )}
        >
          <Save size={20} />
        </LoadingButton>
      </div>

      <div className="grid gap-8">
        {/* --- 1. TREŚĆ --- */}
        <FormCard title="Treść Główna" icon={GraduationCap}>
          <div className="grid gap-6">
            <InputGroup label="Nagłówek">
              <StyledInput
                {...register("headline")}
                placeholder="Np. Praktyczne szkolenie..."
              />
              <ErrorMsg error={errors.headline} />
            </InputGroup>

            <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
              <InputGroup label="Wyróżniona fraza (Highlight)">
                <StyledInput
                  {...register("highlight")}
                  className="bg-white border-green-200 text-green-700 font-medium"
                />
              </InputGroup>
              <p className="text-xs text-green-700/80 mt-2 px-1">
                Słowo wyróżnione kolorem zielonym.
              </p>
            </div>

            <InputGroup label="Opis">
              <StyledTextarea
                {...register("description")}
                className="min-h-[120px]"
              />
              <ErrorMsg error={errors.description} />
            </InputGroup>
          </div>
        </FormCard>

        <div className="grid md:grid-cols-2 gap-8">
          {/* --- 2. BADGE (Okrągły element) --- */}
          <FormCard title="Badge (Licznik)" icon={Award}>
            <div className="space-y-4">
              <InputGroup label="Liczba (np. 1500+)">
                <StyledInput
                  {...register("badge.count")}
                  className="font-bold text-lg"
                />
                <ErrorMsg error={errors.badge?.count} />
              </InputGroup>
              <InputGroup label="Etykieta (np. Przeszkolonych kursantów)">
                <StyledInput {...register("badge.label")} />
                <ErrorMsg error={errors.badge?.label} />
              </InputGroup>
            </div>
          </FormCard>

          {/* --- 3. PRZYCISK --- */}
          <FormCard title="Przycisk CTA" icon={MousePointer2}>
            <InputGroup label="Etykieta przycisku">
              <StyledInput {...register("button.label")} />
              <ErrorMsg error={errors.button?.label} />
            </InputGroup>
            <p className="text-xs text-gray-400 mt-4">
              Link prowadzi do /szkolenia (zdefiniowany w kodzie).
            </p>
          </FormCard>
        </div>

        {/* --- 4. CECHY (Max 2) --- */}
        <FormCard title="Kluczowe Cechy (Max 2)" icon={LayoutGrid}>
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100 relative group"
              >
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                >
                  <Trash2 size={16} />
                </button>

                <div className="space-y-3 pr-8">
                  <InputGroup label={`Cecha ${index + 1} - Tytuł`}>
                    <StyledInput
                      {...register(`features.${index}.title`)}
                      className="bg-white"
                    />
                    <ErrorMsg error={errors.features?.[index]?.title} />
                  </InputGroup>
                  <InputGroup label="Opis">
                    <StyledTextarea
                      {...register(`features.${index}.description`)}
                      className="bg-white h-20 text-sm"
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
                  fields.length >= 2
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-gray-300 hover:text-gray-700 cursor-pointer",
                )}
              >
                <Plus size={16} /> Dodaj Cechę
              </button>
              {fields.length >= 2 && (
                <span className="text-xs text-center text-red-400">
                  Osiągnięto limit 2 cech
                </span>
              )}
            </div>
          </div>
        </FormCard>
      </div>
    </form>
  );
}
