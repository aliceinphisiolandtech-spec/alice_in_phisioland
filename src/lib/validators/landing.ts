import { z } from "zod";

// --- 1. HERO (Specyficzny - formularz wysyła płaski tekst) ---
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

// --- 2. EBOOK FEATURES ---
const faqItemSchema = z.object({
  question: z.string().min(1, "Pytanie jest wymagane"),
  answer: z.string().min(1, "Odpowiedź jest wymagana"),
});

export const ebookFeaturesSchema = z.object({
  headline: z.string().min(1, "Nagłówek jest wymagany"),
  highlight: z.string().optional(),
  description: z.string().min(1, "Opis jest wymagany"),

  // USUNIĘTO image

  button: z.object({
    label: z.string().min(1, "Etykieta przycisku jest wymagana"),
  }),

  faq: z.object({
    title: z.string().min(1, "Tytuł sekcji FAQ jest wymagany"),
    items: z.array(faqItemSchema),
  }),
});
// --- 3. CONTENT PREVIEW ---
const featureItemSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().min(1, "Opis jest wymagany"),
});

const transformationItemSchema = z.object({
  // id generujemy automatycznie przy dodawaniu, nie musi być walidowane jako input usera
  problemTitle: z.string().min(1, "Tytuł problemu jest wymagany"),
  problemDesc: z.string().min(1, "Opis problemu jest wymagany"),
  solution: z.string().min(1, "Rozwiązanie jest wymagane"),
});

export const contentPreviewSchema = z.object({
  headline: z.string().min(1, "Nagłówek jest wymagany"),
  highlight: z.string().optional(),
  description: z.string().min(1, "Opis jest wymagany"),

  // Checklist to tablica stringów
  checklist: z.array(
    z.object({
      text: z.string().min(1, "Punkt listy nie może być pusty"),
    }),
  ),

  features: z.array(featureItemSchema),

  transformation: z.array(transformationItemSchema),
});
// --- 4. TESTIMONIALS ---
const testimonialItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: z.string(),
  rating: z.number(),
  headline: z.string(),
  text: z.string(),
});

export const testimonialsSchema = z.object({
  headline: z.string().min(1, "Nagłówek jest wymagany"),
  highlight: z.string().optional(),
});

// --- 5. SECURE PANEL ---
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
// --- 6. ABOUT ---
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

// --- 7. PRACTICAL TRAINING ---
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
export const authPageSchema = z.object({
  heroHeadline: z.string().min(1, "Główny nagłówek jest wymagany"),
  heroHighlight: z.string().optional(),
  heroDescription: z.string().min(1, "Główny opis jest wymagany"),
  badgeText: z.string().min(1, "Tekst badge'a jest wymagany"),
});

// --- REJESTR GŁÓWNY ---
// To mapuje klucz z URL (np. 'hero') na odpowiedni schemat
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
};
