"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && session.user.role === "admin";
}

export interface AdminNotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string; // ISO — bezpieczne do przekazania do klienta
}

/** Pobiera ostatnie powiadomienia + liczbę nieprzeczytanych (tylko admin). */
export async function getAdminNotifications(
  limit = 20,
): Promise<{ items: AdminNotificationDTO[]; unread: number }> {
  if (!(await isAdmin())) return { items: [], unread: 0 };

  const [items, unread] = await Promise.all([
    prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.adminNotification.count({ where: { read: false } }),
  ]);

  return {
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      url: n.url,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unread,
  };
}

/** Oznacza wszystkie powiadomienia jako przeczytane. */
export async function markAllNotificationsRead() {
  if (!(await isAdmin())) return { error: "Brak uprawnień." };

  await prisma.adminNotification.updateMany({
    where: { read: false },
    data: { read: true },
  });
  return { success: true };
}

/** Oznacza pojedyncze powiadomienie jako przeczytane. */
export async function markNotificationRead(id: string) {
  if (!(await isAdmin())) return { error: "Brak uprawnień." };

  await prisma.adminNotification.update({
    where: { id },
    data: { read: true },
  });
  return { success: true };
}
