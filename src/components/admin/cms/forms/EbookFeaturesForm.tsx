"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  BookOpen,
  HelpCircle,
  MousePointer2,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { InputGroup } from "../common/InputGroup";
import { StyledInput } from "../common/StyledInput";
import { StyledTextarea } from "../common/StyledTextarea";
import { FormCard } from "../common/FormCard";
import { ErrorMsg } from "./ErrorMsg";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ebookFeaturesSchema } from "@/lib/validators/landing";
import { EbookFeaturesData } from "@/lib/types/landing";
import { cn } from "@/lib/utils/cn";

type EbookFeaturesFormValues = z.infer<typeof ebookFeaturesSchema>;

interface Props {
  data: EbookFeaturesData;
}

export function EbookFeaturesForm({ data }: Props) {
  const {
    register,
    control,
    handleSubmit,
    // Dodajemy isDirty do destrukturyzacji formState
    formState: { errors, isSubmitting, isDirty },
    reset, // Potrzebne do zresetowania stanu "dirty" po udanym zapisie
  } = useForm<EbookFeaturesFormValues>({
    resolver: zodResolver(ebookFeaturesSchema),
    defaultValues: {
      headline: data.headline,
      highlight: data.highlight,
      description: data.description,
      // image usunięte
      button: {
        label: data.button.label,
      },
      faq: data.faq,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "faq.items",
  });

  const handleAddQuestion = () => {
    if (fields.length >= 5) {
      toast.error("Osiągnięto limit pytań", {
        description: "Możesz dodać maksymalnie 5 pytań do sekcji FAQ.",
        icon: <AlertCircle className="text-red-500" size={20} />,
      });
      return;
    }

    append({ question: "", answer: "" });
  };

  const onSubmit = async (values: EbookFeaturesFormValues) => {
    const toastId = toast.loading("Zapisywanie zmian...");
    try {
      const response = await fetch("/api/admin/cms/ebookFeatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Błąd zapisu");

      toast.success("Zapisano pomyślnie!", {
        id: toastId,
        icon: <CheckCircle2 className="text-[#0c493e]" size={20} />,
      });

      // Resetujemy formularz z nowymi wartościami, aby isDirty wróciło do false
      reset(values);
    } catch (error) {
      toast.error("Wystąpił błąd", { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Sekcja: Cechy E-booka
          </h2>
          <p className="text-sm text-gray-500">Edycja treści i FAQ.</p>
        </div>

        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          // Blokujemy, jeśli trwa wysyłanie LUB nic nie zmieniono
          disabled={isSubmitting || !isDirty}
          className={cn(
            "flex items-center justify-center p-3 transition-all duration-200",
            // Jeśli są zmiany: zielony pointer. Jeśli nie: szary, grayscale i not-allowed
            isDirty
              ? "cursor-pointer"
              : "grayscale opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 border-transparent shadow-none",
          )}
        >
          <Save size={20} />
        </LoadingButton>
      </div>

      <div className="grid gap-8">
        {/* TREŚĆ */}
        <FormCard title="Nagłówek i Opis" icon={BookOpen}>
          <div className="grid gap-6">
            <InputGroup label="Nagłówek Główny">
              <StyledInput
                {...register("headline")}
                placeholder="Wpisz nagłówek..."
              />
              <ErrorMsg error={errors.headline} />
            </InputGroup>

            <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 grid md:grid-cols-2 gap-4 items-center">
              <InputGroup label="Wyróżniona fraza (Zielony kolor)">
                <StyledInput
                  {...register("highlight")}
                  className="bg-white border-green-200 focus:border-green-500 text-green-700 font-medium"
                />
              </InputGroup>
              <div className="text-xs text-green-700/80 px-2">
                Automatyczne kolorowanie frazy w nagłówku.
              </div>
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

        <div className="grid md:grid-cols-2 gap-8">
          {/* PRZYCISK (BEZ OBRAZKA) */}
          <FormCard title="Przycisk CTA" icon={MousePointer2}>
            <div className="space-y-6">
              <InputGroup label="Etykieta przycisku">
                <StyledInput {...register("button.label")} />
                <ErrorMsg error={errors.button?.label} />
              </InputGroup>

              <p className="text-xs text-gray-400">
                Link przycisku oraz zdjęcie obok są ustawione na stałe w kodzie
                strony.
              </p>
            </div>
          </FormCard>

          {/* FAQ */}
          <FormCard title="Lista Pytań (FAQ)" icon={HelpCircle}>
            <InputGroup label="Tytuł sekcji FAQ">
              <StyledInput
                {...register("faq.title")}
                className="font-bold mb-4"
              />
              <ErrorMsg error={errors.faq?.title} />
            </InputGroup>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative group"
                >
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="space-y-3 pr-6">
                    <StyledInput
                      {...register(`faq.items.${index}.question` as const)}
                      placeholder="Pytanie..."
                      className="font-medium bg-white"
                    />
                    <ErrorMsg error={errors.faq?.items?.[index]?.question} />

                    <StyledTextarea
                      {...register(`faq.items.${index}.answer` as const)}
                      placeholder="Odpowiedź..."
                      className="text-sm bg-white min-h-[60px]"
                    />
                    <ErrorMsg error={errors.faq?.items?.[index]?.answer} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAddQuestion}
                className={cn(
                  "w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 hover:text-gray-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors cursor-pointer",
                  fields.length >= 5 &&
                    "opacity-50 hover:border-red-200 hover:text-red-400 cursor-pointer",
                )}
              >
                <Plus size={16} />
                Dodaj Pytanie
              </button>
              {fields.length >= 5 && (
                <span className="text-xs text-center text-red-400">
                  Osiągnięto limit 5 pytań
                </span>
              )}
            </div>
          </FormCard>
        </div>
      </div>
    </form>
  );
}
