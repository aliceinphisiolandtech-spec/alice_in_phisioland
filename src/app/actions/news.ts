"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return { error: "Brak uprawnień administratora." };
  }

  const validation = NewsSchema.safeParse({ title, content, sendPush });

  if (!validation.success) {
    return { error: "Błędne dane: " + validation.error.issues[0].message };
  }

  try {
    // 1. Zapis do bazy
    const newNews = await prisma.news.create({
      data: {
        title: validation.data.title,
        content: validation.data.content,
        important: validation.data.sendPush,
        published: true,
      },
    });

    // 2. Obsługa OneSignal (REST API)
    if (validation.data.sendPush) {
      console.log(`🚀 Wysyłanie do OneSignal: "${title}"`);

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          included_segments: ["All"], // Lub ["Subscribed Users"]
          headings: { en: "Nowość w panelu!", pl: title },
          contents: {
            en: "Check out the new update.",
            pl: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          },
          url: `${process.env.NEXTAUTH_URL}/panel-kursanta/aktualnosci`, // Link po kliknięciu
        }),
      };

      try {
        const response = await fetch(
          "https://onesignal.com/api/v1/notifications",
          options,
        );
        const data = await response.json();
        if (data.errors) {
          console.error("❌ OneSignal Error:", data.errors);
        } else {
          console.log("✅ OneSignal Success:", data);
        }
      } catch (pushError) {
        console.error("❌ Błąd połączenia z OneSignal:", pushError);
        // Nie przerywamy funkcji, bo news w bazie już jest
      }
    }

    revalidatePath("/admin/news");
    revalidatePath("/panel-kursanta");
    return { success: true };
  } catch (error) {
    console.error("News create error:", error);
    return { error: "Błąd bazy danych podczas tworzenia aktualności." };
  }
}
