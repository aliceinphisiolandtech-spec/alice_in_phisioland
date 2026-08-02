"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // Upewnij się, że ścieżka jest poprawna
import { getServerSession } from "next-auth";

export async function getOrdersPage(page: number, itemsPerPage: number = 5) {
  const session = await getServerSession(authOptions);
  console.log(session);

  // 2. BEZPIECZEŃSTWO: Weryfikacja
  if (!session || !session.user) {
    throw new Error("Brak autoryzacji. Zaloguj się.");
  }

  // Jeśli masz w aplikacji role, warto sprawdzić też rolę admina!
  // Przykład:
  if (session.user.role !== "admin") {
    throw new Error("Brak uprawnień do przeglądania zamówień.");
  }

  const skip = (page - 1) * itemsPerPage;

  const rawOrders = await prisma.order.findMany({
    // Zakupy testowe z piaskownicy nie są sprzedażą — ten sam filtr co
    // w statystykach dashboardu (src/app/admin/page.tsx).
    where: { isSandbox: false },
    skip,
    take: itemsPerPage,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return rawOrders.map((order) => {
    const displayName =
      order.billingName || order.user?.name || "Nieznany Klient";
    return {
      id: order.id,
      name: displayName,
      productId: order.paymentIntentId?.slice(-6) || "Wiele",
      status: order.status,
      amount: order.amount / 100,
      avatar: displayName.substring(0, 2).toUpperCase(),
      discountCode: order.discountCode,
      originalAmount: order.originalAmount ? order.originalAmount / 100 : null,
    };
  });
}
