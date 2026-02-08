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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

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

// ZMIANA 2: Używamy poprawnego typu w Propsach
interface CmsFormsProps {
  initialData: LandingPageData;
}

const TABS = [
  { id: "hero", label: "Hero", icon: LayoutTemplate },
  { id: "ebookFeatures", label: "Cechy E-booka", icon: BookOpen },
  { id: "contentPreview", label: "Co jest w środku?", icon: FileText },
  { id: "testimonials", label: "Opinie", icon: MessageSquareQuote },
  { id: "securePanel", label: "Bezpieczeństwo", icon: ShieldCheck },
  { id: "practicalTraining", label: "Szkolenie", icon: GraduationCap },
  { id: "about", label: "O mnie", icon: User },
  { id: "authPage", label: "Logowanie", icon: Lock },
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
        // Teraz TypeScript nie zgłosi błędu, bo LandingPageData zawiera authPage
        return <AuthPageForm data={initialData.authPage} />;
      default:
        return (
          <div className="p-8 text-center text-gray-500">
            Wybierz zakładkę z menu po lewej stronie.
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto min-h-screen">
      {/* TABS */}
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-full cursor-pointer text-[13px] font-medium transition-all duration-200 border",
                activeTab === tab.id
                  ? "bg-[#0c493e] text-white border-[#0c493e]"
                  : "bg-white text-gray-600 hover:bg-gray-50",
              )}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* FORM AREA */}
      <div className="">{renderContent()}</div>
    </div>
  );
}
