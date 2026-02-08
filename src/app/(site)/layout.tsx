import React from "react";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Używamy div jako wrappera, flex pozwala "przykleić" stopkę do dołu
    <div className="flex flex-col min-h-screen">
      {/* Main zajmuje dostępną przestrzeń, odpychając footer */}
      <main className="flex-grow">{children}</main>

      <Footer />
    </div>
  );
}
