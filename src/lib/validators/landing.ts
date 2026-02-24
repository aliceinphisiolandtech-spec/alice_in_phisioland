import { z } from "zod";

// =========================================================
// 1. SCHEMATY WALIDACJI (ZOD)
// =========================================================

// --- HERO ---
export const heroSchema = z.object({
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

// --- EBOOK FEATURES ---
const faqItemSchema = z.object({
  question: z.string().min(1, "Pytanie jest wymagane"),
  answer: z.string().min(1, "Odpowiedź jest wymagana"),
});
export type FaqItem = z.infer<typeof faqItemSchema>;
export const ebookFeaturesSchema = z.object({
  headline: z.string().min(1, "Nagłówek jest wymagany"),
  highlight: z.string().optional(),
  description: z.string().min(1, "Opis jest wymagany"),
  button: z.object({
    label: z.string().min(1, "Etykieta przycisku jest wymagana"),
  }),
  faq: z.object({
    title: z.string().min(1, "Tytuł sekcji FAQ jest wymagany"),
    items: z.array(faqItemSchema),
  }),
});

// --- CONTENT PREVIEW ---
const featureItemSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().min(1, "Opis jest wymagany"),
});

const transformationItemSchema = z.object({
  id: z.string().optional(),
  problemTitle: z.string().min(1, "Tytuł problemu jest wymagany"),
  problemDesc: z.string().min(1, "Opis problemu jest wymagany"),
  solution: z.string().min(1, "Rozwiązanie jest wymagane"),
});

export const contentPreviewSchema = z.object({
  id: z.string().optional(),
  headline: z.string().min(1, "Nagłówek jest wymagany"),
  highlight: z.string().optional(),
  description: z.string().min(1, "Opis jest wymagany"),
  checklist: z
    .array(
      z.object({
        text: z.string().min(1, "Treść punktu jest wymagana"),
      }),
    )
    .max(6, "Maksymalnie 6 punktów"),

  features: z.array(featureItemSchema),
  transformation: z.array(transformationItemSchema),
});

// --- TESTIMONIALS ---
const testimonialItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Imię jest wymagane"),
  role: z.string().optional(),
  rating: z.number().default(5),
  headline: z.string().optional(),
  text: z.string().min(1, "Treść jest wymagana"),
});

export const testimonialsSchema = z.object({
  headline: z.string(),
  highlight: z.string().optional(),
  reviews: z.array(testimonialItemSchema), // To pole jest kluczowe!
});

// --- SECURE PANEL ---
const secureFeatureSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().min(1, "Opis jest wymagany"),
});

export const securePanelSchema = z.object({
  headline: z.string().min(1, "Nagłówek jest wymagany"),
  highlight: z.string().optional(),
  description: z.string().min(1, "Opis jest wymagany"),
  features: z.array(secureFeatureSchema).max(4, "Maksymalnie 4 funkcje"),
  button: z.object({
    label: z.string().min(1, "Etykieta przycisku jest wymagana"),
  }),
});

// --- ABOUT ---
const aboutCardSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().min(1, "Opis jest wymagany"),
});

export const aboutSchema = z.object({
  headline: z.string().min(1, "Nagłówek jest wymagany"),
  highlight: z.string().optional(),
  description: z.string().min(1, "Opis jest wymagany"),
  cards: z.array(aboutCardSchema).max(3, "Maksymalnie 3 karty"),
});

// --- PRACTICAL TRAINING ---
const practicalFeatureSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().min(1, "Opis jest wymagany"),
});

export const practicalTrainingSchema = z.object({
  headline: z.string().min(1, "Nagłówek jest wymagany"),
  highlight: z.string().optional(),
  description: z.string().min(1, "Opis jest wymagany"),
  badge: z.object({
    count: z.string().min(1, "Liczba jest wymagana (np. 1500+)"),
    label: z.string().min(1, "Etykieta jest wymagana"),
  }),
  features: z.array(practicalFeatureSchema).max(2, "Maksymalnie 2 cechy"),
  button: z.object({
    label: z.string().min(1, "Etykieta przycisku jest wymagana"),
  }),
});

// --- AUTH PAGE ---
export const authPageSchema = z.object({
  heroHeadline: z.string().min(1, "Główny nagłówek jest wymagany"),
  heroHighlight: z.string().optional(),
  heroDescription: z.string().min(1, "Główny opis jest wymagany"),
  badgeText: z.string().min(1, "Tekst badge'a jest wymagany"),
});

