"use client";

import { motion } from "framer-motion";
import { WelcomeHeader } from "./WelcomeHeader";
import { CourseProgressCard } from "./CourseProgressCard";
import { DocumentsSection } from "./DocumentsSection";
import { PromoBanner } from "./PromoBanner";
import { NewsSection } from "./NewsSection";
import { News } from "@/generated/prisma";

interface DashboardClientProps {
  userName: string;
  hasAccess: boolean;
  progressPercent: number;
  lastChapterSlug: string | null;
  // ZMIANA: Zamiast hasReviewed przyjmujemy obiekt opinii (lub null)
  existingReview: {
    rating: number;
    headline: string;
    text: string;
    role: string;
  } | null;
  latestNews: News[];
  hasInvoice: boolean;
  /** Kwota w przycisku „Kup za…" (grosze). null, gdy dostęp już jest. */
  checkoutPriceGrosze: number | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

export default function DashboardClient({
  userName,
  hasAccess,
  progressPercent,
  lastChapterSlug,
  existingReview, // <-- ZMIANA
  latestNews,
  hasInvoice,
  checkoutPriceGrosze,
}: DashboardClientProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-24 flex flex-col gap-8 pt-8 px-4 md:px-12 max-w-7xl mx-auto w-full"
    >
      <WelcomeHeader userName={userName} />

      <CourseProgressCard
        hasAccess={hasAccess}
        progressPercent={progressPercent}
        lastChapterSlug={lastChapterSlug}
        existingReview={existingReview} // <-- ZMIANA: przekazujemy cały obiekt do karty
        checkoutPriceGrosze={checkoutPriceGrosze}
      />

      <DocumentsSection hasAccess={hasAccess} hasInvoice={hasInvoice} />

      <div className="flex flex-col gap-6">
        <PromoBanner />
        <NewsSection news={latestNews} />
      </div>
    </motion.div>
  );
}
