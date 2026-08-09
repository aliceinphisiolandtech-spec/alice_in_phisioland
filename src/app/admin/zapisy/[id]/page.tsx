import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/seo";
import { isWaitlistBuilderEnabled } from "@/lib/waitlist-features";
import { loadWaitlistCampaign } from "../data";
import { CampaignEditor } from "../CampaignEditor";

/**
 * Edycja istniejącej kampanii w tym samym kreatorze co zakładanie nowej.
 *
 * Segment `[id]` siedzi obok stałego `nowa` — Next dopasowuje trasy stałe
 * przed dynamicznymi, więc `/admin/zapisy/nowa` trafia do kreatora nowej
 * kampanii, a nie tutaj z `id = "nowa"`. Dodatkowo `nowa` jest na liście
 * slugów zarezerwowanych (`lib/validators/waitlist.ts`), więc żadna kampania
 * nie może zająć tego adresu.
 */
export const dynamic = "force-dynamic";

export default async function EditWaitlistCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Tak jak przy zakładaniu nowej kampanii: kreator należy do Etapu 2,
  // więc bez niego trasa ma nie istnieć, a nie tłumaczyć się z niedostępności.
  if (!isWaitlistBuilderEnabled()) notFound();

  const { id } = await params;
  const row = await loadWaitlistCampaign(id);

  if (!row) notFound();

  return <CampaignEditor row={row} siteUrl={SITE_URL} />;
}
