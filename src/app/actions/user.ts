// app/actions/user.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markFirstLoginComplete() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isFirstLogin: false },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark first login complete:", error);
    return { success: false, error: "Database error" };
  }
}
