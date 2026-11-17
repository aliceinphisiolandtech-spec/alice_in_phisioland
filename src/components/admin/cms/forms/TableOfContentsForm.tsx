"use client";

import { Controller, useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ListOrdered,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

import { InputGroup } from "../common/InputGroup";
import { StyledInput } from "../common/StyledInput";
import { StyledTextarea } from "../common/StyledTextarea";
import { FormCard } from "../common/FormCard";
import { ErrorMsg } from "./ErrorMsg";
import { LoadingButton } from "@/components/ui/LoadingButton";

import { tableOfContentsSchema } from "@/lib/validators/landing";
import type { TableOfContentsData } from "@/lib/types/landing";
import { numberChapters } from "@/lib/table-of-contents";

type FormValues = z.infer<typeof tableOfContentsSchema>;

const MAX_CHAPTERS = 30;

/**
 * Edycja spisu treści e-booka (sekcja „O e-booku” na stronie głównej).
 *
 * Numerów rozdziałów się tu nie wpisuje — strona liczy je sama z kolejności
 * (cyfry rzymskie). Strzałki zmieniają kolejność, a „Bez numeru” służy do
 * pozycji typu „Bibliografia”.
 */
export function TableOfContentsForm({ data }: { data: TableOfContentsData }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(tableOfContentsSchema),
    defaultValues: data,
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "chapters",
  });

  // Podgląd numeracji na żywo — ten sam algorytm co na stronie.
  const watched = useWatch({ control, name: "chapters" }) ?? [];
  const numerals = numberChapters(
    watched.map((c) => ({
      title: c?.title ?? "",
      numbered: Boolean(c?.numbered),
    })),
  ).map((c) => c.numeral);

  const onSubmit = async (values: FormValues) => {
    const toastId = toast.loading("Zapisywanie zmian...");
    try {
      const response = await fetch("/api/admin/cms/tableOfContents", {
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
    } catch {
      toast.error("Wystąpił błąd", {
        id: toastId,
        icon: <AlertCircle className="text-red-500" size={20} />,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-5xl pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Sekcja: Spis treści
          </h2>
          <p className="text-sm text-gray-500">
            Rozdziały e-booka widoczne w sekcji „O e-booku” na stronie głównej.
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
        <FormCard title="Nagłówek i opis" icon={BookOpen}>
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <InputGroup label="Etykieta (np. Tom 1)">
                <StyledInput {...register("badge")} placeholder="Tom 1" />
                <ErrorMsg error={errors.badge} />
              </InputGroup>
              <InputGroup label="Nagłówek">
                <StyledInput {...register("headline")} />
                <ErrorMsg error={errors.headline} />
              </InputGroup>
            </div>
            <InputGroup label="Wyróżniona fraza (kolor akcentu)">
              <StyledInput
                {...register("highlight")}
                className="border-green-200 font-medium text-green-700"
              />
            </InputGroup>
            <InputGroup label="Opis">
              <StyledTextarea
                {...register("description")}
                className="min-h-[90px]"
              />
              <ErrorMsg error={errors.description} />
            </InputGroup>
          </div>
        </FormCard>

        <FormCard
          title="Rozdziały"
          description="Numery (I, II, III…) liczą się same z kolejności. Strzałkami zmieniasz kolejność."
          icon={ListOrdered}
        >
          <div className="space-y-2.5">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-gray-200"
              >
                <span className="mt-2 w-12 shrink-0 text-right font-serif text-lg font-bold text-[#0c493e]">
                  {numerals[index] ? `${numerals[index]}.` : "—"}
                </span>

                <div className="min-w-0 flex-1 space-y-2">
                  <StyledInput
                    {...register(`chapters.${index}.title` as const)}
                    placeholder="Tytuł rozdziału..."
                    className="bg-white"
                  />
                  <ErrorMsg error={errors.chapters?.[index]?.title} />
                  <Controller
                    control={control}
                    name={`chapters.${index}.numbered` as const}
                    render={({ field: f }) => (
                      <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-gray-500">
                        {/* Odwrócona etykieta: zaznaczone = BEZ numeru. */}
                        <input
                          type="checkbox"
                          checked={!f.value}
                          onChange={(e) => f.onChange(!e.target.checked)}
                          className="h-3.5 w-3.5 accent-[#0c493e]"
                        />
                        Bez numeru (np. Bibliografia)
                      </label>
                    )}
                  />
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <IconButton
                    label="W górę"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp size={15} />
                  </IconButton>
                  <IconButton
                    label="W dół"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown size={15} />
                  </IconButton>
                  <IconButton label="Usuń" danger onClick={() => remove(index)}>
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>

          {errors.chapters?.root?.message && (
            <p className="text-xs text-red-500">
              {errors.chapters.root.message}
            </p>
          )}

          <button
            type="button"
            disabled={fields.length >= MAX_CHAPTERS}
            onClick={() => append({ title: "", numbered: true })}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} />
            Dodaj rozdział
          </button>
        </FormCard>
      </div>
    </form>
  );
}

const IconButton = ({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors disabled:cursor-not-allowed disabled:opacity-30",
      danger
        ? "hover:bg-red-50 hover:text-red-500"
        : "hover:bg-white hover:text-[#0c493e]",
    )}
  >
    {children}
  </button>
);
