/* eslint-disable @typescript-eslint/no-explicit-any */
import CmsForms from "@/components/admin/cms/CmsForms";
import { prisma } from "@/lib/prisma";

// Importujemy typy
import { LandingPageData, AuthPageData } from "@/lib/types/landing";

// --- DEFINICJA DANYCH DOMYŚLNYCH (FALLBACK) ---
// Służy jako zabezpieczenie, gdy w bazie danych nie ma jeszcze żadnych wpisów.
const FALLBACK_DATA: LandingPageData = {
  hero: {
    title: "Witaj w świecie fizjoterapii",
    subtitle: "Odkryj nowoczesne podejście do rehabilitacji",
    description: "Kompleksowa wiedza i praktyka w jednym miejscu.",
    ctaText: "Rozpocznij naukę",
    ctaLink: "/kursy",
    // Dodaj inne pola wymagane przez HeroData, jeśli są
  } as any,
  ebookFeatures: {
    title: "Co znajdziesz w e-booku?",
    features: ["Praktyczne porady", "Case study", "Najnowsze badania"],
  } as any,
  contentPreview: {
    title: "Zajrzyj do środka",
    description: "Zobacz przykładowe strony naszych materiałów.",
    images: [],
  } as any,
  testimonials: {
    title: "Co mówią nasi kursanci?",
    items: [],
  } as any,
  securePanel: {
    title: "Bezpieczny panel kursanta",
    description: "Dostęp do materiałów 24/7 z każdego urządzenia.",
    features: ["Szyfrowane połączenie", "Dostęp mobilny"],
  } as any,
  about: {
    title: "O mnie",
    description:
      "Cześć, jestem Alicja. Pomagam fizjoterapeutom rozwijać skrzydła.",
    image: "",
  } as any,
  practicalTraining: {
    title: "Szkolenia praktyczne",
    description: "Dołącz do warsztatów stacjonarnych.",
    benefits: [],
  } as any,
  authPage: {
    heroHeadline: "Witaj w Świecie",
    heroHighlight: "Rzetelnej Fizjoterapii",
    heroDescription: "Zaloguj się, aby uzyskać dostęp do swoich kursów.",
    badgeText: "Dołącz do nas!",
  },
};

// --- POBIERANIE DANYCH ---
async function getLandingData(): Promise<LandingPageData> {
  const sections = await prisma.section.findMany();

  // Zamieniamy tablicę z bazy na obiekt { klucz: treść }
  const dbContent = sections.reduce(
    (acc, section) => {
      acc[section.key] = section.content;
      return acc;
    },
    {} as Record<string, any>,
  );

  // Składamy obiekt końcowy.
  // Logika: Jeśli w bazie jest treść (dbContent.hero), użyj jej.
  // Jeśli nie ma (jest null/undefined), użyj FALLBACK_DATA.hero.
  return {
    hero: (dbContent.hero as any) || FALLBACK_DATA.hero,
    ebookFeatures:
      (dbContent.ebookFeatures as any) || FALLBACK_DATA.ebookFeatures,
    contentPreview:
      (dbContent.contentPreview as any) || FALLBACK_DATA.contentPreview,
    testimonials: (dbContent.testimonials as any) || FALLBACK_DATA.testimonials,
    securePanel: (dbContent.securePanel as any) || FALLBACK_DATA.securePanel,
    about: (dbContent.about as any) || FALLBACK_DATA.about,
    practicalTraining:
      (dbContent.practicalTraining as any) || FALLBACK_DATA.practicalTraining,
    authPage: (dbContent.authPage as any) || FALLBACK_DATA.authPage,
  };
}

export default async function CmsPageContainer() {
  const landingData = await getLandingData();

  return <CmsForms initialData={landingData} />;
}
