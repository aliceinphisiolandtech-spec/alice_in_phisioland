import React from "react";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    // Używamy div jako wrappera, flex pozwala "przykleić" stopkę do dołu
    <div className="flex flex-col min-h-screen">
      <Navbar session={session} />
      <main className="flex-grow">{children}</main>

      <Footer />
    </div>
  );
}
