// app/page.tsx
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

export default async function Home() {
  const landingDataPromise = getLandingData();
  const sessionPromise = getServerSession(authOptions);
  // Pobieramy opinie równolegle
  const featuredReviewsPromise = getFeaturedReviews();

  const [landingData, session, featuredReviews] = await Promise.all([
    landingDataPromise,
    sessionPromise,
    featuredReviewsPromise,
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
      <main className="flex-grow">
        <Hero data={landingData.hero} hasAccess={hasAccess} session={session} />
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
