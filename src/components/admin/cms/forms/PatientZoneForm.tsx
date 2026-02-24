"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Stethoscope,
  Save,
  CheckCircle2,
  AlertCircle,
  ScanSearch,
  Star,
  ClipboardList,
  HelpCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

import { InputGroup } from "../common/InputGroup";
import { StyledInput } from "../common/StyledInput";
import { StyledTextarea } from "../common/StyledTextarea";
import { FormCard } from "../common/FormCard";
import { ErrorMsg } from "./ErrorMsg";
import { LoadingButton } from "@/components/ui/LoadingButton";

// --- WAŻNE: Importujemy schematy DLA PACJENTA, a nie ogólne ---
import {
  patientHeroSchema, // <--- Upewnij się, że to ten schemat!
  patientReviewsSchema,
  patientPreparationSchema,
  patientFaqSchema,
} from "@/lib/validators/landing";

// Importujemy typy danych
import {
  PatientHeroData,
  PatientReviewsData,
  PatientPreparationData,
  PatientFaqData,
} from "@/lib/types/landing";

// Tworzymy jeden zbiorczy schemat dla formularza
const patientZoneFormSchema = z.object({
  hero: patientHeroSchema, // <--- TUTAJ BYŁ BŁĄD (było heroSchema?)
  reviews: patientReviewsSchema,
  preparation: patientPreparationSchema,
  faq: patientFaqSchema,
});

type PatientZoneFormValues = z.infer<typeof patientZoneFormSchema>;

interface Props {
  // Przyjmujemy dane dla wszystkich 4 sekcji
  data: {
    hero: PatientHeroData;
    reviews: PatientReviewsData;
    preparation: PatientPreparationData;
    faq: PatientFaqData;
  };
}

