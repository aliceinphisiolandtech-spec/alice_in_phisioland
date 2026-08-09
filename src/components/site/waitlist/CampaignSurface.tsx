import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  resolveSurfaceTokens,
  type ThemeTokens,
  type WaitlistLayout,
  type WaitlistTheme,
} from "@/lib/waitlist-appearance";

/**
 * Wygląd strony zapisów — tło, nawigacja, układ, stopka. Bez danych i logiki.
 *
 * Renderują to zarówno prawdziwa strona (`/zapisy/[slug]`), jak i kanwa
 * wizualnego kreatora w panelu. To jest cały sens tego pliku: kreator nie
 * pokazuje makiety „mniej więcej takiej jak strona", tylko dokładnie tę samą
 * powłokę. Zmiana wyglądu w jednym miejscu zmienia oba widoki naraz i nie da
 * się doprowadzić do sytuacji, w której podgląd kłamie.
 *
 * Nagłówek, opis i obszar formularza to FUNKCJE przyjmujące tokeny, a nie
 * gotowe węzły. Powód: karta ze zdjęciem w tle wymusza jasną treść, a w układzie
 * „dwie kolumny" tekst leży POZA kartą i musi zostać w kolorach motywu. Tylko
 * powłoka wie, co jest w środku karty, a co obok — więc to ona rozdaje tokeny.
 */

/** Slot treści — dostaje tokeny właściwe dla swojego miejsca na stronie. */
type Slot = (tokens: ThemeTokens) => React.ReactNode;

export interface CampaignSurfaceProps {
  layout: WaitlistLayout;
  theme: WaitlistTheme;
  tokens: ThemeTokens;

  /** Grafika jako osobny blok (góra karty w „hero", lewa kolumna w „split"). */
  heroImageUrl?: string | null;
  /** Zdjęcie wypełniające kartę, pod nakładką w kolorze marki. */
  backgroundImageUrl?: string | null;
  /** Krycie nakładki w procentach (0–100). */
  overlayOpacity?: number;

  /** Nawigacja serwisu. Strona podaje prawdziwy Navbar, kanwa — jego atrapę. */
  navbar?: React.ReactNode;

  headline: Slot;
  description: Slot;
  /** Formularz albo komunikat o zamkniętych zapisach. */
  body: Slot;

  /**
   * Kanwa kreatora siedzi w panelu, a nie na osobnej stronie — tło musi wtedy
   * wypełnić kontener, a nie okno przeglądarki, i nie może być tam odsyłaczy,
   * które wyrzucałyby administratorkę z edycji.
   */
  embedded?: boolean;
}

export function CampaignSurface({
  layout,
  theme,
  tokens,
  heroImageUrl,
  backgroundImageUrl,
  overlayOpacity = 50,
  navbar,
  headline,
  description,
  body,
  embedded = false,
}: CampaignSurfaceProps) {
  // Tokeny treści wewnątrz karty. Ze zdjęciem w tle przechodzą na „jasne na
  // ciemnym", bo nakładka jest zawsze ciemna.
  const surfaceTokens = resolveSurfaceTokens(
    tokens,
    theme,
    Boolean(backgroundImageUrl),
  );

  const card = {
    tokens: surfaceTokens,
    backgroundImageUrl,
    overlayOpacity,
  };

  return (
    <div className={cn("flex flex-col", embedded ? "min-h-full" : "contents")}>
      <div
        aria-hidden
        className={cn(
          embedded ? "absolute inset-0" : "fixed inset-0 -z-10",
          tokens.page,
        )}
      />

      {navbar && <div className="relative">{navbar}</div>}

      <main className="relative flex flex-grow items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        {layout === "split" ? (
          <div className="w-full max-w-[1000px]">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Tekst leży na tle STRONY, nie na karcie — zostaje w kolorach motywu. */}
              <div className="max-lg:text-center">
                {heroImageUrl && (
                  <HeroImage
                    url={heroImageUrl}
                    className="mb-6 rounded-[16px]"
                  />
                )}
                {headline(tokens)}
                {description(tokens)}
              </div>

              <SurfaceCard {...card} className="px-6 py-8 sm:px-9">
                {body(surfaceTokens)}
              </SurfaceCard>
            </div>
          </div>
        ) : layout === "hero" ? (
          <div className="w-full max-w-[620px]">
            <SurfaceCard {...card}>
              {heroImageUrl && (
                <HeroImage
                  url={heroImageUrl}
                  className="h-[200px] sm:h-[260px]"
                />
              )}

              <div className="px-6 py-8 sm:px-10 sm:py-10">
                {headline(surfaceTokens)}
                {description(surfaceTokens)}
                <div className="mt-8">{body(surfaceTokens)}</div>
              </div>
            </SurfaceCard>
          </div>
        ) : (
          <div className="w-full max-w-[560px]">
            <SurfaceCard {...card} className="px-6 py-9 sm:px-10 sm:py-12">
              {headline(surfaceTokens)}
              {description(surfaceTokens)}
              <div className="mt-8">{body(surfaceTokens)}</div>
            </SurfaceCard>
          </div>
        )}
      </main>

      <footer className="relative px-6 pt-4 pb-8 text-center">
        <nav
          className={cn(
            "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px]",
            tokens.footerLink,
          )}
        >
          <FooterLink href="/polityka-prywatnosci" embedded={embedded}>
            Polityka prywatności
          </FooterLink>
          <FooterLink href="/regulamin" embedded={embedded}>
            Regulamin
          </FooterLink>
          <span className="opacity-70">
            © {new Date().getFullYear()} Alice in Physioland
          </span>
        </nav>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Karta                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Karta z treścią, opcjonalnie ze zdjęciem w tle i nakładką.
 *
 * Kolejność warstw ma znaczenie i jest jedynym powodem, dla którego to jest
 * osobny komponent:
 *
 *   1. tło karty (`tokens.surface` — przy zdjęciu jest to kolor nakładki),
 *   2. zdjęcie,
 *   3. nakładka o zadanym kryciu,
 *   4. treść (`relative`, więc nad wszystkim).
 *
 * Warstwa 1 jest zabezpieczeniem: gdy zdjęcie się nie wczyta, karta zostaje
 * ciemna i jasny tekst nadal da się przeczytać.
 */
