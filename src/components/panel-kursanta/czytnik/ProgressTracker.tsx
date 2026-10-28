"use client";

import { useEffect } from "react";
import { markChapterAsReadAction } from "@/app/actions/progress";
import { queuePendingProgress } from "@/lib/offline";

interface ProgressTrackerProps {
  slug: string;
}

export const ProgressTracker = ({ slug }: ProgressTrackerProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Offline (zapisany rozdział) zapis do bazy się nie uda — odkładamy go,
      // a OfflineSupport wyśle go po powrocie sieci.
      if (!navigator.onLine) {
        queuePendingProgress(slug);
        return;
      }

      markChapterAsReadAction(slug)
        .then((result) => {
          if (result.error) console.error(result.error);
        })
        .catch(() => queuePendingProgress(slug));
    }, 3000);

    return () => clearTimeout(timer); // Czyścimy timer jak user wyjdzie szybko
  }, [slug]);

  return null; // Ten komponent jest niewidoczny
};
