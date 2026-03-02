"use client";

import { motion } from "framer-motion";
import { WelcomeHeader } from "./WelcomeHeader";
import { CourseProgressCard } from "./CourseProgressCard";
import { DocumentsSection } from "./DocumentsSection";
import { PromoBanner } from "./PromoBanner";
import { NewsSection } from "./NewsSection";

interface DashboardClientProps {
  userName: string;
  hasAccess: boolean;
  progressPercent: number;
  lastChapterSlug: string | null;
  hasReviewed: boolean;
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
  hasReviewed,
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
        hasReviewed={hasReviewed}
      />

      <DocumentsSection hasAccess={hasAccess} />

      <div className="flex flex-col gap-6">
        <PromoBanner />
        <NewsSection />
      </div>
    </motion.div>
  );
}
