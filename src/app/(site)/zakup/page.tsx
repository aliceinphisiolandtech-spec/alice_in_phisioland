import type { Metadata } from "next";
import { PWAWarning } from "@/components/PWAWarning";
import { CheckoutSection } from "@/components/site/checkout/CheckoutSection";
import { authOptions } from "@/lib/auth";
import { getServerSession, Session } from "next-auth";
import React from "react";
import { buildMetadata } from "@/lib/seo";
import { resolveCheckoutPricing } from "@/lib/checkout-pricing";

export const metadata: Metadata = buildMetadata({
  title: "Zakup e-booka",
  description:
    "Sfinalizuj zakup e-booka „Fizjoterapeutyczna diagnostyka różnicowa w ujęciu klinicznym. Tom 1”.",
  path: "/zakup",
  noIndex: true,
});

// Cena zależy od czynnych promocji i od tego, kto jest zalogowany —
// nie ma czego cache'ować.
export const dynamic = "force-dynamic";

const page = async () => {
  const session: Session | null = await getServerSession(authOptions);

  // Wycena startowa: przecena i zniżka dla puli maili naliczają się same,
  // więc klientka widzi właściwą kwotę już przy wejściu, bez klikania.
  const { pricing, sandbox } = await resolveCheckoutPricing({
    email: session?.user?.email,
    isAdmin: session?.user?.role === "admin",
  });

  return (
    <>
      <CheckoutSection
        session={session}
        initialPricing={pricing}
        sandbox={sandbox}
      />
      <PWAWarning />
    </>
  );
};
export default page;
