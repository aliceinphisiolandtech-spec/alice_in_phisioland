import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

/**
 * Centralny moduł wysyłania powiadomień administracyjnych (push przez OneSignal
 * + zapis historii w bazie).
 *
 * Założenia:
 * - Push trafia WYŁĄCZNIE na urządzenia oznaczone tagiem `role = admin`
 *   (tag ustawia komponent NotificationsBell w panelu admina). Dzięki temu
 *   kursanci nigdy nie zobaczą powiadomień o sprzedaży.
 * - Każde powiadomienie zapisujemy też w tabeli AdminNotification — żeby admin
 *   miał historię/audyt nawet jeśli nie miał włączonych pushy na danym urządzeniu.
 * - Funkcje nigdy nie rzucają wyjątkiem na zewnątrz: błąd wysyłki nie może
 *   wywrócić webhooka płatności ani crona.
 */

export type AdminNotificationType =
  | "sale"
  | "abandoned_cart"
  | "coupon_exhausted"
  | "coupon_expired";

interface SendAdminPushArgs {
  type: AdminNotificationType;
  title: string;
  body: string;
  /** Adres otwierany po kliknięciu w powiadomienie. Domyślnie /admin. */
  url?: string;
  /** Dowolne dane pomocnicze, np. { orderId, amount }. */
  metadata?: Record<string, unknown>;
}

const ONESIGNAL_ENDPOINT = "https://onesignal.com/api/v1/notifications";

/** Formatuje kwotę w groszach do czytelnego stringa, np. 10900 -> "109,00 zł". */
export function formatGrosze(amount: number, currency = "PLN") {
  return (amount / 100).toLocaleString("pl-PL", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

/**
 * Zapisuje powiadomienie w bazie i (jeśli OneSignal skonfigurowany) wysyła push
 * na urządzenia admina. Zwraca utworzony rekord (lub null gdy zapis się nie udał).
 */
export async function sendAdminPush({
  type,
  title,
  body,
  url,
  metadata,
}: SendAdminPushArgs) {
  const targetUrl = url ?? `${process.env.NEXTAUTH_URL}/admin`;

  // 1. Historia w bazie — niezależnie od powodzenia pusha.
  let saved = null;
  try {
    saved = await prisma.adminNotification.create({
      data: {
        type,
        title,
        body,
        url: targetUrl,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("❌ Nie udało się zapisać AdminNotification:", error);
  }

  // 2. Push przez OneSignal — tylko urządzenia z tagiem role=admin.
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  // OneSignal nazywa ten klucz „REST API Key" i pod taką nazwą leży w .env,
  // ale część środowisk ma go jeszcze pod starszym ONESIGNAL_API_KEY.
  // Czytamy oba, żeby push nie znikał po cichu przy rozjeździe nazw.
  const apiKey =
    process.env.ONESIGNAL_REST_API_KEY || process.env.ONESIGNAL_API_KEY;

  if (!appId || !apiKey) {
    console.warn(
      "⚠️ Brak NEXT_PUBLIC_ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY — pomijam push (zapisano tylko w bazie).",
    );
    return saved;
  }

  try {
    const response = await fetch(ONESIGNAL_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        // Kierujemy po tagu — wyłącznie urządzenia admina.
        filters: [
          { field: "tag", key: "role", relation: "=", value: "admin" },
        ],
        headings: { en: title, pl: title },
        contents: { en: body, pl: body },
        url: targetUrl,
        // Pozwala pominąć wysyłkę gdy 0 odbiorców (admin nie włączył pushy) bez błędu.
        // OneSignal zwróci wtedy "All included players are not subscribed".
      }),
    });

    const data = await response.json();
    if (data.errors) {
      // "All included players are not subscribed" to normalny przypadek (brak urządzeń) — logujemy jako info.
      console.warn("⚠️ OneSignal (admin push):", data.errors);
    } else {
      console.log(`✅ Push admina wysłany (${type}), id: ${data.id}`);
    }
  } catch (error) {
    console.error("❌ Błąd połączenia z OneSignal (admin push):", error);
  }

  return saved;
}

/** Minimalny kształt zamówienia potrzebny do treści powiadomień. */
interface OrderLike {
  id: string;
  amount: number;
  currency: string;
  billingName?: string | null;
  discountCode?: string | null;
  discountAmount?: number | null;
}

/** Powiadomienie o udanej sprzedaży (wołane z webhooka Stripe). */
export async function notifyPurchase(order: OrderLike) {
  const name = order.billingName?.trim() || "Klient";
  const price = formatGrosze(order.amount, order.currency);

  // Jeśli zamówienie poszło z kodem rabatowym, admin widzi to od razu w pushu.
  const discountInfo = order.discountCode
    ? ` (kod ${order.discountCode}, −${formatGrosze(order.discountAmount ?? 0, order.currency)})`
    : "";

  return sendAdminPush({
    type: "sale",
    title: "💰 Nowa sprzedaż!",
    body: `${name} kupił(a) e-booka za ${price}${discountInfo}.`,
    url: `${process.env.NEXTAUTH_URL}/admin`,
    metadata: {
      orderId: order.id,
      amount: order.amount,
      discountCode: order.discountCode ?? null,
      discountAmount: order.discountAmount ?? null,
    },
  });
}

/**
 * Pula użyć wyczerpana — wspólne dla kodów, przecen i zniżek mailowych
 * (wołane z webhooka po ostatnim zakupie mieszczącym się w limicie).
 */
export async function notifyDiscountExhausted(discount: {
  /** "Kod rabatowy" / "Przecena" / "Zniżka dla wybranych osób". */
  label: string;
  name: string;
  usedCount: number;
  usageLimit: number;
}) {
  return sendAdminPush({
    type: "coupon_exhausted",
    title: "🎟️ Limit promocji wyczerpany",
    body: `${discount.label} „${discount.name}” osiągnęła limit ${discount.usageLimit} użyć i przestała działać w koszyku.`,
    url: `${process.env.NEXTAUTH_URL}/admin/rabaty`,
    metadata: {
      label: discount.label,
      name: discount.name,
      usedCount: discount.usedCount,
      usageLimit: discount.usageLimit,
    },
  });
}

/** Kod rabatowy przekroczył datę ważności (wołane z codziennego crona). */
export async function notifyCouponExpired(coupon: {
  code: string;
  usedCount: number;
}) {
  return sendAdminPush({
    type: "coupon_expired",
    title: "⏳ Promocja zakończona",
    body: `Kod ${coupon.code} przekroczył datę ważności i został wyłączony. Wykorzystano go ${coupon.usedCount} raz(y).`,
    url: `${process.env.NEXTAUTH_URL}/admin/rabaty`,
    metadata: { code: coupon.code, usedCount: coupon.usedCount },
  });
}

/** Powiadomienie o porzuconym koszyku (wołane z crona). */
export async function notifyAbandonedCart(order: OrderLike) {
  const name = order.billingName?.trim() || "Klient";
  const price = formatGrosze(order.amount, order.currency);

  return sendAdminPush({
    type: "abandoned_cart",
    title: "🛒 Porzucony koszyk",
    body: `${name} rozpoczął(ęła) zakup (${price}), ale nie dokończył(a) płatności.`,
    url: `${process.env.NEXTAUTH_URL}/admin`,
    metadata: { orderId: order.id, amount: order.amount },
  });
}
