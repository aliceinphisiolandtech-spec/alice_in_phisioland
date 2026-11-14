import { MailPlus } from "lucide-react";
import { SITE_URL } from "@/lib/seo";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { isWaitlistBuilderEnabled } from "@/lib/waitlist-features";
import { loadWaitlistCampaigns } from "./data";
import { SimpleWaitlistControl } from "./SimpleWaitlistControl";
import { WaitlistManager } from "./WaitlistManager";

/**
 * Zapisy na listę w panelu.
 *
 * Widok zależy od zamówionego zakresu (patrz `lib/waitlist-features`):
 * bez kreatora zostaje sam wyłącznik i licznik, z kreatorem — pełne
 * zarządzanie kampaniami.
 *
 * Panel musi pokazywać stan na teraz (kampania mogła się właśnie zamknąć,
 * ktoś mógł się właśnie zapisać), więc bez cache. Pobieranie danych siedzi
 * w `./data`, żeby ten plik był samym widokiem.
 */
export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  const pages = await loadWaitlistCampaigns();
  const builderEnabled = isWaitlistBuilderEnabled();

  return (
    <div className="w-full max-w-5xl">
      <PageHeader
        icon={<MailPlus size={24} />}
        eyebrow="Sprzedaż"
        title="Zapisy na listę"
        description={
          builderEnabled
            ? "Twórz strony zbierające adresy e-mail i wysyłaj je do MailerLite."
            : "Podgląd strony zbierającej adresy e-mail do MailerLite."
        }
      />

      {builderEnabled ? (
        <WaitlistManager pages={pages} siteUrl={SITE_URL} />
      ) : (
        <SimpleWaitlistControl pages={pages} siteUrl={SITE_URL} />
      )}
    </div>
  );
}
