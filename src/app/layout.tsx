export const dynamic = "force-dynamic";
export const revalidate = 0;
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ComingSoonToaster } from "@/features/landing-page/components/CommingSoonToaster";
// Konfiguracja czcionki - ładuje się raz dla całej aplikacji
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Alice in Phisioland | Profesjonalna Fizjoterapia",
  description: "Zaawansowana i bezpieczna opieka fizjoterapeutyczna.",
  keywords: ["fizjoterapia", "rehabilitacja", "zdrowie", "Alice in Phisioland"],
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
        <Toaster position="top-right" richColors />
        <ComingSoonToaster />
      </body>
    </html>
  );
}
