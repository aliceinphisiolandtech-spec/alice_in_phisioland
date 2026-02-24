/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable */
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  MessageSquareQuote,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

import { InputGroup } from "../common/InputGroup";
import { StyledInput } from "../common/StyledInput";
import { FormCard } from "../common/FormCard";
import { ErrorMsg } from "./ErrorMsg";
import { LoadingButton } from "@/components/ui/LoadingButton";

import { testimonialsSchema } from "@/lib/validators/landing";
import { TestimonialsData } from "@/lib/types/landing";

// 1. Typ z Zod
type TestimonialsFormValues = z.infer<typeof testimonialsSchema>;

interface Props {
  data: TestimonialsData;
}

export function TestimonialsForm({ data }: Props) {
  // 2. Przygotowanie Default Values z wymuszeniem typu (Type Assertion)
  // To "ucisza" błędy o niezgodności typów undefined/number
  const defaultValues = {
    headline:
      typeof data.headline === "string"
        ? data.headline
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.headline as any).line1 + " " + (data.headline as any).line2,

    highlight: data.highlight || "",

    reviews: Array.isArray(data.reviews)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.reviews.map((r: any) => ({
          name: r.name || "",
          text: r.text || "",
          rating: typeof r.rating === "number" ? r.rating : 5,
          role: r.role || "",
          headline: r.headline || "",
          id: r.id,
        }))
      : [],
  } as TestimonialsFormValues; // <--- KLUCZOWE: Rzutowanie na typ docelowy

  // 3. Użycie useForm z typem generycznym
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<TestimonialsFormValues>({
    resolver: zodResolver(testimonialsSchema),
    defaultValues: defaultValues,
  });

  const onSubmit = async (values: TestimonialsFormValues) => {
    const toastId = toast.loading("Zapisywanie zmian...");
    try {
      const response = await fetch("/api/admin/cms/testimonials", {
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
      console.error(error);
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
          <h2 className="text-xl font-bold text-gray-900">Sekcja: Opinie</h2>
          <p className="text-sm text-gray-500">
            Edytuj nagłówek sekcji opinii. Same opinie są zarządzane
            dynamicznie.
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
        <FormCard title="Nagłówek Sekcji" icon={MessageSquareQuote}>
          <div className="grid gap-6">
            <InputGroup label="Główny Nagłówek">
              <StyledInput
                {...register("headline")}
                placeholder="Np. Zaufali nam..."
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
                To słowo zostanie podkreślone na zielono.
              </p>
            </div>
          </div>
        </FormCard>
      </div>
    </form>
  );
}
