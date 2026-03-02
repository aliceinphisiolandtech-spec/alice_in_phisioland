"use client";

import { useEffect } from "react";
import { markChapterAsReadAction } from "@/app/actions/progress";

interface ProgressTrackerProps {
  slug: string;
}

export const ProgressTracker = ({ slug }: ProgressTrackerProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      markChapterAsReadAction(slug).then((result) => {
        if (result.error) console.error(result.error);
      });
    }, 3000);

    return () => clearTimeout(timer); // Czyścimy timer jak user wyjdzie szybko
  }, [slug]);

  return null; // Ten komponent jest niewidoczny
};
