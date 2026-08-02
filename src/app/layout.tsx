import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

import { OneSignalInit } from "@/components/panel-kursanta/OneSignalInit";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL, siteConfig } from "@/lib/seo";

// Konfiguracja czcionki - ładuje się raz dla całej aplikacji
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"], // latin-ext = polskie znaki (ł, ó, ż, ...)
  weight: ["400", "600", "700", "900"], // 400=Regular, 600=SemiBold, 700=Bold, 900=Black
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  // metadataBase pozwala rozwiązywać względne URL-e (canonical, OG, sitemap).
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.name} — Diagnostyka różnicowa w fizjoterapii`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.name,
  applicationName: siteConfig.name,
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: SITE_URL,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Diagnostyka różnicowa w fizjoterapii`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage.url,
        width: siteConfig.ogImage.width,
        height: siteConfig.ogImage.height,
        alt: siteConfig.ogImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Diagnostyka różnicowa w fizjoterapii`,
    description: siteConfig.description,
    images: [siteConfig.ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  formatDetection: {
    telephone: false,
  },
  category: "health",
};

export const viewport: Viewport = {
  themeColor: "#0c493e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="scroll-smooth">
      <body className={`${montserrat.variable} font-montserrat antialiased`}>
        {children}
        <Analytics />
        <OneSignalInit />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