export function PatientZoneForm({ data }: Props) {
  const ensureThreeFeatures = (features: any[]) => {
    const current = Array.isArray(features) ? features : [];
    const result = [...current];

    // Jeśli brakuje - dodaj puste
    while (result.length < 3) {
      result.push({ icon: "Circle", title: "Nowy Tytuł", desc: "Nowy Opis" });
    }

    // Jeśli za dużo - utnij (zwróć tylko 3)
    return result.slice(0, 3);
  };
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<PatientZoneFormValues>({
    resolver: zodResolver(patientZoneFormSchema),
    defaultValues: {
      hero: {
        ...data.hero,
        features: ensureThreeFeatures(data.hero.features), // <--- TUTAJ UŻYWAMY FUNKCJI
      },
      reviews: data.reviews,
      preparation: data.preparation,
      faq: data.faq,
    },
  });

  // --- FIELD ARRAYS (Listy dynamiczne) ---

  // 1. Hero Features
  const {
    fields: heroFeaturesFields,
    append: appendHeroFeature,
    remove: removeHeroFeature,
  } = useFieldArray({
    control,
    name: "hero.features",
  });

  // 2. Reviews (Znany Lekarz)
  const {
    fields: reviewsFields,
    append: appendReview,
    remove: removeReview,
  } = useFieldArray({
    control,
    name: "reviews.reviews",
  });

  // 3. Preparation Steps
  const {
    fields: prepStepsFields,
    append: appendPrepStep,
    remove: removePrepStep,
  } = useFieldArray({
    control,
    name: "preparation.steps",
  });

  // 4. FAQ Items
  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({
    control,
    name: "faq.items",
  });

  // --- SUBMIT HANDLER ---
  const onSubmit = async (values: PatientZoneFormValues) => {
    const toastId = toast.loading("Zapisywanie Strefy Pacjenta...");

    try {
      // Wysyłamy 4 równoległe żądania do API (dla każdego klucza osobno)
      await Promise.all([
        fetch("/api/admin/cms/patientHero", {
          method: "POST",
          body: JSON.stringify(values.hero),
        }),
        fetch("/api/admin/cms/patientReviews", {
          method: "POST",
          body: JSON.stringify(values.reviews),
        }),
        fetch("/api/admin/cms/patientPreparation", {
          method: "POST",
          body: JSON.stringify(values.preparation),
        }),
        fetch("/api/admin/cms/patientFaq", {
          method: "POST",
          body: JSON.stringify(values.faq),
        }),
      ]);

      toast.success("Zapisano pomyślnie!", {
        id: toastId,
        icon: <CheckCircle2 className="text-[#0c493e]" size={20} />,
      });

      reset(values);
    } catch (error) {
      console.error(error);
      toast.error("Wystąpił błąd podczas zapisu", {
        id: toastId,
        icon: <AlertCircle className="text-red-500" size={20} />,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto pb-20">
      {/* NAGŁÓWEK FORMULARZA */}
      <div className="flex items-center justify-between mb-8 sticky top-0  backdrop-blur-md py-4 z-20 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Edycja Strefy Pacjenta
          </h2>
          <p className="text-sm text-gray-500">
            Zarządzaj wszystkimi sekcjami podstrony dla pacjentów w jednym
            miejscu.
          </p>
        </div>

        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting || !isDirty}
          className={cn(
            "flex items-center justify-center p-3 transition-all duration-200",
            isDirty
              ? "cursor-pointer bg-[#0c493e] hover:bg-[#093b32]"
              : "grayscale opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 border-transparent shadow-none",
          )}
        >
          <Save size={20} />
        </LoadingButton>
      </div>

      <div className="grid gap-12">
        {/* ========================================================= */}
        {/* SEKCJA 1: HERO */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <Stethoscope className="text-[#0c493e]" />
            <h3 className="text-lg font-bold text-gray-800">
              1. Sekcja Główna (Hero)
            </h3>
          </div>

          <FormCard title="Treść Hero" icon={ScanSearch}>
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <InputGroup label="Badge (Mały napis)">
                  <StyledInput
                    {...register("hero.badge")}
                    placeholder="np. Strefa Pacjenta"
                  />
                  <ErrorMsg error={errors.hero?.badge} />
                </InputGroup>
                <InputGroup label="Nagłówek Główny">
                  <StyledInput {...register("hero.title")} />
                  <ErrorMsg error={errors.hero?.title} />
                </InputGroup>
              </div>
              <InputGroup label="Opis">
                <StyledTextarea
                  {...register("hero.description")}
                  className="h-24"
                />
                <ErrorMsg error={errors.hero?.description} />
              </InputGroup>

              {/* ZMIANA: Usunięto sekcję Statystyki i CTA */}

              {/* HERO FEATURES (Edycja tylko 3 kafelków) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kafelki z korzyściami (Edycja treści)
                </label>
                <div className="grid gap-4">
                  {heroFeaturesFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 bg-gray-50 rounded border border-gray-200"
                    >
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">
                        Kafelek #{index + 1}
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <InputGroup label="Tytuł">
                          <StyledInput
                            {...register(`hero.features.${index}.title`)}
                          />
                          <ErrorMsg
                            error={errors.hero?.features?.[index]?.title}
                          />
                        </InputGroup>
                        <InputGroup label="Opis">
                          <StyledInput
                            {...register(`hero.features.${index}.desc`)}
                          />
                          <ErrorMsg
                            error={errors.hero?.features?.[index]?.desc}
                          />
                        </InputGroup>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  * Ikony oraz liczba kafelków są stałe i zdefiniowane w kodzie
                  strony.
                </p>
              </div>
            </div>
          </FormCard>
        </div>

        {/* ========================================================= */}
        {/* SEKCJA 2: OPINIE (ZNANY LEKARZ) */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <Star className="text-[#0c493e]" />
            <h3 className="text-lg font-bold text-gray-800">
              2. Opinie i Widget
            </h3>
          </div>

          <FormCard title="Konfiguracja Sekcji Opinii" icon={Star}>
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <InputGroup label="Tytuł Sekcji">
                  <StyledInput {...register("reviews.sectionTitle")} />
                </InputGroup>
                <InputGroup label="Podtytuł">
                  <StyledInput {...register("reviews.sectionSubtitle")} />
                </InputGroup>
              </div>
              <InputGroup label="Tytuł Widgetu (Mobile)">
                <StyledInput {...register("reviews.widgetTitleMobile")} />
              </InputGroup>

              {/* Lista Opinii */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybrane Opinie
                </label>
                <div className="space-y-3">
                  {reviewsFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-3 bg-gray-50 rounded border border-gray-200 flex gap-3 items-start"
                    >
                      <div className="flex-1 space-y-2">
                        <StyledInput
                          {...register(`reviews.reviews.${index}.name`)}
                          placeholder="Imię pacjenta"
                          className="font-bold"
                        />
                        <StyledTextarea
                          {...register(`reviews.reviews.${index}.text`)}
                          placeholder="Treść opinii..."
                          className="h-16 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeReview(index)}
                        className="text-gray-400 hover:text-red-500 mt-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendReview({ name: "", text: "" })}
                    className="text-sm text-[#0c493e] font-medium flex items-center gap-1 hover:underline"
                  >
                    <Plus size={16} /> Dodaj opinię
                  </button>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded border border-blue-100 grid md:grid-cols-2 gap-4">
                <InputGroup label="Tekst linku (Wszystkie opinie)">
                  <StyledInput {...register("reviews.allReviewsLink")} />
                </InputGroup>
                <InputGroup label="Adres URL (ZnanyLekarz)">
                  <StyledInput {...register("reviews.allReviewsHref")} />
                </InputGroup>
              </div>
            </div>
          </FormCard>
        </div>

        {/* ========================================================= */}
        {/* SEKCJA 3: PRZYGOTOWANIE */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <ClipboardList className="text-[#0c493e]" />
            <h3 className="text-lg font-bold text-gray-800">
              3. Przygotowanie do wizyty
            </h3>
          </div>

          <FormCard title="Kroki przygotowania" icon={ClipboardList}>
            <div className="grid gap-6">
              <div className="grid md:grid-cols-3 gap-4">
                <InputGroup label="Badge">
                  <StyledInput {...register("preparation.badge")} />
                </InputGroup>
                <div className="md:col-span-2">
                  <InputGroup label="Tytuł Sekcji">
                    <StyledInput {...register("preparation.title")} />
                  </InputGroup>
                </div>
              </div>
              <InputGroup label="Opis">
                <StyledInput {...register("preparation.description")} />
              </InputGroup>

              {/* KROKI */}
              <div className="space-y-4">
                {prepStepsFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-gray-50 rounded border border-gray-200 relative group"
                  >
                    <div className="grid md:grid-cols-12 gap-4">
                      <div className="md:col-span-2">
                        <InputGroup label="Nr (np. 01)">
                          <StyledInput
                            {...register(`preparation.steps.${index}.step`)}
                            className="text-center font-mono"
                          />
                        </InputGroup>
                      </div>
                      <div className="md:col-span-3">
                        <InputGroup label="Ikona">
                          <StyledInput
                            {...register(`preparation.steps.${index}.icon`)}
                            placeholder="np. FileText"
                          />
                        </InputGroup>
                      </div>
                      <div className="md:col-span-7">
                        <InputGroup label="Tytuł">
                          <StyledInput
                            {...register(`preparation.steps.${index}.title`)}
                            className="font-bold"
                          />
                        </InputGroup>
                      </div>
                      <div className="md:col-span-12">
                        <InputGroup label="Opis kroku">
                          <StyledInput
                            {...register(`preparation.steps.${index}.desc`)}
                          />
                        </InputGroup>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePrepStep(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    appendPrepStep({
                      icon: "Circle",
                      step: "04",
                      title: "",
                      desc: "",
                    })
                  }
                  className="w-full py-2 border-2 border-dashed border-gray-200 rounded text-gray-500 hover:border-[#0c493e] hover:text-[#0c493e] flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={16} /> Dodaj kolejny krok
                </button>
              </div>
            </div>
          </FormCard>
        </div>

        {/* ========================================================= */}
        {/* SEKCJA 4: FAQ */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <HelpCircle className="text-[#0c493e]" />
            <h3 className="text-lg font-bold text-gray-800">
              4. Pytania i Odpowiedzi (FAQ)
            </h3>
          </div>

          <FormCard title="Lista Pytań" icon={HelpCircle}>
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <InputGroup label="Badge">
                  <StyledInput {...register("faq.badge")} />
                </InputGroup>
                <InputGroup label="Tytuł Sekcji">
                  <StyledInput {...register("faq.title")} />
                </InputGroup>
              </div>

              <div className="space-y-3">
                {faqFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-gray-50 rounded border border-gray-200 flex gap-4 items-start group"
                  >
                    <span className="text-gray-400 font-mono text-xs mt-3">
                      #{index + 1}
                    </span>
                    <div className="flex-1 space-y-3">
                      <InputGroup label="Pytanie">
                        <StyledInput
                          {...register(`faq.items.${index}.question`)}
                          className="font-medium"
                        />
                      </InputGroup>
                      <InputGroup label="Odpowiedź">
                        <StyledTextarea
                          {...register(`faq.items.${index}.answer`)}
                          className="h-20"
                        />
                      </InputGroup>
                      {/* Ukryte ID dla spójności */}
                      <input
                        type="hidden"
                        {...register(`faq.items.${index}.id`)}
                        value={index + 1}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="text-gray-400 hover:text-red-500 mt-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    appendFaq({
                      id: faqFields.length + 1,
                      question: "",
                      answer: "",
                    })
                  }
                  className="w-full py-2 border-2 border-dashed border-gray-200 rounded text-gray-500 hover:border-[#0c493e] hover:text-[#0c493e] flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={16} /> Dodaj pytanie
                </button>
              </div>
            </div>
          </FormCard>
        </div>
      </div>
    </form>
  );
}
