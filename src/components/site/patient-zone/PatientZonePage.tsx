import {
  FileText,
  Wallet,
  MapPin,
  ScanSearch,
  UserCheck,
  BrainCircuit,
  Shirt,
  Coffee,
} from "lucide-react";
import Image from "next/image";
import { ZnanyLekarzWidget } from "./ZnanyLekarzWidget";
import { PatientZoneHero } from "./PatientZoneHero";
import { PreparationSection } from "./PreparationSection";
import { FaqSection } from "./FaqSection";

import { prisma } from "@/lib/prisma";
import { LandingPageData } from "@/lib/types/landing";

export async function getLandingData(): Promise<LandingPageData> {
  try {
    // 1. Pobierz wszystkie sekcje z bazy
    const sections = await prisma.section.findMany();

    // 2. Przekształć tablicę [{key: 'hero', content: {...}}, ...]
    //    na obiekt { hero: {...}, about: {...} }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbContent = sections.reduce((acc: Record<string, any>, section) => {
      acc[section.key] = section.content;
      return acc;
    }, {});

    // 3. Sprawdzenie bezpieczeństwa (opcjonalne)
    // Jeśli nie ma danych w bazie (np. po czystej instalacji), rzuć błąd lub ostrzeżenie
    if (Object.keys(dbContent).length === 0) {
      console.error("❌ BAZA DANYCH JEST PUSTA! Uruchom 'npx prisma db seed'.");
      // Możesz tu zwrócić null i obsłużyć to na frontendzie,
      // ale zakładamy, że seed został wykonany.
    }

    // 4. Zwróć obiekt rzutowany na LandingPageData
    // TypeScript ufa Ci tutaj, że struktura w JSON w bazie pasuje do typu.
    return dbContent as unknown as LandingPageData;
  } catch (error) {
    console.error("Błąd pobierania danych z bazy:", error);
    // W sytuacji krytycznej (brak bazy) zwracamy pusty obiekt,
    // co prawdopodobnie spowoduje błąd w komponentach, ale pozwoli zdiagnozować problem.
    return {} as LandingPageData;
  }
}
export const PatientZonePage = async () => {
  const landingData = await getLandingData();

  // ZABEZPIECZENIE (Opcjonalne, jeśli boisz się pustej bazy):
  if (!landingData.patientHero) {
    return <div>Brak danych w bazie. Uruchom seed.</div>;
  }
  return (
    <main className="flex flex-col">
      <PatientZoneHero content={landingData.patientHero} />
      <ZnanyLekarzWidget content={landingData.patientReviews} />
      <PreparationSection content={landingData.patientPreparation} />
      <FaqSection content={landingData.patientFaq} />
    </main>
  );
};
