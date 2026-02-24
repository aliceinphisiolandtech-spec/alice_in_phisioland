import {
  // Landing Page
  HeroSectionData,
  EbookFeaturesSectionData,
  ContentPreviewSectionData,
  TestimonialsSectionData,
  SecurePanelSectionData,
  AboutSectionData,
  PracticalTrainingSectionData,
  AuthPageData,
  // Strefa Pacjenta
  PatientHeroData,
  PatientReviewsData,
  PatientPreparationData,
  PatientFaqData,
  FaqItem,
} from "@/lib/validators/landing";

// =========================================================
// 1. RE-EKSPORTY (Żeby inne pliki mogły importować stąd)
// =========================================================
export type {
  HeroSectionData,
  EbookFeaturesSectionData,
  ContentPreviewSectionData,
  TestimonialsSectionData,
  SecurePanelSectionData,
  AboutSectionData,
  PracticalTrainingSectionData,
  AuthPageData,
  PatientHeroData,
  PatientReviewsData,
  PatientPreparationData,
  PatientFaqData,
  FaqItem,
};

// =========================================================
// 2. ALIASY (Dla kompatybilności z Twoimi formularzami)
// =========================================================
// Dzięki temu nie musisz zmieniać 'HeroData' na 'HeroSectionData' w HeroForm.tsx
export type HeroData = HeroSectionData;
export type EbookFeaturesData = EbookFeaturesSectionData;
export type ContentPreviewData = ContentPreviewSectionData;
export type TestimonialsData = TestimonialsSectionData;
export type SecurePanelData = SecurePanelSectionData;
export type AboutData = AboutSectionData;
export type PracticalTrainingData = PracticalTrainingSectionData;
// AuthPageData i typy pacjenta nie potrzebują aliasów, bo używamy ich oryginalnych nazw

// =========================================================
// 3. GŁÓWNY INTERFEJS DANYCH
// =========================================================
export interface LandingPageData {
  // --- SEKCJE LANDING PAGE ---
  hero: HeroSectionData;
  ebookFeatures: EbookFeaturesSectionData;
  contentPreview: ContentPreviewSectionData;
  testimonials: TestimonialsSectionData;
  securePanel: SecurePanelSectionData;
  about: AboutSectionData;
  practicalTraining: PracticalTrainingSectionData;
  authPage: AuthPageData;

  // --- SEKCJE STREFY PACJENTA ---
  patientHero: PatientHeroData;
  patientReviews: PatientReviewsData;
  patientPreparation: PatientPreparationData;
  patientFaq: PatientFaqData;
}
