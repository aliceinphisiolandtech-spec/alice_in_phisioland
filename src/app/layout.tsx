import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ComingSoonToaster } from "@/features/landing-page/components/CommingSoonToaster";
import { OneSignalInit } from "@/components/panel-kursanta/OneSignalInit";
import { Analytics } from "@vercel/analytics/next";
// Konfiguracja czcionki - ładuje się raz dla całej aplikacji
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"], // 400=Regular, 600=SemiBold, 700=Bold, 900=Black
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Alice in Physioland",
  description:
    "Dedykowana aplikacja Alicji Wójcik, pozwalająca na łatwy i nowoczesny dostęp do wiedzy fizjoterapeutycznej",
  manifest: "/manifest.json", // <--- 1. Link do manifestu
  appleWebApp: {
    // <--- 2. Konfiguracja dla Apple (iOS)
    capable: true,
    statusBarStyle: "default",
    title: "Alice in Physioland",
  },
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
        <ComingSoonToaster />
      </body>
    </html>
  );
}
