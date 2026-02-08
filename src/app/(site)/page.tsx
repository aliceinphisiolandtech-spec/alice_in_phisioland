import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { About } from "@/features/landing-page/components/About";
import { ContactFooter } from "@/features/landing-page/components/ContactFooter";
import { ContentPreview } from "@/features/landing-page/components/ContentPreview";
import { EbookFeatures } from "@/features/landing-page/components/EbookFeatures";
import { Hero } from "@/features/landing-page/components/Hero";
import { PracticalTraining } from "@/features/landing-page/components/PracticalTraining";
import { SecurePanel } from "@/features/landing-page/components/SecurePanel";
import { Testimonials } from "@/features/landing-page/components/Testimonials";

import { prisma } from "@/lib/prisma";
import { ComingSoonToaster } from "@/features/landing-page/components/CommingSoonToaster";
import { Navbar } from "@/components/common/Navbar";

// Helper do pobrania danych
async function getLandingData() {
  // 1. Pobieramy sekcje z bazy
  const sections = await prisma.section.findMany();

  // 2. Mapujemy tablicę na obiekt { [key]: content }
  const dbContent = sections.reduce(
    (acc, section) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      acc[section.key] = section.content as any;
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as Record<string, any>,
  );

  // 3. Zwracamy TYLKO to co jest w bazie
  return dbContent;
}

export default async function Home() {
  // Równoległe pobieranie danych dla szybszego ładowania
  const landingDataPromise = getLandingData();
  const sessionPromise = getServerSession(authOptions);

  const [landingData, session] = await Promise.all([
    landingDataPromise,
    sessionPromise,
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar z sesją */}
      <Navbar session={session} />

      <main className="flex-grow">
        {/* Przekazujemy dane dynamiczne prosto z bazy. 
            Jeśli sekcja nie istnieje w bazie, prop będzie 'undefined'. */}

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Hero data={landingData.hero} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <EbookFeatures data={landingData.ebookFeatures} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ContentPreview data={landingData.contentPreview} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Testimonials data={landingData.testimonials} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SecurePanel data={landingData.securePanel} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <About data={landingData.about} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <PracticalTraining data={landingData.practicalTraining} />

        <ComingSoonToaster />
      </main>

      <ContactFooter />
    </div>
  );
}
