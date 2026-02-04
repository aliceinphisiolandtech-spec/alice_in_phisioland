import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";

// Konfiguracja czcionki Montserrat zgodnie z Twoim setupem
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-montserrat",
});

// Metadata przygotowana pod Twój Landing Page
export const metadata: Metadata = {
  title: "Alice in Phisioland | Profesjonalna Fizjoterapia",
  description:
    "Zaawansowana i bezpieczna opieka fizjoterapeutyczna. Odzyskaj sprawność z Alice in Phisioland.",
  keywords: ["fizjoterapia", "rehabilitacja", "zdrowie", "Alice in Phisioland"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="scroll-smooth">
      <body
        className={`${montserrat.variable} font-montserrat antialiased bg-`}
      >
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
