import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { FEATURED_REVIEWS_LIMIT } from "@/lib/reviews";

/**
 * Cache danych publicznych stron (landing, logowanie, strefa pacjenta).
 *
 * Same strony zostają dynamiczne — czytają sesję (navbar, „masz już dostęp”,
 * przekierowanie zalogowanych) — ale treści z CMS i opinie nie zależą od
 * tego, kto patrzy, więc nie ma sensu pytać o nie bazy przy każdym wejściu.
 *
 * Cache czyszczą od razu:
 * - zapis sekcji w CMS → tag CMS_TAG (api/admin/cms/[key]),
 * - nowa/zmieniona/usunięta opinia albo zmiana wyróżnienia → tag REVIEWS_TAG.
 * `revalidate` to tylko siatka bezpieczeństwa, gdyby coś zmieniło bazę obok
 * aplikacji (np. ręczna edycja w Prisma Studio).
 */
export const CMS_TAG = "cms-sections";
export const REVIEWS_TAG = "reviews";

const ONE_HOUR = 60 * 60;

/** Wszystkie sekcje CMS jako { klucz: treść }. */
export const getCachedSections = unstable_cache(
  async () => {
    const sections = await prisma.section.findMany();
    return sections.reduce(
      (acc, section) => {
        acc[section.key] = section.content;
        return acc;
      },
      {} as Record<string, unknown>,
    );
  },
  ["cms-sections"],
  { tags: [CMS_TAG], revalidate: ONE_HOUR },
);

/** Wyróżnione opinie do sekcji opinii na stronie głównej. */
export const getCachedFeaturedReviews = unstable_cache(
  async () => {
    const reviews = await prisma.review.findMany({
      where: { isFeatured: true },
      take: FEATURED_REVIEWS_LIMIT,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, image: true } } },
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      headline: review.headline,
      text: review.text,
      role: review.role,
      name: review.user.name || "Anonim",
      avatar: review.user.image || "/default-avatar.png",
    }));
  },
  ["featured-reviews"],
  { tags: [REVIEWS_TAG], revalidate: ONE_HOUR },
);

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
export const getCachedSocialProofAvatars = unstable_cache(
  async () => {
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
  },
  ["social-proof-avatars"],
  { tags: [REVIEWS_TAG], revalidate: ONE_HOUR },
);
