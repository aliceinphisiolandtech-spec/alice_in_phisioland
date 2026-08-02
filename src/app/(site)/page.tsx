// app/page.tsx
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { About } from "@/features/landing-page/components/About";
import { ContactFooter } from "@/features/landing-page/components/ContactFooter";
import { ContentPreview } from "@/features/landing-page/components/ContentPreview";
import { EbookFeatures } from "@/features/landing-page/components/EbookFeatures";
import { Hero } from "@/features/landing-page/components/Hero";
import { PracticalTraining } from "@/features/landing-page/components/PracticalTraining";
import { SecurePanel } from "@/features/landing-page/components/SecurePanel";
import { Testimonials } from "@/features/landing-page/components/Testimonials";
import { prisma } from "@/lib/prisma";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildMetadata,
  ebookSchema,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Diagnostyka różnicowa w fizjoterapii — e-book i szkolenia",
  description:
    "Naucz się fizjoterapeutycznej diagnostyki różnicowej w ujęciu klinicznym. E-book Alicji Wójcik (Tom 1) oraz praktyczne szkolenia dla fizjoterapeutów. Pewna diagnoza, lepsze efekty terapii.",
  path: "/",
});

async function getLandingData() {
  const sections = await prisma.section.findMany();
  const dbContent = sections.reduce(
    (acc, section) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      acc[section.key] = section.content as any;
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as Record<string, any>,
  );
  return dbContent;
}

async function checkUserAccess(userId?: string) {
  if (!userId) return false;
  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_productId: {
        userId: userId,
        productId: "ebook-tom-1",
      },
    },
  });
  return !!purchase;
}

// NOWA FUNKCJA DO POBIERANIA OPINII Z BAZY
async function getFeaturedReviews() {
  const reviewsDb = await prisma.review.findMany({
    where: {
      isFeatured: true,
    },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  return reviewsDb.map((review) => ({
    id: review.id,
    rating: review.rating,
    headline: review.headline,
    text: review.text,
    role: review.role,
    name: review.user.name || "Anonim",
    avatar: review.user.image || "/default-avatar.png",
  }));
}

/**
 * Awatary do dowodu społecznego w hero.
 *
 * Świadomie WYŁĄCZNIE autorki opinii, a nie wszyscy kupujący: ich zdjęcia są
 * już publiczne w sekcji opinii, więc hero nie dokłada żadnej nowej ekspozycji
 * danych osobowych. Pokazanie tam wizerunku każdej klientki razem z informacją
 * o zakupie byłoby publikacją danych bez jej zgody.
 *
 * Wyróżnione opinie idą pierwsze, bo są kuratorowane.
 */
async function getSocialProofAvatars() {
  const reviews = await prisma.review.findMany({
    where: { user: { image: { not: null } } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: { user: { select: { name: true, image: true } } },
  });

  return reviews.map((review) => ({
    src: review.user.image as string,
    name: review.user.name ?? "Czytelniczka",
  }));
}

export default async function Home() {
  const landingDataPromise = getLandingData();
  const sessionPromise = getServerSession(authOptions);
  // Pobieramy opinie równolegle
  const featuredReviewsPromise = getFeaturedReviews();

  const [landingData, session, featuredReviews, socialProofAvatars] =
    await Promise.all([
      landingDataPromise,
      sessionPromise,
      featuredReviewsPromise,
      getSocialProofAvatars(),
    ]);

  const hasAccess = await checkUserAccess(session?.user?.id);

  // Tworzymy połączony obiekt danych dla sekcji Testimonials
  // Bierzemy nagłówki z CMS (landingData), ale recenzje z naszej tabeli Review (featuredReviews)
  const testimonialsProps = {
    ...landingData.testimonials,
    reviews: featuredReviews,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JsonLd data={[organizationSchema(), websiteSchema(), ebookSchema()]} />
      <main className="flex-grow">
        <Hero
          data={landingData.hero}
          hasAccess={hasAccess}
          session={session}
          avatars={socialProofAvatars}
        />
        <div id="o-ebooku">
          <EbookFeatures
            data={landingData.ebookFeatures}
            hasAccess={hasAccess}
          />
          <ContentPreview data={landingData.contentPreview} />
        </div>
        {/* Przekazujemy połączone dane z CMS i bazy SQL */}
        <Testimonials data={testimonialsProps} />

        <SecurePanel data={landingData.securePanel} />
        <About data={landingData.about} />
        <PracticalTraining data={landingData.practicalTraining} />
      </main>
    </div>
  );
}
