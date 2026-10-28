"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, updateTag } from "next/cache";
import { REVIEWS_TAG } from "@/lib/cached-content";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return null;
  }
  return session;
}

function revalidateReviews() {
  updateTag(REVIEWS_TAG);
  revalidatePath("/admin/opinie");
  // Strona główna pokazuje wyróżnione opinie i awatary ich autorek.
  revalidatePath("/");
  revalidatePath("/panel-kursanta");
}

/** Pokazuje albo ukrywa opinię w sekcji opinii na stronie głównej. */
export async function setReviewFeaturedAction(id: string, featured: boolean) {
  if (!(await requireAdmin())) {
    return { error: "Brak uprawnień." };
  }

  try {
    await prisma.review.update({
      where: { id },
      data: { isFeatured: featured },
    });
    revalidateReviews();
    return { success: true };
  } catch (error) {
    console.error("Błąd zmiany wyróżnienia opinii:", error);
    return { error: "Nie udało się zapisać zmiany." };
  }
}

/** Trwale usuwa opinię. Autorka może potem wystawić nową z panelu kursanta. */
export async function deleteReviewAction(id: string) {
  if (!(await requireAdmin())) {
    return { error: "Brak uprawnień." };
  }

  try {
    await prisma.review.delete({ where: { id } });
    revalidateReviews();
    return { success: true };
  } catch (error) {
    console.error("Błąd usuwania opinii:", error);
    return { error: "Nie udało się usunąć opinii." };
  }
}
