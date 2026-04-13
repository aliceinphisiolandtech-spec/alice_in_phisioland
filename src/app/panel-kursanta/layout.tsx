// app/panel-kursanta/layout.tsx
import { ReactNode, Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // Dodaj import Prismy

import ClientTopbar from "@/components/panel-kursanta/ClientTopbar";
import ClientSidebar from "@/components/panel-kursanta/ClientSidebar";
import { MobileMenu } from "@/components/panel-kursanta/MobileMenu";
import { PurchaseSuccessModal } from "@/components/panel-kursanta/dashboard/PurchaseSuccessModal";
import { PWAWarning } from "@/components/PWAWarning";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  // 1. TYLKO ODCZYTUJEMY FLAGĘ (Nic nie zmieniamy!)
  let isFirstLogin = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isFirstLogin: true },
    });
    isFirstLogin = !!user?.isFirstLogin;
  }

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
