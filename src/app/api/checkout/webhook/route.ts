import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/utils/stripe";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { createFakturowniaInvoice } from "@/app/actions/fakturownia"; // Upewnij się, że ścieżka jest poprawna
import { notifyPurchase } from "@/lib/notifications";
import { registerDiscountUsage } from "@/lib/discount-usage";
import { formatPln } from "@/lib/pricing";

export async function POST(req: Request) {
  const body = await req.text();
  const resolvedHeaders = await headers();
  const signature = resolvedHeaders.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Używamy jednej nazwy zmiennej dla przejrzystości
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  if (event.type === "payment_intent.succeeded") {
    const paymentIntentId = paymentIntent.id;

    // 1. Szukamy zamówienia w bazie
    const order = await prisma.order.findUnique({
      where: { paymentIntentId },
    });

    if (!order) {
      console.error(
        "❌ Nie znaleziono zamówienia dla intentu:",
        paymentIntentId,
      );
      return new NextResponse("Order not found", { status: 404 });
    }

    // 2. Idempotency: Jeśli już opłacone, kończymy
    if (order.status === "succeeded") {
      return new NextResponse("Already processed", { status: 200 });
    }

    // 2a. Ślad w logach: co mamy w bazie kontra co realnie pobrał Stripe.
    const received =
      typeof paymentIntent.amount_received === "number"
        ? paymentIntent.amount_received
        : paymentIntent.amount;

    console.log(
      `[CENA / WEBHOOK] pi=${paymentIntentId} order=${order.id}` +
        ` | przed rabatem: ${order.originalAmount ?? order.amount} gr (${formatPln(order.originalAmount ?? order.amount)})` +
        ` | rabat łącznie: ${order.totalDiscountAmount ?? 0} gr (${formatPln(order.totalDiscountAmount ?? 0)})` +
        ` | w bazie: ${order.amount} gr (${formatPln(order.amount)})` +
        ` | STRIPE POBRAŁ: ${received} gr (${formatPln(received)})` +
        (order.discountCode ? ` | kod: ${order.discountCode}` : "") +
        (order.saleName ? ` | przecena: ${order.saleName}` : "") +
        (order.emailDiscountName
          ? ` | zniżka: ${order.emailDiscountName}`
          : ""),
    );

    // 2b. Kontrola zgodności kwot.
    // Rabat zapisujemy już przy tworzeniu zamówienia, więc tutaj nie ma czego
    // dopisywać — sprawdzamy natomiast, czy Stripe pobrał dokładnie tyle, ile
    // wyliczyliśmy. Rozjazd oznacza manipulację albo błąd w logice cen; logujemy
    // go głośno, ale NIE blokujemy dostępu (klientka zapłaciła).
    if (received !== order.amount) {
      console.error(
        `⚠️ ROZJAZD KWOT dla zamówienia ${order.id}:` +
          ` w bazie ${order.amount} gr (${formatPln(order.amount)}),` +
          ` Stripe pobrał ${received} gr (${formatPln(received)})` +
          (order.discountCode ? ` — kod: ${order.discountCode}` : ""),
      );
    }

    // 3. Generowanie faktury (Fakturownia)
    // 3. Generowanie faktury (Fakturownia) - TYLKO JEŚLI JEST NIP
    let fakturowniaData = { id: null, number: null };

    // Zakup z piaskownicy NIGDY nie generuje faktury — niezależnie od
    // środowiska. Blokada w fakturownia.ts działa po NODE_ENV, więc sama nie
    // ochroniłaby produkcji, gdyby ktoś tam włączył tryb testowy.
    if (order.isSandbox) {
      console.log(
        `🧾 Zamówienie ${order.id} z piaskownicy — pomijam wystawienie faktury.`,
      );
    } else if (order.billingNip && order.billingNip.trim() !== "") {
      try {
        const productName = "E-book: Fizjoterapeutyczna diagnostyka...";
        const invoice = await createFakturowniaInvoice(order, productName);

        fakturowniaData = { id: invoice.id, number: invoice.number };

        // Poza produkcją createFakturowniaInvoice zwraca same null-e i nic nie
        // wystawia — nie udajemy wtedy sukcesu w logach.
        if (invoice.number) {
          console.log(`✅ Faktura wystawiona: ${invoice.number}`);
        }
      } catch (error) {
        console.error(
          "⚠️ Błąd generowania faktury (dostęp zostanie nadany):",
          error,
        );
      }
    } else {
      console.log("Osoba prywatna pomijamy tworzenia faktury");
    }

    // 4. Aktualizacja bazy (JEDNA TRANSAKCJA)
    // (reszta kodu zostaje bez zmian)

    // 4. Aktualizacja bazy (JEDNA TRANSAKCJA)
    try {
      await prisma.$transaction([
        // A. Aktualizujemy zamówienie (Status + Dane faktury)
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "succeeded",
            fakturowniaId: fakturowniaData.id,
            invoiceNumber: fakturowniaData.number,
          },
        }),

        // B. Nadajemy dostęp (Tworzymy Purchase)
        prisma.purchase.create({
          data: {
            userId: order.userId,
            productId: "ebook-tom-1",
          },
        }),
      ]);

      console.log(`🎉 SUKCES! Nadano dostęp userowi ${order.userId}`);

      // Powiadomienie admina o sprzedaży (push + zapis w bazie).
      // notifyPurchase sam łapie błędy — nie wywróci webhooka.
      await notifyPurchase(order);

      // Dopiero teraz — po potwierdzonej płatności — obniżki "zużywają" miejsce
      // w swoich pulach. Porzucone koszyki nie zmniejszają limitów.
      // Zakup testowy z piaskownicy nie konsumuje limitu prawdziwej promocji.
      if (!order.isSandbox) {
        if (order.discountCodeId) {
          await registerDiscountUsage("code", order.discountCodeId);
        }
        if (order.saleId) {
          await registerDiscountUsage("sale", order.saleId);
        }
        if (order.emailDiscountId) {
          await registerDiscountUsage("email", order.emailDiscountId);
        }
      }
    } catch (e: any) {
      console.log(
        "Transakcja zakończona (możliwy duplikat zakupu lub błąd bazy):",
        e.message,
      );
    }
  }

  // Obsługa nieudanej płatności
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await prisma.order.update({
      where: { paymentIntentId: paymentIntent.id },
      data: { status: "failed" },
    });
  }

  return new NextResponse(null, { status: 200 });
}
