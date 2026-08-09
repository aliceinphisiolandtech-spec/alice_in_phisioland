"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  SaveWaitlistPageSchema,
  type SaveWaitlistPageInput,
} from "@/lib/validators/waitlist";

/**
 * Kreator stron zapisów — operacje z panelu admina.
 *
 * Każda akcja zwraca `{ error }` albo `{ success: true }` zamiast rzucać
 * wyjątkiem: formularz w panelu pokazuje komunikat przy polu, a nie ekran
 * błędu Next.js. Tak samo działają akcje rabatów (`app/actions/discounts.ts`).
 */

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return session;
}

/** Odświeżamy i panel, i stronę publiczną — treść kampanii żyje w obu miejscach. */
function revalidateWaitlist(slug?: string) {
  revalidatePath("/admin/zapisy");
  if (slug) revalidatePath(`/zapisy/${slug}`);
}

/** Wejście z formularza -> dane do zapisu. */
function toDbData(input: SaveWaitlistPageInput) {
  return {
    slug: input.slug,
    name: input.name,
    headline: input.headline,
    highlight: input.highlight,
    description: input.description,
    ctaLabel: input.ctaLabel,
    footnote: input.footnote,
    successTitle: input.successTitle,
    successMessage: input.successMessage,
    consentText: input.consentText,
    mailerliteGroupId: input.mailerliteGroupId,
    collectName: input.collectName,
    layoutVariant: input.layoutVariant,
    theme: input.theme,
    heroImageUrl: input.heroImageUrl,
    ogImageUrl: input.ogImageUrl,
    backgroundImageUrl: input.backgroundImageUrl,
    overlayOpacity: input.overlayOpacity,
    isActive: input.isActive,
    opensAt: input.opensAt ? new Date(input.opensAt) : null,
    closesAt: input.closesAt ? new Date(input.closesAt) : null,
    maxSignups: input.maxSignups,
    closedMessage: input.closedMessage,
  };
}

/**
 * Kolizja sluga to jedyny realny konflikt przy zapisie — nazywamy go wprost.
 *
 * Sprawdzamy sam kod błędu, bez `instanceof PrismaClientKnownRequestError`:
 * ten sam moduł bywa zbundlowany dwa razy (osobno dla server actions, osobno
 * dla route handlerów), a wtedy `instanceof` porównuje dwie różne klasy o tej
 * samej nazwie i milcząco zwraca false. Napis z kodem przechodzi zawsze.
 */
function isSlugCollision(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

const SLUG_TAKEN = "Strona o takim adresie już istnieje. Wybierz inny adres.";

/* -------------------------------------------------------------------------- */
/* Tworzenie i edycja                                                          */
/* -------------------------------------------------------------------------- */

export async function createWaitlistPageAction(input: SaveWaitlistPageInput) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const validation = SaveWaitlistPageSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const page = await prisma.waitlistPage.create({
      data: toDbData(validation.data),
    });

    revalidateWaitlist(page.slug);
    return { success: true, id: page.id };
  } catch (error) {
    // Unikalność sluga pilnuje baza, nie wcześniejsze `findUnique` — między
    // sprawdzeniem a zapisem mogłaby powstać druga strona z tym samym adresem.
    if (isSlugCollision(error)) return { error: SLUG_TAKEN };

    console.error("[WAITLIST_CREATE_ERROR]", error);
    return { error: "Błąd bazy danych podczas tworzenia strony." };
  }
}

export async function updateWaitlistPageAction(
  id: string,
  input: SaveWaitlistPageInput,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  const validation = SaveWaitlistPageSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const previous = await prisma.waitlistPage.findUnique({
      where: { id },
      select: { slug: true },
    });

    if (!previous) return { error: "Nie znaleziono tej strony zapisów." };

    const page = await prisma.waitlistPage.update({
      where: { id },
      data: toDbData(validation.data),
    });

    // Po zmianie adresu odświeżamy też stary — inaczej zostałby w cache
    // i pod nieaktualnym linkiem dalej wyświetlałaby się treść kampanii.
    revalidateWaitlist(page.slug);
    if (previous.slug !== page.slug) revalidatePath(`/zapisy/${previous.slug}`);

    return { success: true };
  } catch (error) {
    if (isSlugCollision(error)) return { error: SLUG_TAKEN };

    console.error("[WAITLIST_UPDATE_ERROR]", error);
    return { error: "Błąd bazy danych podczas zapisywania strony." };
  }
}

/* -------------------------------------------------------------------------- */
/* Operacje na liście                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Włącznik zapisów. Osobna akcja zamiast pełnego zapisu formularza, bo to
 * najczęstsza operacja („zamykam kampanię") i ma działać jednym kliknięciem
 * z listy, bez wchodzenia w edycję.
 */
