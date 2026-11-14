import React from "react";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { PromoTopBanner } from "@/components/site/PromoTopBanner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPromoBanner } from "@/lib/promo-banner";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  // Sesja jest potrzebna pasku: admin w piaskownicy widzi też testowe przeceny.
  const promoBanner = await getPromoBanner({
    isAdmin: session?.user?.role === "admin",
    email: session?.user?.email,
  });

  return (
    // Używamy div jako wrappera, flex pozwala "przykleić" stopkę do dołu
    // `overflow-x-clip`: animacje wjazdu z boku (np. karty „fadeLeft”, które
    // przed pojawieniem się stoją 36 px w prawo) i dekoracyjny blob w hero
    // wystawały poza ekran telefonu — strona dawała się przewijać w bok,
    // a przeglądarka powiększała viewport (rozjeżdżał się też popup promocji).
    // `clip` zamiast `hidden`: nie tworzy kontenera przewijania, więc nie psuje
    // `position: sticky` ani elementów `fixed`.
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <PromoTopBanner data={promoBanner} />
      {/* `relative`: na stronie głównej navbar jest `absolute top-0` (leży na
          hero). Bez tego kontenera przykryłby pasek promocji — z nim zaczyna
          się tuż pod paskiem, a po przewinięciu i tak przechodzi w `fixed`. */}
      <div className="relative flex flex-col flex-grow">
        <Navbar session={session} />
        <main className="flex-grow">{children}</main>

        <Footer />
      </div>
    </div>
  );
}
