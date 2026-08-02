import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation"; // 1. Import redirect
import AdminShell from "@/components/admin/AdminShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Panel administracyjny",
  robots: { index: false, follow: false },
};

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
      {/* Cała interaktywna powłoka (Sidebar + Topbar + drawer mobilny) */}
      <AdminShell
        adminName={user.name}
        adminEmail={user.email}
        adminImage={user.image}
      >
        {children}
      </AdminShell>
    </div>
  );
}
