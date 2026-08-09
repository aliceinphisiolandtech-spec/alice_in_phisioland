import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/common/Navbar";
import { buildMetadata } from "@/lib/seo";
import {
  countWaitlistSignups,
  getWaitlistPageBySlug,
  resolveWaitlistPageStatus,
} from "@/lib/waitlist";
import {
  DESCRIPTION_CLASSES,
  HEADLINE_CLASSES,
  THEME_TOKENS,
  resolveLayout,
  resolveTheme,
} from "@/lib/waitlist-appearance";
import { CampaignSurface } from "@/components/site/waitlist/CampaignSurface";
import {
  CampaignDescription,
  CampaignHeadline,
} from "@/components/site/waitlist/CampaignText";
import { ClosedNotice } from "@/components/site/waitlist/ClosedNotice";
import { SeatsMeter } from "@/components/site/waitlist/SeatsMeter";
import { WaitlistForm } from "@/components/site/waitlist/WaitlistForm";

/**
 * Publiczna strona zapisów: /zapisy/<slug>.
 *
 * Treść i wygląd pochodzą z bazy (model WaitlistPage), więc kolejna kampania
 * to nowy rekord zakładany w kreatorze (/admin/zapisy), a nie nowy plik.
 *
 * Sam wygląd renderuje `CampaignSurface` — ten sam komponent, którego używa
 * kanwa kreatora. Dzięki temu podgląd w panelu nie może się rozjechać z tym,
 * co realnie zobaczy odbiorca.
 */

// Treść i okno zapisów zmieniają się w bazie (także w trakcie kampanii),
// a strona jest linkowana z posta — musi pokazywać stan na teraz.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getWaitlistPageBySlug(slug);

  if (!page) {
    return buildMetadata({ title: "Nie znaleziono strony", noIndex: true });
  }

  return buildMetadata({
    title: page.headline,
    description: page.description.slice(0, 200),
    path: `/zapisy/${page.slug}`,
    // Obrazek podglądu przy wklejeniu linku na Instagramie czy Facebooku.
    // Puste pole = globalny obrazek strony, o który dba `buildMetadata`.
    image: page.ogImageUrl ?? undefined,
    // Strony kampanijne trzymamy poza indeksem: są tymczasowe, a zaindeksowana
    // zamknięta kampania to martwy wynik w Google konkurujący ze stroną główną.
    // Na dostępność linku z posta nie ma to żadnego wpływu.
    noIndex: true,
  });
}

export default async function WaitlistCampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getWaitlistPageBySlug(slug);

  if (!page) notFound();

  // Licznik zapisanych jest potrzebny zawsze: przy ustawionym limicie decyduje
  // o zamknięciu zapisów, a bez limitu zasila pasek „zostało X miejsc".
  const signupCount = await countWaitlistSignups(page.id);

  const status = resolveWaitlistPageStatus({ ...page, signupCount });
  const theme = resolveTheme(page.theme);
  const tokens = THEME_TOKENS[theme];

  // Navbar potrzebuje sesji, żeby pokazać „Panel" zamiast „Zaloguj się".
  const session = await getServerSession(authOptions);

  return (
    <CampaignSurface
      layout={resolveLayout(page.layoutVariant)}
      theme={theme}
      tokens={tokens}
      heroImageUrl={page.heroImageUrl}
      backgroundImageUrl={page.backgroundImageUrl}
      overlayOpacity={page.overlayOpacity}
      navbar={<Navbar session={session} />}
      // Sloty dostają tokeny od powłoki: wewnątrz karty ze zdjęciem są inne
      // (jasne na ciemnym) niż na tle strony.
      headline={(slotTokens) => (
        <CampaignHeadline
          headline={page.headline}
          highlight={page.highlight}
          tokens={slotTokens}
          className={HEADLINE_CLASSES}
        />
      )}
      description={(slotTokens) => (
        <CampaignDescription
          description={page.description}
          tokens={slotTokens}
          className={DESCRIPTION_CLASSES}
        />
      )}
      body={(slotTokens) =>
        status === "open" ? (
          <>
            <SeatsMeter
              signupCount={signupCount}
              maxSignups={page.maxSignups}
              tokens={slotTokens}
            />
            <WaitlistForm
              slug={page.slug}
              ctaLabel={page.ctaLabel}
              collectName={page.collectName}
              consentText={page.consentText}
              footnote={page.footnote}
              successTitle={page.successTitle}
              successMessage={page.successMessage}
              tokens={slotTokens}
            />
          </>
        ) : (
          <ClosedNotice
            status={status}
            message={page.closedMessage}
            opensAt={page.opensAt}
            tokens={slotTokens}
          />
        )
      }
    />
  );
}