// --- PATIENT HERO ---
const heroFeatureSchema = z.object({
  // Usuwamy 'icon', bo jest na sztywno w kodzie
  title: z.string().min(1, "Tytuł kafelka jest wymagany"),
  desc: z.string().min(1, "Opis kafelka jest wymagany"),
});

export const patientHeroSchema = z.object({
  badge: z.string().min(1, "Badge jest wymagany"),
  title: z.string().min(1, "Tytuł główny jest wymagany"),
  description: z.string().min(1, "Opis jest wymagany"),

  // Wymuszamy tablicę, ale formularz będzie wyświetlał fixed listę
  features: z.array(heroFeatureSchema),

  // Usuwamy 'cta' i 'stats' - nie są edytowalne
});

// --- PATIENT REVIEWS ---
const reviewItemSchema = z.object({
  name: z.string().min(1, "Imię jest wymagane"),
  text: z.string().min(1, "Treść opinii jest wymagana"),
});

export const patientReviewsSchema = z.object({
  sectionTitle: z.string().min(1, "Tytuł sekcji jest wymagany"),
  sectionSubtitle: z.string().min(1, "Podtytuł sekcji jest wymagany"),
  widgetTitleMobile: z.string().min(1, "Tytuł mobilny jest wymagany"),
  reviews: z.array(reviewItemSchema).min(1, "Dodaj przynajmniej jedną opinię"),
  allReviewsLink: z
    .string()
    .min(1, "Tekst linku do wszystkich opinii jest wymagany"),
  allReviewsHref: z.string().min(1, "URL do wszystkich opinii jest wymagany"),
});

// --- PATIENT PREPARATION ---
const preparationStepSchema = z.object({
  icon: z.string().min(1, "Nazwa ikony jest wymagana"),
  step: z.string().min(1, "Numer kroku jest wymagany"),
  title: z.string().min(1, "Tytuł kroku jest wymagany"),
  desc: z.string().min(1, "Opis kroku jest wymagany"),
});

export const patientPreparationSchema = z.object({
  badge: z.string().min(1, "Badge jest wymagany"),
  title: z.string().min(1, "Tytuł sekcji jest wymagany"),
  description: z.string().min(1, "Opis sekcji jest wymagany"),
  steps: z.array(preparationStepSchema).min(1, "Dodaj przynajmniej jeden krok"),
});

// --- PATIENT FAQ ---
const faqQuestionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  question: z.string().min(1, "Pytanie jest wymagane"),
  answer: z.string().min(1, "Odpowiedź jest wymagana"),
});

export const patientFaqSchema = z.object({
  badge: z.string().min(1, "Badge jest wymagany"),
  title: z.string().min(1, "Tytuł sekcji jest wymagany"),
  items: z.array(faqQuestionSchema).min(1, "Dodaj przynajmniej jedno pytanie"),
});

// =========================================================
// 2. REJESTR GŁÓWNY SCHEMATÓW (DO API)
// =========================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SECTION_SCHEMAS: Record<string, z.ZodType<any>> = {
  hero: heroSchema,
  ebookFeatures: ebookFeaturesSchema,
  contentPreview: contentPreviewSchema,
  testimonials: testimonialsSchema,
  securePanel: securePanelSchema,
  about: aboutSchema,
  practicalTraining: practicalTrainingSchema,
  authPage: authPageSchema,
  patientHero: patientHeroSchema,
  patientReviews: patientReviewsSchema,
  patientPreparation: patientPreparationSchema,
  patientFaq: patientFaqSchema,
};

// =========================================================
// 3. GENEROWANIE I EKSPORT TYPÓW (z.infer)
// =========================================================

// Stare sekcje
export type HeroSectionData = z.infer<typeof heroSchema>;
export type EbookFeaturesSectionData = z.infer<typeof ebookFeaturesSchema>;
export type ContentPreviewSectionData = z.infer<typeof contentPreviewSchema>;
export type TestimonialsSectionData = z.infer<typeof testimonialsSchema>;
export type SecurePanelSectionData = z.infer<typeof securePanelSchema>;
export type AboutSectionData = z.infer<typeof aboutSchema>;
export type PracticalTrainingSectionData = z.infer<
  typeof practicalTrainingSchema
>;
export type AuthPageData = z.infer<typeof authPageSchema>;

// Nowe sekcje (Strefa Pacjenta)
export type PatientHeroData = z.infer<typeof patientHeroSchema>;
export type PatientReviewsData = z.infer<typeof patientReviewsSchema>;
export type PatientPreparationData = z.infer<typeof patientPreparationSchema>;
export type PatientFaqData = z.infer<typeof patientFaqSchema>;
