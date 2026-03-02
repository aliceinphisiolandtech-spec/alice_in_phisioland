"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Upewnij się co do ścieżki

// Schemat walidacji
const NewsSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć min. 3 znaki"),
  content: z.string().min(10, "Treść musi mieć min. 10 znaków"),
  sendPush: z.boolean(),
});

export async function createNewsAction(
  title: string,
  content: string,
  sendPush: boolean,
) {
  // 1. Weryfikacja uprawnień (Security)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return { error: "Brak uprawnień administratora." };
  }

  // 2. Walidacja danych wejściowych
  const validation = NewsSchema.safeParse({ title, content, sendPush });

  if (!validation.success) {
    return { error: "Błędne dane: " + validation.error.issues[0].message };
  }

  try {
    // 3. Zapis do bazy danych
    const newNews = await prisma.news.create({
      data: {
        title: validation.data.title,
        content: validation.data.content,
        // Mapujemy "sendPush" na flagę "important" w bazie (żeby wyróżnić wizualnie)
        important: validation.data.sendPush,
        published: true,
      },
    });

    // 4. Obsługa Powiadomień PUSH
    if (validation.data.sendPush) {
      // TUTAJ BĘDZIE LOGIKA WYSYŁANIA POWIADOMIEŃ
      // Np. wywołanie OneSignal, Firebase lub WebPush API
      console.log(
        `🚀 WYSYŁANIE PUSH: "${title}" do wszystkich użytkowników...`,
      );

      // await sendPushNotificationToAllUsers({
      //   title: newNews.title,
      //   body: newNews.content.substring(0, 50) + "...",
      //   url: `/panel-kursanta`
      // });
    }

    revalidatePath("/admin/news");
    revalidatePath("/panel-kursanta"); // Żeby kursanci od razu widzieli
    return { success: true };
  } catch (error) {
    console.error("News create error:", error);
    return { error: "Błąd bazy danych podczas tworzenia aktualności." };
  }
}

export async function deleteNewsAction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return { error: "Unauthorized" };

  try {
    await prisma.news.delete({ where: { id } });
    revalidatePath("/admin/news");
    revalidatePath("/panel-kursanta");
    return { success: true };
  } catch (error) {
    return { error: "Nie udało się usunąć" };
  }
}