function SurfaceCard({
  tokens,
  backgroundImageUrl,
  overlayOpacity,
  className,
  children,
}: {
  tokens: ThemeTokens;
  backgroundImageUrl?: string | null;
  overlayOpacity: number;
  /** Odstępy wewnętrzne karty. Układ „hero" ich nie ma — grafika idzie do krawędzi. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[20px] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)]",
        tokens.surface,
      )}
    >
      {backgroundImageUrl && (
        <>
          <BackgroundImage url={backgroundImageUrl} />
          <div
            aria-hidden
            // Krycie jest liczbą z suwaka, więc idzie stylem — Tailwind skanuje
            // klasy statycznie i `opacity-[${x}]` nie trafiłoby do builda.
            style={{ opacity: clampOpacity(overlayOpacity) / 100 }}
            className={cn("absolute inset-0", tokens.overlay)}
          />
        </>
      )}

      {/*
        Odstępy siedzą TUTAJ, a nie na `<section>`. Gdyby były wyżej, zdjęcie
        i nakładka (pozycjonowane do krawędzi sekcji) i tak wypełniłyby całość,
        ale treść nie miałaby własnego kontekstu `relative` i schowałaby się
        pod nakładką.
      */}
      <div className={cn("relative", className)}>{children}</div>
    </section>
  );
}

/** Zakres 0–100 pilnowany też tutaj — do bazy mogła trafić wartość spoza niego. */
function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, value));
}

/**
 * Grafika nagłówka i tła.
 *
 * Zwykły <img>, nie `next/image`: adres wpisuje klientka w kreatorze, a
 * `next/image` przepuszcza wyłącznie hosty wypisane w `next.config.ts`.
 * Wymaganie wpisu w konfiguracji przy każdej nowej kampanii przekreślałoby
 * sens kreatora, a otwarcie listy na „dowolny host" zamieniłoby nasz serwer
 * w darmowy optymalizator cudzych obrazków.
 */
function HeroImage({ url, className }: { url: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      // Grafika jest dekoracją — treść niesie nagłówek. Pusty alt sprawia,
      // że czytnik ekranu ją pomija zamiast czytać adres pliku.
      aria-hidden
      className={cn("w-full object-cover", className)}
    />
  );
}

function BackgroundImage({ url }: { url: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

/* -------------------------------------------------------------------------- */

function FooterLink({
  href,
  embedded,
  children,
}: {
  href: string;
  embedded: boolean;
  children: React.ReactNode;
}) {
  if (embedded) return <span>{children}</span>;

  return (
    <Link href={href} className="transition-colors">
      {children}
    </Link>
  );
}
