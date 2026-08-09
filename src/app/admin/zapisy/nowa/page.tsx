import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/seo";
import { isWaitlistBuilderEnabled } from "@/lib/waitlist-features";
import { CampaignEditor } from "../CampaignEditor";

/**
 * Zakładanie nowej kampanii — wizualny kreator na czystym rekordzie.
 *
 * Osobna trasa, a nie formularz nad listą: kreator renderuje pełną stronę
 * kampanii i potrzebuje całej dostępnej szerokości. Dzięki temu adres da się
 * też odświeżyć albo zapisać w zakładkach bez utraty kontekstu.
 */
export const dynamic = "force-dynamic";

export default function NewWaitlistCampaignPage() {
  // Blokada na trasie, nie tylko ukrycie przycisku: kreator to zakres Etapu 2,
  // a adres jest łatwy do odgadnięcia. `notFound()` zamiast komunikatu
  // „wykupiony?" — nieudostępniona funkcja ma po prostu nie istnieć.
  if (!isWaitlistBuilderEnabled()) notFound();

  return <CampaignEditor row={null} siteUrl={SITE_URL} />;
}
