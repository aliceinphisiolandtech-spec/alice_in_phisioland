import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { CenterCardOnLoad } from "./CenterCardOnLoad";
import {
  resolveOnImageTokens,
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
 * gotowe węzły. Powód: treść w karcie leży na jej własnym, nieprzezroczystym
 * tle i zostaje w kolorach motywu, a w układzie „dwie kolumny" tekst leży POZA
 * kartą — czyli wprost na zdjęciu z nakładką — i musi przejść na jasny. Tylko
 * powłoka wie, co jest w środku karty, a co obok — więc to ona rozdaje tokeny.
 */

/** Slot treści — dostaje tokeny właściwe dla swojego miejsca na stronie. */
type Slot = (tokens: ThemeTokens) => React.ReactNode;

/**
 * Kotwica bloku z kartą — po wejściu przewijamy do niej widok.
 * Jedna stała, bo `id` w znaczniku i cel przewijania muszą być tym samym
 * napisem, a rozjechałyby się przy pierwszej zmianie któregokolwiek z nich.
 */
const CARD_ANCHOR_ID = "karta-kampanii";

export interface CampaignSurfaceProps {
  layout: WaitlistLayout;
  theme: WaitlistTheme;
  tokens: ThemeTokens;

  /** Grafika jako osobny blok (góra karty w „hero", lewa kolumna w „split"). */
  heroImageUrl?: string | null;
  /** Zdjęcie wypełniające tło CAŁEJ STRONY, pod kartą i pod nakładką w kolorze marki. */
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
  // Tokeny treści leżącej POZA kartą — ta jako jedyna ląduje wprost na zdjęciu
  // z nakładką, więc przechodzi na „jasne na ciemnym". Treść w karcie zostaje
  // przy kolorach motywu: karta ma własne, nieprzezroczyste tło.
  const pageTokens = resolveOnImageTokens(
    tokens,
    theme,
    Boolean(backgroundImageUrl),
  );

  return (
    <div className={cn("flex flex-col", embedded ? "min-h-full" : "contents")}>
      <PageBackground
        tokens={tokens}
        imageUrl={backgroundImageUrl}
        overlayOpacity={overlayOpacity}
        embedded={embedded}
      />

      {/* Kanwa kreatora siedzi w panelu — przewijanie tam ruszyłoby cały panel. */}
      {!embedded && <CenterCardOnLoad targetId={CARD_ANCHOR_ID} />}

      {navbar && <div className="relative">{navbar}</div>}

      {/*
        Kontener karty ma pełną wysokość okna, więc karta siedzi na środku
        ekranu niezależnie od tego, ile miejsca zajął navbar. Konsekwencja jest
        zamierzona: navbar nad nim i stopka pod nim wystają poza okno, więc
        strona zawsze daje się przewinąć.

        `dvh`, a nie `vh`: na telefonie `100vh` to wysokość BEZ paska adresu,
        więc dopóki pasek jest widoczny, kawałek kontenera siedzi poza ekranem
        i karta wypada poniżej środka. `dvh` liczy to, co faktycznie widać.

        Wyśrodkowanie w pionie robi `m-auto` na karcie, a NIE `items-center`
        na kontenerze. Różnica wychodzi na niskich ekranach: przy `items-center`
        treść wyższa niż kontener wystaje GÓRĄ poza obszar przewijania i nie da
        się jej doczytać — scroll idzie tylko w dół. Automatyczne marginesy
        rozdzielają nadmiar tak, że karta zostaje na środku, dopóki się mieści,
        a gdy przestaje — po prostu się przewija.
      */}
      <main
        className={cn(
          "relative flex flex-grow justify-center px-4 py-6 sm:px-6 sm:py-12",
          // Na kanwie kreatora wysokość daje panel podglądu — `dvh` rozepchałoby
          // ją na całe okno panelu administracyjnego.
          embedded ? "min-h-full" : "min-h-dvh",
        )}
      >
        {layout === "split" ? (
          <div id={CARD_ANCHOR_ID} className="m-auto w-full max-w-[1000px]">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Tekst leży na tle STRONY, nie na karcie — to jego dotyczy zdjęcie. */}
              <div className="max-lg:text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:ease-out">
                {heroImageUrl && (
                  <HeroImage
                    url={heroImageUrl}
                    className="mb-6 rounded-[16px]"
                  />
                )}
                {headline(pageTokens)}
                {description(pageTokens)}
              </div>

              <SurfaceCard tokens={tokens} className="px-6 py-8 sm:px-9">
                {body(tokens)}
              </SurfaceCard>
            </div>
          </div>
        ) : layout === "hero" ? (
          <div id={CARD_ANCHOR_ID} className="m-auto w-full max-w-[620px]">
            <SurfaceCard tokens={tokens}>
              {heroImageUrl && (
                <HeroImage
                  url={heroImageUrl}
                  className="h-[160px] sm:h-[260px]"
                />
              )}

              <div className="px-5 py-7 sm:px-10 sm:py-10">
                {/*
                  Na wąskim ekranie tekst wyśrodkowany: przy jednej kolumnie
                  wyrównanie do lewej zostawia poszarpaną prawą krawędź tuż
                  przy krawędzi karty i całość wygląda na ściśniętą.
                */}
                <div className="max-sm:text-center">
                  {headline(tokens)}
                  {description(tokens)}
                </div>
                <div className="mt-7 sm:mt-8">{body(tokens)}</div>
              </div>
            </SurfaceCard>
          </div>
        ) : (
          <div id={CARD_ANCHOR_ID} className="m-auto w-full max-w-[560px]">
            <SurfaceCard
              tokens={tokens}
              className="px-5 py-7 sm:px-10 sm:py-12"
            >
              <div className="max-sm:text-center">
                {headline(tokens)}
                {description(tokens)}
              </div>
              <div className="mt-7 sm:mt-8">{body(tokens)}</div>
            </SurfaceCard>
          </div>
        )}
      </main>

      <footer className="relative px-6 pt-4 pb-6 text-center sm:pb-8">
        <nav
          className={cn(
            "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px]",
            pageTokens.footerLink,
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
/* Tło strony                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Tło pod całą stroną: kolor motywu, na nim opcjonalne zdjęcie, na nim nakładka
 * w kolorze marki. Karta pływa nad tym wszystkim i zdjęcia nie dotyka.
 *
 * Kolor motywu jest warstwą najniższą nieprzypadkowo — gdy zdjęcie się nie
 * wczyta (zły adres, host offline), strona wygląda dokładnie tak, jak wyglądała
 * przed dodaniem zdjęcia. Awaria degraduje wygląd, nie treść.
 *
 * Poza kanwą kreatora warstwa jest `fixed`: strona bywa wyższa niż okno, a
 * zdjęcie ma wtedy wypełniać widok, a nie rozciągać się na całą jej długość.
 */
function PageBackground({
  tokens,
  imageUrl,
  overlayOpacity,
  embedded,
}: {
  tokens: ThemeTokens;
  imageUrl?: string | null;
  overlayOpacity: number;
  embedded: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden",
        embedded ? "absolute inset-0" : "fixed inset-0 -z-10",
        tokens.page,
      )}
    >
      {imageUrl && (
        // Zdjęcie wchodzi wolniej niż karta — najpierw jest tło, potem treść
        // na nim. Odwrotna kolejność wygląda jak doładowywanie się strony.
        <div className="absolute inset-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-1000">
          <BackgroundImage url={imageUrl} />
          <div
            // Krycie jest liczbą z suwaka, więc idzie stylem — Tailwind skanuje
            // klasy statycznie i `opacity-[${x}]` nie trafiłoby do builda.
            style={{ opacity: clampOpacity(overlayOpacity) / 100 }}
            className={cn("absolute inset-0", tokens.overlay)}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Karta                                                                       */
/* -------------------------------------------------------------------------- */

/** Karta z treścią — nieprzezroczyste tło motywu, żeby tekst nie leżał na zdjęciu. */
function SurfaceCard({
  tokens,
  className,
  children,
}: {
  tokens: ThemeTokens;
  /** Odstępy wewnętrzne karty. Układ „hero" ich nie ma — grafika idzie do krawędzi. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[20px] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)]",
        // Wejście: karta pojawia się i lekko unosi. Pod `motion-safe`, bo dla
        // kogoś z włączoną redukcją ruchu ma po prostu od razu być.
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:ease-out",
        tokens.surface,
      )}
    >
      <div className={className}>{children}</div>
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
