/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  LayoutGrid,
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

import { aboutSchema } from "@/lib/validators/landing";
import { AboutData } from "@/lib/types/landing";

type AboutFormValues = z.infer<typeof aboutSchema>;

interface Props {
  data: AboutData;
}

export function AboutForm({ data }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<AboutFormValues>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      headline:
        typeof data.headline === "string"
          ? data.headline
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data.headline as any).prefix +
            " " +
            (data.headline as any).highlight,
      highlight: data.highlight || "",
      description: data.description,
      cards: data.cards,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "cards",
  });

  const handleAppendCard = () => {
    if (fields.length >= 3) {
      toast.error("Osiągnięto limit", {
        description:
          "Ta sekcja obsługuje maksymalnie 3 karty (ze względu na układ).",
        icon: <AlertCircle className="text-red-500" size={20} />,
      });
      return;
    }
    append({ title: "", description: "" });
  };

  const onSubmit = async (values: AboutFormValues) => {
    const toastId = toast.loading("Zapisywanie zmian...");
    try {
      const response = await fetch("/api/admin/cms/about", {
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
          <h2 className="text-xl font-bold text-gray-900">Sekcja: O mnie</h2>
          <p className="text-sm text-gray-500">
            Edytuj nagłówek, opis oraz karty z osiągnięciami.
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
        <FormCard title="Treść Główna" icon={User}>
          <div className="grid gap-6">
            <InputGroup label="Nagłówek">
              <StyledInput
                {...register("headline")}
                placeholder="Np. O mnie - Alicja..."
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
                To słowo zostanie automatycznie znalezione w nagłówku i
                wyróżnione.
              </p>
            </div>

            <InputGroup label="Opis">
              <StyledTextarea
                {...register("description")}
                className="min-h-[150px]"
              />
              <ErrorMsg error={errors.description} />
            </InputGroup>
          </div>
        </FormCard>

        {/* --- 2. KARTY (Max 3) --- */}
        <FormCard title="Karty Osiągnięć (Max 3)" icon={LayoutGrid}>
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
                  <InputGroup label={`Karta ${index + 1} - Tytuł`}>
                    <StyledInput
                      {...register(`cards.${index}.title`)}
                      className="bg-white"
                    />
                    <ErrorMsg error={errors.cards?.[index]?.title} />
                  </InputGroup>
                  <InputGroup label="Opis">
                    <StyledTextarea
                      {...register(`cards.${index}.description`)}
                      className="bg-white h-20 text-sm"
                    />
                    <ErrorMsg error={errors.cards?.[index]?.description} />
                  </InputGroup>
                </div>
              </div>
            ))}

            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAppendCard}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors",
                  fields.length >= 3
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-gray-300 hover:text-gray-700 cursor-pointer",
                )}
              >
                <Plus size={16} /> Dodaj Kartę
              </button>
              {fields.length >= 3 && (
                <span className="text-xs text-center text-red-400">
                  Osiągnięto limit 3 kart
                </span>
              )}
            </div>
          </div>
        </FormCard>
      </div>
    </form>
  );
}
