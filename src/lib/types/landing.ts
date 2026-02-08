export interface HeroData {
  // ZMIANA: Zamiast obiektu {prefix, suffix...}, mamy prosty string + osobne pole na highlight
  headline: string; // np. "Od Teorii Do Diagnozy Fizjoterapia Bez Domysłów"
  highlight: string; // np. "Fizjoterapia"

  description: string;
  buttons: {
    primary: { label: string };
    secondary: { label: string };
  };
  socialProof: {
    stats: {
      count: string;
      labelLine1: string;
      labelLine2: string;
    };
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface EbookFeaturesData {
  headline: string;
  highlight: string;
  description: string;

  // USUNIĘTO image całkowicie (src i alt są w kodzie)

  button: {
    label: string;
    // url jest w kodzie
  };

  faq: {
    title: string;
    items: FaqItem[];
  };
}
export interface FeatureItem {
  title: string;
  description: string;
}

export interface TransformationItem {
  // id nie musi być w bazie jako osobne pole edytowalne,
  // ale formularz go potrzebuje do kluczy
  id: string;
  problemTitle: string;
  problemDesc: string;
  solution: string;
}

export interface ContentPreviewData {
  // Upraszczamy nagłówek do jednego stringa + highlight (tak jak w Hero/Ebook)
  headline: string;
  highlight: string;

  description: string;

  checklist: string[]; // Lista punktów (zrobimy to jako dynamiczne pola)

  features: FeatureItem[];

  transformation: TransformationItem[];
}
// ... ContentPreviewData ...

// src/lib/types/landing.ts

export interface ReviewItem {
  id: number;
  name: string;
  role: string;
  headline: string;
  text: string;
  rating: number;
  // avatarUrl opcjonalnie, jeśli kiedyś dodasz
}

export interface TestimonialsData {
  // Nowy format nagłówka
  headline: string;
  highlight: string;

  // Lista opinii (nieedytowalna przez ten formularz, ale potrzebna do wyświetlania)
  reviews: ReviewItem[];
}

export interface SecurePanelData {
  headline: string;
  highlight: string;
  description: string;

  // image USUNIĘTE (jest w kodzie)

  features: Array<{
    title: string;
    description: string;
  }>;

  button: {
    label: string;
    // url USUNIĘTE (jest w kodzie)
  };
}
// ... SecurePanelData ...

export interface AboutData {
  // Zmieniamy strukturę nagłówka na płaską, tak jak w Hero/SecurePanel
  headline: string;
  highlight: string;
  description: string;

  // image USUNIĘTE (jest w kodzie)

  cards: Array<{
    title: string;
    description: string;
  }>;
}
// ... AboutData ...
export interface AuthPageData {
  // Prawa kolumna (Zielona sekcja) - EDYTOWALNA
  heroHeadline: string;
  heroHighlight: string;
  heroDescription: string;
  badgeText: string;
}
export interface PracticalTrainingData {
  headline: string;
  highlight: string;
  description: string;

  // image USUNIĘTE (jest w kodzie)

  badge: {
    count: string;
    label: string;
  };

  features: Array<{
    title: string;
    description: string;
  }>;

  button: {
    label: string;
    // url USUNIĘTE (jest w kodzie)
  };
}
export interface LandingPageData {
  hero: HeroData;
  ebookFeatures: EbookFeaturesData;
  contentPreview: ContentPreviewData;
  testimonials: TestimonialsData;
  securePanel: SecurePanelData;
  practicalTraining: PracticalTrainingData;
  about: AboutData;
  authPage: AuthPageData; // <--- NOWOŚĆ
}
