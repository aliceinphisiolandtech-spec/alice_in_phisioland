"use client";

import { useState } from "react";
import {
  LayoutTemplate,
  BookOpen,
  FileText,
  MessageSquareQuote,
  ShieldCheck,
  User,
  GraduationCap,
  Lock,
  Stethoscope,
  FilePenLine,
  ListOrdered,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { PageHeader } from "@/components/admin/ui/PageHeader";

// ZMIANA 1: Importujemy LandingPageData z globalnych typów, a nie z page.tsx
import { LandingPageData } from "@/lib/types/landing";

import { HeroForm } from "./forms/HeroForm";
import { EbookFeaturesForm } from "./forms/EbookFeaturesForm";
import { ContentPreviewForm } from "./forms/ContentPreviewForm";
import { TestimonialsForm } from "./forms/TestimonialsForm";
import { SecurePanelForm } from "./forms/SecurePanelForm";
import { AboutForm } from "./forms/AboutForm";
import { PracticalTrainingForm } from "./forms/PracticalTrainingForm";
import { AuthPageForm } from "./forms/AuthPageForm";
import { PatientZoneForm } from "./forms/PatientZoneForm";
import { TableOfContentsForm } from "./forms/TableOfContentsForm";

// ZMIANA 2: Używamy poprawnego typu w Propsach
interface CmsFormsProps {
  initialData: LandingPageData;
}

const TABS = [
  { id: "hero", label: "Hero", icon: LayoutTemplate },
  { id: "ebookFeatures", label: "Cechy E-booka", icon: BookOpen },
  { id: "contentPreview", label: "Co jest w środku?", icon: FileText },
  { id: "tableOfContents", label: "Spis treści", icon: ListOrdered },
  { id: "testimonials", label: "Opinie", icon: MessageSquareQuote },
  { id: "securePanel", label: "Bezpieczeństwo", icon: ShieldCheck },
  { id: "practicalTraining", label: "Szkolenie", icon: GraduationCap },
  { id: "about", label: "O mnie", icon: User },
  { id: "authPage", label: "Logowanie", icon: Lock },
  { id: "patientZone", label: "Strefa Pacjenta", icon: Stethoscope },
];

export default function CmsForms({ initialData }: CmsFormsProps) {
  const [activeTab, setActiveTab] = useState("hero");

  const renderContent = () => {
    switch (activeTab) {
      case "hero":
        return <HeroForm data={initialData.hero} />;
      case "practicalTraining":
        return <PracticalTrainingForm data={initialData.practicalTraining} />;
      case "ebookFeatures":
        return <EbookFeaturesForm data={initialData.ebookFeatures} />;
      case "contentPreview":
        return <ContentPreviewForm data={initialData.contentPreview} />;
      case "testimonials":
        return <TestimonialsForm data={initialData.testimonials} />;
      case "securePanel":
        return <SecurePanelForm data={initialData.securePanel} />;
      case "about":
        return <AboutForm data={initialData.about} />;
      case "authPage":
        return <AuthPageForm data={initialData.authPage} />;
      case "tableOfContents":
        return <TableOfContentsForm data={initialData.tableOfContents} />;
      case "patientZone":
        // Przekazujemy zbiorczy obiekt data
        return (
          <PatientZoneForm
            data={{
              hero: initialData.patientHero,
              reviews: initialData.patientReviews,
              preparation: initialData.patientPreparation,
              faq: initialData.patientFaq,
            }}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-gray-500">
            Wybierz zakładkę z menu po lewej stronie.
          </div>
        );
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1200px]">
      <PageHeader
        icon={<FilePenLine size={24} />}
        eyebrow="Treści"
        title="Treści strony"
        description="Edytuj teksty sekcji strony głównej, logowania i strefy pacjenta."
      />

      {/* TABS — aktywna „pigułka” przesuwa się między zakładkami (layoutId). */}
      <div className="sticky top-[88px] z-30 mb-8 overflow-x-auto rounded-2xl border border-gray-200/70 bg-white/80 p-1.5 shadow-sm backdrop-blur-xl scrollbar-hide max-[980px]:top-[84px]">
        <div className="flex min-w-max gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isActive}
                className={cn(
                  "relative flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors duration-200",
                  isActive
                    ? "text-white"
                    : "text-gray-500 hover:bg-gray-100/80 hover:text-[#0c493e]",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="cms-tab-active"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    className="absolute inset-0 rounded-xl bg-[#0c493e] shadow-[0_8px_20px_-10px_rgba(12,73,62,0.8)]"
                  />
                )}
                <tab.icon size={16} className="relative" />
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FORM AREA — płynne przejście między sekcjami. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
