import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { TicketPercent } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getPricingSettings } from "@/lib/pricing-settings";
import { resolveCheckoutPricing } from "@/lib/checkout-pricing";
import { evaluateDiscount } from "@/lib/discounts";
import { DiscountsTabs } from "./DiscountsTabs";
import { LivePriceHeader } from "./LivePriceHeader";
import type {
  DiscountRow,
  EmailDiscountRow,
  PricingSettingsRow,
  SaleRow,
} from "./types";

// Panel jest w pełni dynamiczny — po przełączeniu promocji admin musi od razu
// widzieć aktualny stan, a nie wersję z cache.
export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const [codes, sales, emailDiscounts, settings] = await Promise.all([
    prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.sale.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.emailDiscount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        members: {
          orderBy: { createdAt: "asc" },
          select: { id: true, email: true },
        },
      },
    }),
    getPricingSettings(),
  ]);

  // Statystyki liczone z zamówień, nie z liczników — pokazują realny koszt akcji.
  // Zakupy testowe z piaskownicy są wykluczone, żeby nie zawyżały kwot rabatów.
  const REAL = { isSandbox: false, status: "succeeded" } as const;

  const [codeSums, saleSums, emailSums] = await Promise.all([
    prisma.order.groupBy({
      by: ["discountCodeId"],
      where: { ...REAL, discountCodeId: { not: null } },
      _sum: { discountAmount: true },
    }),
    prisma.order.groupBy({
      by: ["saleName"],
      where: { ...REAL, saleName: { not: null } },
      _count: { _all: true },
      _sum: { saleAmount: true },
    }),
    prisma.order.groupBy({
      by: ["emailDiscountName"],
      where: { ...REAL, emailDiscountName: { not: null } },
      _count: { _all: true },
      _sum: { emailDiscountAmount: true },
    }),
  ]);

  const codeSumById = new Map(
    codeSums.map((row) => [row.discountCodeId, row._sum.discountAmount ?? 0]),
  );
  // Przeceny i zniżki mailowe wiążemy po nazwie ze snapshotu zamówienia —
  // po zmianie nazwy statystyka startuje od nowa, historia zamówień zostaje.
  const saleStatsByName = new Map(
    saleSums.map((row) => [
      row.saleName,
      { count: row._count._all, sum: row._sum.saleAmount ?? 0 },
    ]),
  );
  const emailStatsByName = new Map(
    emailSums.map((row) => [
      row.emailDiscountName,
      { count: row._count._all, sum: row._sum.emailDiscountAmount ?? 0 },
    ]),
  );

  const codeRows: DiscountRow[] = codes.map((code) => ({
    id: code.id,
    code: code.code,
    type: code.type === "amount" ? "amount" : "percent",
    percentOff: code.percentOff,
    amountOff: code.amountOff,
    isActive: code.isActive,
    usageLimit: code.usageLimit,
    usedCount: code.usedCount,
    validFrom: code.validFrom?.toISOString() ?? null,
    validUntil: code.validUntil?.toISOString() ?? null,
    isSandbox: code.isSandbox,
    stackableWithSale: code.stackableWithSale,
    totalDiscountGrosze: codeSumById.get(code.id) ?? 0,
  }));

  const saleRows: SaleRow[] = sales.map((sale) => {
    const stats = saleStatsByName.get(sale.name);

    return {
      id: sale.id,
      name: sale.name,
      type: sale.type === "fixed_price" ? "fixed_price" : "percent",
      percentOff: sale.percentOff,
      fixedPrice: sale.fixedPrice,
      usageLimit: sale.usageLimit,
      usedCount: sale.usedCount,
      isActive: sale.isActive,
      validFrom: sale.validFrom?.toISOString() ?? null,
      validUntil: sale.validUntil?.toISOString() ?? null,
      isSandbox: sale.isSandbox,
      ordersCount: stats?.count ?? 0,
      totalDiscountGrosze: stats?.sum ?? 0,
    };
  });

  const emailRows: EmailDiscountRow[] = emailDiscounts.map((discount) => {
    const stats = emailStatsByName.get(discount.name);

    return {
      id: discount.id,
      name: discount.name,
      type: discount.type === "amount" ? "amount" : "percent",
      percentOff: discount.percentOff,
      amountOff: discount.amountOff,
      usageLimit: discount.usageLimit,
      usedCount: discount.usedCount,
      isActive: discount.isActive,
      validFrom: discount.validFrom?.toISOString() ?? null,
      validUntil: discount.validUntil?.toISOString() ?? null,
      isSandbox: discount.isSandbox,
      members: discount.members,
      ordersCount: stats?.count ?? 0,
      totalDiscountGrosze: stats?.sum ?? 0,
    };
  });

  const settingsRow: PricingSettingsRow = settings;

  // Widok „z zewnątrz": ta sama funkcja co koszyk, ale bez piaskownicy i bez
  // adresu — czyli dokładnie to, co zobaczy przypadkowa klientka.
  const customerView = await resolveCheckoutPricing({ isAdmin: false });

  // Widok admina w piaskownicy: cena testowa + rabaty oznaczone jako testowe.
  // Dokładnie to, co zobaczy w koszyku — bez tego cena testowa wygląda
  // w panelu na liczbę, która na nic nie wpływa.
  const session = await getServerSession(authOptions);
  const sandboxView = settings.sandboxEnabled
    ? (
        await resolveCheckoutPricing({
          email: session?.user?.email,
          isAdmin: true,
        })
      ).pricing
    : null;

  // Zniżki mailowe działają per adres, więc do wspólnej kwoty ich nie wliczamy —
  // tylko sygnalizujemy, że są czynne.
  const activeEmailDiscounts = emailDiscounts.filter(
    (discount) => !discount.isSandbox && evaluateDiscount(discount).usable,
  ).length;

  const sandboxItemCount =
    codeRows.filter((row) => row.isSandbox).length +
    saleRows.filter((row) => row.isSandbox).length +
    emailRows.filter((row) => row.isSandbox).length;

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-[#0c493e] p-2.5 text-white">
          <TicketPercent size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rabaty</h1>
          <p className="text-sm text-gray-500">
            Kody, przeceny i zniżki dla wybranych osób.
          </p>
        </div>
      </div>

      <LivePriceHeader
        pricing={customerView.pricing}
        activeEmailDiscounts={activeEmailDiscounts}
        basePrice={settingsRow.basePriceGrosze}
        sandboxBasePrice={settingsRow.sandboxBasePriceGrosze}
        sandboxPricing={sandboxView}
        sandboxEnabled={settingsRow.sandboxEnabled}
        sandboxItemCount={sandboxItemCount}
      />

      <DiscountsTabs
        codes={codeRows}
        sales={saleRows}
        emailDiscounts={emailRows}
        basePrice={settingsRow.basePriceGrosze}
      />
    </div>
  );
}
