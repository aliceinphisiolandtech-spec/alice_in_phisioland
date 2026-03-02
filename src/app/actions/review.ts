"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createReviewAction(rating: number, comment: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.id) {
    return { error: "Musisz być zalogowany." };
  }

  const existing = await prisma.review.findFirst({
    where: { userId: session.user.id },
  });

  if (existing) {
    return { error: "Już oceniłeś ten kurs!" };
  }

  if (rating < 1 || rating > 5) {
    return { error: "Ocena musi być między 1 a 5." };
  }

  try {
    await prisma.review.create({
      data: {
        userId: session.user.id,
        rating,
        comment,
      },
    });

    revalidatePath("/panel-kursanta");
    return { success: true };
  } catch (error) {
    console.error("Błąd zapisu opinii:", error);
    return { error: "Coś poszło nie tak przy zapisywaniu." };
  }
}
