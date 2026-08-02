import type { Metadata } from "next";

/**
 * Centralna konfiguracja SEO.
 *
 * Adres bazowy bierzemy z NEXT_PUBLIC_SITE_URL (jeśli ustawiony), w przeciwnym
 * razie z NEXTAUTH_URL (server-side), a na końcu localhost. Dzięki temu kanoniczne
 * URL-e, Open Graph i sitemap są poprawne per środowisko bez dodatkowej konfiguracji.
 *
 * NA PRODUKCJI ustaw NEXT_PUBLIC_SITE_URL na właściwą domenę (np. https://aliceinphysioland.pl).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export const siteConfig = {
  name: "Alice in Physioland",
  author: "Alicja Wójcik",
  url: SITE_URL,
  description:
    "Alice in Physioland — autorska platforma fizjoterapeutki Alicji Wójcik. E-book „Fizjoterapeutyczna diagnostyka różnicowa w ujęciu klinicznym. Tom 1” oraz szkolenia praktyczne dla fizjoterapeutów.",
  keywords: [
    "fizjoterapia",
    "diagnostyka różnicowa",
    "diagnostyka w fizjoterapii",
    "e-book fizjoterapia",
    "fizjoterapeuta",
    "fizjoterapeuta Warszawa",
    "rehabilitacja",
    "szkolenia fizjoterapia",
    "badanie kliniczne",
    "EBM fizjoterapia",
    "Alicja Wójcik",
  ],
  ogImage: {
    url: "/og-image.png",
    width: 711,
    height: 1009,
    alt: "Alice in Physioland — diagnostyka różnicowa w fizjoterapii",
  },
  locale: "pl_PL",
  // Realne profile (uzupełniaj w miarę powstawania — używane w JSON-LD sameAs).
  sameAs: [
    "https://www.znanylekarz.pl/alicja-wojcik-4/fizjoterapeuta/warszawa",
  ],
} as const;

interface BuildMetadataArgs {
  title?: string;
  description?: string;
  /** Ścieżka względna, np. "/strefa-pacjenta". Domyślnie "/". */
  path?: string;
  /** Nadpisanie obrazka OG (URL względny lub absolutny). */
  image?: string;
  /** Wyłącz indeksowanie (strony prywatne/transakcyjne). */
  noIndex?: boolean;
  keywords?: string[];
}

/**
 * Buduje spójny obiekt Metadata dla strony (canonical + Open Graph + Twitter).
 * metadataBase ustawiamy raz w root layout, więc ścieżki względne rozwiążą się same.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  noIndex,
  keywords,
}: BuildMetadataArgs = {}): Metadata {
  const resolvedDescription = description ?? siteConfig.description;
  const canonical = path;
  const ogImage = image ?? siteConfig.ogImage.url;

  return {
    title,
    description: resolvedDescription,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical },
    openGraph: {
      title: title ?? siteConfig.name,
      description: resolvedDescription,
      url: `${SITE_URL}${path === "/" ? "" : path}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [
        {
          url: ogImage,
          width: siteConfig.ogImage.width,
          height: siteConfig.ogImage.height,
          alt: siteConfig.ogImage.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? siteConfig.name,
      description: resolvedDescription,
      images: [ogImage],
    },
    ...(noIndex
      ? { robots: { index: false, follow: false, nocache: true } }
      : {}),
  };
}

/* --------------------------------------------------------------------------
 * Dane strukturalne (JSON-LD) — schema.org
 * ------------------------------------------------------------------------ */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon-512.png`,
    founder: { "@type": "Person", name: siteConfig.author },
    sameAs: siteConfig.sameAs,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "pl-PL",
    publisher: { "@type": "Organization", name: siteConfig.name },
  };
}

/** E-book jako Book/Product z ofertą — wzbogaca wynik wyszukiwania o cenę/dostępność. */
export function ebookSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "Fizjoterapeutyczna diagnostyka różnicowa w ujęciu klinicznym. Tom 1",
    bookFormat: "https://schema.org/EBook",
    inLanguage: "pl",
    author: { "@type": "Person", name: siteConfig.author },
    publisher: { "@type": "Organization", name: siteConfig.name },
    url: `${siteConfig.url}/zakup`,
    image: `${siteConfig.url}${siteConfig.ogImage.url}`,
    offers: {
      "@type": "Offer",
      price: "109.00",
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      url: `${siteConfig.url}/zakup`,
    },
  };
}

/** Lokalny biznes (fizjoterapia, Warszawa) — wspiera SEO lokalne strefy pacjenta. */
export function physioBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: `${siteConfig.author} — Fizjoterapia`,
    description:
      "Gabinet fizjoterapii prowadzony przez Alicję Wójcik. Diagnostyka różnicowa i terapia pacjentów.",
    url: `${siteConfig.url}/strefa-pacjenta`,
    medicalSpecialty: "Physiotherapy",
    areaServed: { "@type": "City", name: "Warszawa" },
    sameAs: siteConfig.sameAs,
  };
}
