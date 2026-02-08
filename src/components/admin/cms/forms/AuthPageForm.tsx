"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LayoutTemplate, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

import { InputGroup } from "../common/InputGroup";
import { StyledInput } from "../common/StyledInput";
import { StyledTextarea } from "../common/StyledTextarea";
import { FormCard } from "../common/FormCard";
import { ErrorMsg } from "./ErrorMsg";
import { LoadingButton } from "@/components/ui/LoadingButton";

import { authPageSchema } from "@/lib/validators/landing";
import { AuthPageData } from "@/lib/types/landing";

type AuthPageFormValues = z.infer<typeof authPageSchema>;

interface Props {
  data: AuthPageData;
}

export function AuthPageForm({ data }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<AuthPageFormValues>({
    resolver: zodResolver(authPageSchema),
    defaultValues: data,
  });

  const onSubmit = async (values: AuthPageFormValues) => {
    const toastId = toast.loading("Zapisywanie zmian...");
    try {
      const response = await fetch("/api/admin/cms/authPage", {
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
          <h2 className="text-xl font-bold text-gray-900">Strona Logowania</h2>
          <p className="text-sm text-gray-500">
            Edytuj treści widoczne na zielonym panelu powitalnym (prawa strona).
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
        {/* --- TYLKO PANEL POWITALNY (Prawa strona) --- */}
        <FormCard title="Panel Powitalny (Prawa strona)" icon={LayoutTemplate}>
          <div className="grid gap-6">
            <InputGroup label="Główny Nagłówek">
              <StyledInput
                {...register("heroHeadline")}
                placeholder="Witaj w Świecie..."
              />
              <ErrorMsg error={errors.heroHeadline} />
            </InputGroup>

            <div className="bg-[#c5e96b]/20 p-4 rounded-lg border border-[#c5e96b]/50">
              <InputGroup label="Wyróżniona fraza (Jasna zieleń)">
                <StyledInput
                  {...register("heroHighlight")}
                  className="bg-white text-[#0c493e] font-medium"
                />
              </InputGroup>
              <p className="text-xs text-[#0c493e]/80 mt-2 px-1">
                Ten tekst wyświetli się w kolorze #c5e96b na ciemnym tle.
              </p>
            </div>

            <InputGroup label="Opis pod nagłówkiem">
              <StyledTextarea
                {...register("heroDescription")}
                className="min-h-[100px]"
              />
              <ErrorMsg error={errors.heroDescription} />
            </InputGroup>

            <InputGroup label="Tekst Badge'a (na dole)">
              <StyledInput
                {...register("badgeText")}
                placeholder="Ponad 500+..."
              />
              <ErrorMsg error={errors.badgeText} />
            </InputGroup>
          </div>
        </FormCard>
      </div>
    </form>
  );
}
