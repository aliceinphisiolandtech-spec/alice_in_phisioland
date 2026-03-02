import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/utils/stripe";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { createFakturowniaInvoice } from "@/app/actions/fakturownia"; // Upewnij się, że ścieżka jest poprawna

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

    // 3. Generowanie faktury (Fakturownia)
    let fakturowniaData = { id: null, number: null };

    try {
      const productName = "E-book: Fizjoterapeutyczna diagnostyka...";

      const invoice = await createFakturowniaInvoice(order, productName);

      fakturowniaData = { id: invoice.id, number: invoice.number };
      console.log(`✅ Faktura wystawiona: ${invoice.number}`);
    } catch (error) {
      console.error(
        "⚠️ Błąd generowania faktury (dostęp zostanie nadany):",
        error,
      );
    }

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