export async function toggleWaitlistPageAction(id: string, isActive: boolean) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    const page = await prisma.waitlistPage.update({
      where: { id },
      data: { isActive },
      select: { slug: true },
    });

    revalidateWaitlist(page.slug);
    return { success: true };
  } catch (error) {
    console.error("[WAITLIST_TOGGLE_ERROR]", error);
    return { error: "Nie udało się zmienić statusu strony." };
  }
}

/**
 * Kopia istniejącej kampanii jako punkt wyjścia dla następnej.
 *
 * To jest sedno tego, po co powstał kreator: kolejna akcja marketingowa
 * różni się zwykle nagłówkiem i terminem, a nie całą treścią. Kopia startuje
 * WYŁĄCZONA i bez zebranych kontaktów — publikacja ma być świadomą decyzją,
 * a lista zapisanych osób należy do konkretnej kampanii i jej zgody.
 */
export async function duplicateWaitlistPageAction(id: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    const source = await prisma.waitlistPage.findUnique({ where: { id } });
    if (!source) return { error: "Nie znaleziono tej strony zapisów." };

    const slug = await findFreeSlug(source.slug);

    await prisma.waitlistPage.create({
      data: {
        slug,
        name: `${source.name} (kopia)`,
        headline: source.headline,
        highlight: source.highlight,
        description: source.description,
        ctaLabel: source.ctaLabel,
        footnote: source.footnote,
        successTitle: source.successTitle,
        successMessage: source.successMessage,
        consentText: source.consentText,
        mailerliteGroupId: source.mailerliteGroupId,
        collectName: source.collectName,
        layoutVariant: source.layoutVariant,
        theme: source.theme,
        heroImageUrl: source.heroImageUrl,
        ogImageUrl: source.ogImageUrl,
        backgroundImageUrl: source.backgroundImageUrl,
        overlayOpacity: source.overlayOpacity,
        closedMessage: source.closedMessage,
        // Kopia nie dziedziczy okna czasowego ani stanu włączenia — daty
        // z poprzedniej akcji prawie zawsze są już przeszłe.
        isActive: false,
        opensAt: null,
        closesAt: null,
      },
    });

    revalidateWaitlist();
    return { success: true, slug };
  } catch (error) {
    console.error("[WAITLIST_DUPLICATE_ERROR]", error);
    return { error: "Nie udało się skopiować strony." };
  }
}

/**
 * Znajduje wolny adres w formie `<slug>-2`, `<slug>-3`…
 *
 * Pętla, a nie jedno zapytanie z licznikiem: adresy mogą być usuwane, więc
 * „liczba kopii + 1" potrafiłaby trafić w zajęty numer.
 */
async function findFreeSlug(base: string): Promise<string> {
  // Kopia kopii nie ma być „lato-2-2" — obcinamy istniejący sufiks numeryczny.
  const root = base.replace(/-\d+$/, "");

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${root}-${suffix}`.slice(0, 60);
    const taken = await prisma.waitlistPage.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!taken) return candidate;
  }

  // Sto kopii tej samej kampanii to nie jest scenariusz, pod który warto
  // projektować — ale nie zostawiamy funkcji bez wartości zwracanej.
  return `${root}-${Date.now()}`.slice(0, 60);
}

/**
 * Usunięcie kampanii razem z zebranymi kontaktami (kaskada w bazie).
 *
 * Wymaga podania liczby zapisanych osób z widoku listy — jeśli w międzyczasie
 * ktoś się zapisał, operacja jest odrzucana. Bez tego łatwo skasować kampanię,
 * która wygląda na pustą, bo lista w przeglądarce jest sprzed dziesięciu minut.
 */
export async function deleteWaitlistPageAction(
  id: string,
  expectedSubscribers: number,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Brak uprawnień administratora." };

  try {
    const actual = await prisma.waitlistSubscriber.count({
      where: { pageId: id },
    });

    if (actual !== expectedSubscribers) {
      return {
        error:
          `Lista zapisów zmieniła się od czasu wczytania strony ` +
          `(teraz ${actual} zamiast ${expectedSubscribers}). Odśwież i sprawdź, ` +
          `zanim usuniesz kampanię.`,
      };
    }

    const page = await prisma.waitlistPage.delete({
      where: { id },
      select: { slug: true },
    });

    revalidateWaitlist(page.slug);
    return { success: true };
  } catch (error) {
    console.error("[WAITLIST_DELETE_ERROR]", error);
    return { error: "Nie udało się usunąć strony." };
  }
}
