/* eslint-disable @typescript-eslint/no-explicit-any */
import CmsForms from "@/components/admin/cms/CmsForms";
import { prisma } from "@/lib/prisma";

// Importujemy typy (Upewnij się, że zaktualizowałeś ten plik o nowe typy PatientZone!)
import { LandingPageData } from "@/lib/types/landing";

// --- DEFINICJA DANYCH DOMYŚLNYCH (FALLBACK) ---
const FALLBACK_DATA: LandingPageData = {
  // --- ISTNIEJĄCE SEKCJE ---
  hero: {
    title: "Witaj w świecie fizjoterapii",
    subtitle: "Odkryj nowoczesne podejście do rehabilitacji",
    description: "Kompleksowa wiedza i praktyka w jednym miejscu.",
    ctaText: "Rozpocznij naukę",
    ctaLink: "/kursy",
  } as any,
  ebookFeatures: {
    title: "Co znajdziesz w e-booku?",
    features: ["Praktyczne porady", "Case study", "Najnowsze badania"],
  } as any,
  contentPreview: {
    title: "Zajrzyj do środka",
    description: "Zobacz przykładowe strony naszych materiałów.",
    images: [],
    checklist: [],
    transformation: [],
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
    description: "Cześć, jestem Alicja...",
    cards: [],
  } as any,
  practicalTraining: {
    title: "Szkolenia praktyczne",
    description: "Dołącz do warsztatów stacjonarnych.",
    features: [],
    badge: { count: "1500+", label: "Przeszkolonych" },
    button: { label: "Zapisz się" },
  } as any,
  authPage: {
    heroHeadline: "Witaj w Świecie",
    heroHighlight: "Rzetelnej Fizjoterapii",
    heroDescription: "Zaloguj się, aby uzyskać dostęp do swoich kursów.",
    badgeText: "Dołącz do nas!",
  },

  // --- NOWE SEKCJE: STREFA PACJENTA ---
  patientHero: {
    badge: "Strefa Pacjenta",
    title: "Tytuł domyślny",
    description: "Opis domyślny sekcji pacjenta",
    features: [
      { title: "Diagnostyka", desc: "Opis diagnostyki" },
      { title: "Terapia", desc: "Opis terapii" },
      { title: "Edukacja", desc: "Opis edukacji" },
    ],
    // cta i stats USUNIĘTE
  } as any,
  patientReviews: {
    sectionTitle: "Co mówią pacjenci?",
    sectionSubtitle: "Opinie z portalu",
    widgetTitleMobile: "Umów wizytę",
    reviews: [{ name: "Jan", text: "Polecam!" }],
    allReviewsLink: "Zobacz więcej",
    allReviewsHref: "#",
  } as any,
  patientPreparation: {
    badge: "Komfort",
    title: "Przygotowanie",
    description: "Jak się przygotować?",
    steps: [
      { icon: "FileText", step: "01", title: "Dokumenty", desc: "Weź dowód" },
    ],
  } as any,
  patientFaq: {
    badge: "FAQ",
    title: "Pytania",
    items: [{ id: 1, question: "Pytanie?", answer: "Odpowiedź." }],
  } as any,
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

    // Nowe sekcje
    patientHero: (dbContent.patientHero as any) || FALLBACK_DATA.patientHero,
    patientReviews:
      (dbContent.patientReviews as any) || FALLBACK_DATA.patientReviews,
    patientPreparation:
      (dbContent.patientPreparation as any) || FALLBACK_DATA.patientPreparation,
    patientFaq: (dbContent.patientFaq as any) || FALLBACK_DATA.patientFaq,
  };
}

export default async function CmsPageContainer() {
  const landingData = await getLandingData();

  return <CmsForms initialData={landingData} />;
}
