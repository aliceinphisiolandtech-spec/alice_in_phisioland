import { MailPlus } from "lucide-react";
import { SITE_URL } from "@/lib/seo";
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
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-[#0c493e] p-2.5 text-white">
          <MailPlus size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Zapisy na listę</h1>
          <p className="text-sm text-gray-500">
            {builderEnabled
              ? "Twórz strony zbierające adresy e-mail i wysyłaj je do MailerLite."
              : "Podgląd strony zbierającej adresy e-mail do MailerLite."}
          </p>
        </div>
      </div>

      {builderEnabled ? (
        <WaitlistManager pages={pages} siteUrl={SITE_URL} />
      ) : (
        <SimpleWaitlistControl pages={pages} siteUrl={SITE_URL} />
      )}
    </div>
  );
}
