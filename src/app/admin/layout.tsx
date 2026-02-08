import React from "react";
import { redirect } from "next/navigation"; // 1. Import redirect
import AdminSidebar from "@/components/admin/Sidebar";
import AdminTopbar from "@/components/admin/Topbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // 2. GUARD: Sprawdź czy jest sesja I czy rola to admin
  if (!session || session.user.role !== "admin") {
    redirect("/"); // Wyrzucamy na stronę główną (lub /logowanie)
  }

  const user = session.user;

  return (
    <div className="min-h-screen w-full bg-[#F5F6F8] font-montserrat text-[#0c493e]">
      {/* Sidebar - przekazujemy tylko Imię */}
      <AdminSidebar adminName={user.name} />

      <div className="pl-[280px] w-full flex flex-col min-h-screen transition-all duration-300 max-[980px]:pl-0">
        {/* Topbar - przekazujemy Imię, Email i Zdjęcie */}
        <AdminTopbar
          adminName={user.name}
          adminEmail={user.email}
          adminImage={user.image}
        />

        <main className="flex-1 p-8 max-[980px]:p-4 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
