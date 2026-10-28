// app/panel-kursanta/layout.tsx
import { ReactNode, Suspense } from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // Dodaj import Prismy

export const metadata: Metadata = {
  title: "Panel Kursanta",
  robots: { index: false, follow: false },
};

import ClientTopbar from "@/components/panel-kursanta/ClientTopbar";
import ClientSidebar from "@/components/panel-kursanta/ClientSidebar";
import { MobileMenu } from "@/components/panel-kursanta/MobileMenu";
import { PurchaseSuccessModal } from "@/components/panel-kursanta/dashboard/PurchaseSuccessModal";
import { PWAWarning } from "@/components/PWAWarning";
import { redirect } from "next/navigation";
import { OfflineSupport } from "@/components/panel-kursanta/OfflineSupport";
import fs from "fs";
import path from "path";

/** Strony panelu zapisywane do trybu offline dla każdej kursantki. */
const PANEL_PAGES = [
  "/panel-kursanta",
  "/panel-kursanta/aktualnosci",
  "/panel-kursanta/kursy",
  "/panel-kursanta/profil",
];

/** Spis treści i wszystkie rozdziały — tylko dla osób z dostępem do e-booka. */
function getReaderUrls(): string[] {
  const contentDir = path.join(process.cwd(), "content");
  if (!fs.existsSync(contentDir)) return [];
  const chapters = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".mdx"))
    .sort()
    .map((f) => `/panel-kursanta/czytnik/${f.replace(/\.mdx$/, "")}`);
  return ["/panel-kursanta/czytnik", ...chapters];
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/logowanie");
  }
  // 1. TYLKO ODCZYTUJEMY FLAGĘ (Nic nie zmieniamy!)
  let isFirstLogin = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isFirstLogin: true },
    });
    isFirstLogin = !!user?.isFirstLogin;
  }

  const hasEbook = !!(await prisma.purchase.findUnique({
    where: {
      userId_productId: { userId: session.user.id, productId: "ebook-tom-1" },
    },
    select: { id: true },
  }));
  const offlineUrls = hasEbook
    ? [...PANEL_PAGES, ...getReaderUrls()]
    : PANEL_PAGES;

  return (
    <div className="h-screen w-full bg-[#F5F6F8] overflow-hidden flex">
      <ClientSidebar session={session} />
      <div className="flex-1 flex flex-col h-full ml-[280px] max-[1024px]:ml-0 transition-all duration-300">
        <ClientTopbar session={session} />
        <main className="flex-1 h-full overflow-y-auto  scrollbar-hide relative">
          <Suspense fallback={null}>
            <PurchaseSuccessModal isFirstLogin={isFirstLogin} />
          </Suspense>

          {children}
        </main>
      </div>
      <PWAWarning />
      <MobileMenu session={session} />
      <OfflineSupport userId={session.user.id} warmUrls={offlineUrls} />
    </div>
  );
}
