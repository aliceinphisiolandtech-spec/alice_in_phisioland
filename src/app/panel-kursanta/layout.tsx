import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientTopbar from "@/components/panel-kursanta/ClientTopbar";
import ClientSidebar from "@/components/panel-kursanta/ClientSidebar";
import { MobileMenu } from "@/components/panel-kursanta/MobileMenu";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  return (
    // ZEWNĘTRZNY KONTER: Sztywny h-screen, żeby Sidebar był zawsze widoczny
    <div className="h-screen w-full bg-[#F5F6F8] overflow-hidden flex">
      {/* 1. SIDEBAR (Stały) */}
      <ClientSidebar session={session} />

      {/* PRAWA STRONA (Treść) */}
      <div className="flex-1 flex flex-col h-full ml-[280px] max-[1024px]:ml-0 transition-all duration-300">
        {/* Topbar (Stały) */}
        <ClientTopbar session={session} />

        {/* ZMIANA KLUCZOWA:
           overflow-y-auto: Pozwala na scrollowanie treści (dla Czytnika E-booka).
           Dla Spisu Treści zablokujemy to z poziomu dziecka (TocContent).
        */}
        <main className="flex-1 h-full overflow-y-auto relative scrollbar-hide">
          {children}
        </main>
      </div>

      {/* 3. MOBILE MENU */}
      <MobileMenu session={session} />
    </div>
  );
}
