// app/actions/review.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, updateTag } from "next/cache";
import { REVIEWS_TAG } from "@/lib/cached-content";

// O tym, które opinie trafiają na stronę główną, decyduje admin w panelu
// /admin/opinie (pole isFeatured). Nowa opinia startuje jako niewyróżniona.

export async function createReviewAction(
  rating: number,
  headline: string,
  text: string,
  role: string,
) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.id) {
    return { error: "Musisz być zalogowany." };
  }

  const hasPurchased = await prisma.purchase.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: "ebook-tom-1",
      },
    },
  });

  if (!hasPurchased) {
    return { error: "Musisz posiadać e-booka, aby wystawić opinię." };
  }

  if (rating < 1 || rating > 5) {
    return { error: "Ocena musi być między 1 a 5." };
  }

  // Walidacja pól tekstowych
  if (!headline || headline.trim().length === 0) {
    return { error: "Musisz podać krótki nagłówek opinii." };
  }
  if (!role || role.trim().length === 0) {
    return { error: "Musisz podać swój zawód lub tytuł." };
  }
  if (!text || text.trim().length === 0) {
    return { error: "Musisz napisać pełną opinię." };
  }

  try {
    // Sprawdzamy, czy użytkownik ma już opinię
    const existing = await prisma.review.findFirst({
      where: { userId: session.user.id },
    });

    if (existing) {
      // AKTUALIZACJA: Jeśli opinia istnieje, nadpisujemy ją nowymi danymi
      await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating,
          headline,
          text,
          role,
          // isFeatured bez zmian — to decyzja admina, nie autorki.
        },
      });
    } else {
      // TWORZENIE: Jeśli opinii nie ma, tworzymy nową
      await prisma.review.create({
        data: {
          userId: session.user.id,
          rating,
          headline,
          text,
          role,
        },
      });
    }

    // Rewalidujemy stronę kursanta oraz stronę główną (landing page), żeby nowa opinia się pojawiła
    updateTag(REVIEWS_TAG);
    revalidatePath("/panel-kursanta");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Błąd zapisu/aktualizacji opinii:", error);
    return { error: "Coś poszło nie tak przy zapisywaniu." };
  }
}
