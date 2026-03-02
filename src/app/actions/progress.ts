"use server"; // To kluczowe!

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
export async function markChapterAsReadAction(chapterSlug: string) {
  // 1. BEZPIECZEŃSTWO: Sprawdzamy sesję na serwerze
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  try {
    // 2. Logika biznesowa (Zapis do bazy)
    await prisma.userProgress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId: chapterSlug,
        },
      },
      update: {
        updatedAt: new Date(), // Aktualizujemy czas ostatniej wizyty
      },
      create: {
        userId,
        chapterId: chapterSlug,
      },
    });

    // 3. Odświeżenie cache (opcjonalne)
    // Dzięki temu jak wrócisz na Dashboard, pasek postępu będzie od razu zaktualizowany
    revalidatePath("/panel-kursanta");

    return { success: true };
  } catch (error) {
    console.error("Błąd zapisu postępu:", error);
    return { error: "Database error" };
  }
}

export async function getUserReadingStats(userId: string) {
  // 1. Policz ile jest WSZYSTKICH rozdziałów fizycznie na dysku
  const contentDir = path.join(process.cwd(), "content");

  // Zabezpieczenie: jeśli folder nie istnieje (np. błąd builda), zwróć 0
  if (!fs.existsSync(contentDir)) {
    return { percent: 0, lastSlug: null };
  }

  // Pobieramy tylko pliki .mdx
  const totalChapters = fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith(".mdx")).length;

  if (totalChapters === 0) {
    return { percent: 0, lastSlug: null };
  }

  // 2. Policz ile rozdziałów użytkownik ma w bazie danych (UserProgress)
  const readChaptersCount = await prisma.userProgress.count({
    where: {
      userId: userId,
    },
  });

  // 3. Znajdź ostatnio odwiedzony rozdział (żeby przycisk "Wznów" wiedział gdzie kierować)
  const lastRead = await prisma.userProgress.findFirst({
    where: {
      userId: userId,
    },
    orderBy: {
      updatedAt: "desc", // Sortujemy od najnowszej daty
    },
  });

  // 4. Oblicz procent (zaokrąglony do liczby całkowitej)
  // Math.min(100, ...) to zabezpieczenie, żeby nigdy nie pokazało np. 105%
  // jeśli kiedyś usuniesz jakiś plik z dysku, a w bazie zostanie wpis.
  const percent = Math.min(
    100,
    Math.round((readChaptersCount / totalChapters) * 100),
  );

  return {
    percent,
    lastSlug: lastRead?.chapterId || null, // Jeśli lastRead nie istnieje, zwróć null
  };
}

export async function resetUserProgressAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.id) {
    return { error: "Musisz być zalogowany" };
  }

  try {
    // Usuwamy wszystkie wpisy postępu dla tego użytkownika
    await prisma.userProgress.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    // Odświeżamy widok, żeby pasek spadł do 0%
    revalidatePath("/panel-kursanta");
    revalidatePath("/panel-kursanta/czytnik");

    return { success: true };
  } catch (error) {
    console.error("Błąd resetowania:", error);
    return { error: "Nie udało się wyzerować postępu" };
  }
}
