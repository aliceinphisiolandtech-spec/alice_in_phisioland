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
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isFirstLogin: true, email: true },
  });

  // Druga linia obrony obok weryfikacji tokena w callbacku `jwt`. To zapytanie
  // i tak tutaj było, więc sprawdzenie nic nie kosztuje — a domyka okno, w którym
  // pamięć podręczna weryfikacji (60 s) trzyma jeszcze nieaktualną odpowiedź.
  // Wcześniej brak użytkownika dawał po cichu `isFirstLogin = false` i panel
  // renderował się normalnie danymi z ciasteczka.
  //
  // Pusty e-mail to konto usunięte z panelu — `deleteMyAccountAction`
  // anonimizuje wiersz, zamiast go kasować (zamówienia i numery faktur).
  if (!user || user.email === null) {
    redirect("/logowanie");
  }

  const isFirstLogin = user.isFirstLogin;

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
    </div>
  );
}
