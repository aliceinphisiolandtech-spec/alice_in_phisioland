// app/actions/review.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Lista maili, których opinie mają być promowane na Landing Page
const FEATURED_EMAILS = [
  "dstolarczyk6231@gmail.com",
  "highland.therapist@gmail.com",
  "e.kulmaczewska@gmail.com", // znormalizowane do małych liter
  "orlowska.katarzynaaa@gmail.com",
  "jangryczka21@gmail.com",
  "piotr.eher@gmail.com",
].map((email) => email.toLowerCase().trim());

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

  // Sprawdzamy, czy użytkownik jest na liście wyróżnionych
  const userEmail = session.user.email?.toLowerCase().trim();
  const isFeatured = userEmail ? FEATURED_EMAILS.includes(userEmail) : false;

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
          isFeatured, // Aktualizujemy flagę na wypadek zmiany listy maili
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
          isFeatured, // Nadajemy flagę true jeśli mail jest na liście
        },
      });
    }

    // Rewalidujemy stronę kursanta oraz stronę główną (landing page), żeby nowa opinia się pojawiła
    revalidatePath("/panel-kursanta");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Błąd zapisu/aktualizacji opinii:", error);
    return { error: "Coś poszło nie tak przy zapisywaniu." };
  }
}
