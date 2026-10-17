import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/utils/stripe";
import { prisma } from "@/lib/prisma";
import { BillingSchema } from "@/lib/validators/orders";
import {
  resolveCheckoutPricing,
  toOrderSnapshot,
} from "@/lib/checkout-pricing";
import { CHECKOUT_CURRENCY, formatPln, isTesterEmail } from "@/lib/pricing";

const PRODUCT_ID = "ebook-tom-1";

// Konfiguracja Tygodnia Testowego
const IS_TESTING_WEEK = process.env.IS_TESTING_WEEK === "true";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !session.user.email || !session.user.id) {
      return NextResponse.json(
        { message: "Musisz być zalogowany, aby dokonać zakupu." },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email.toLowerCase();

    // --- BLOKADA TESTOWA ---
    if (IS_TESTING_WEEK && !isTesterEmail(userEmail)) {
      return NextResponse.json(
        { message: "Sprzedaż jest obecnie zamknięta (Okres Testowy)." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = BillingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Błędne dane formularza.",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const billingData = validation.data;

    const existingPurchase = await prisma.purchase.findUnique({
      where: { userId_productId: { userId: userId, productId: PRODUCT_ID } },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { message: "Już posiadasz ten e-book! Przejdź do panelu kursanta." },
        { status: 409 },
      );
    }

    // --- PEŁNA WYCENA OD NOWA ---
    // Kod przysłany przez przeglądarkę to wyłącznie sugestia. Serwer sam
    // pobiera czynne przeceny i zniżki mailowe, sam waliduje kod i sam wylicza
    // kwotę. Jeśli cokolwiek zmieniło się od momentu podglądu w koszyku (kod
    // wygasł, promocja została wyłączona), obowiązuje stan z tej chwili.
    const rawCouponCode =
      typeof (body as { couponCode?: unknown })?.couponCode === "string"
        ? (body as { couponCode: string }).couponCode
        : null;

    const {
      pricing,
      appliedCouponId,
      appliedCouponCode,
      couponRejected,
      sandbox,
    } = await resolveCheckoutPricing({
      email: userEmail,
      couponCode: rawCouponCode,
      isAdmin: session.user.role === "admin",
    });

    // Ślad w logach serwera: dokładnie ta kwota powstała po stronie serwera.
    const skladowe = pricing.lines
      .map((line) => `${line.name} ${line.label} = −${line.amount} gr`)
      .join("; ");

    console.log(
      `[CENA / INTENT] user=${userEmail}` +
        ` | baza: ${pricing.baseAmount} gr (${formatPln(pricing.baseAmount)})` +
        ` | rabat: ${pricing.totalDiscount} gr (${formatPln(pricing.totalDiscount)})` +
        ` | DO ZAPŁATY: ${pricing.finalAmount} gr (${formatPln(pricing.finalAmount)})` +
        ` | ${skladowe || "brak obniżek"}` +
        (sandbox.active ? " | PIASKOWNICA (zakup testowy, bez faktury)" : ""),
    );

    const snapshot = toOrderSnapshot(pricing);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.finalAmount, // Kwota policzona wyłącznie po stronie serwera
      currency: CHECKOUT_CURRENCY,
      automatic_payment_methods: { enabled: true },
      receipt_email: session.user.email,
      description:
        "E-book: Fizjoterapeutyczna diagnostyka różnicowa W ujęciu klinicznym. Tom 1",
      metadata: {
        userId: userId,
        email: session.user.email,
        productId: PRODUCT_ID,
        billingNip: billingData.billingNip || "",
        sandbox: sandbox.active ? "true" : "false",
        originalAmount: String(pricing.baseAmount),
        totalDiscount: String(pricing.totalDiscount),
        discountCode: appliedCouponCode || "",
        // Czytelny ślad w panelu Stripe: "Promocja premierowa −20%; ALICJA10 −10%"
        discounts: pricing.lines
          .map((line) => `${line.name} ${line.label}`)
          .join("; ")
          .slice(0, 500),
      },
    });

    // Kwota potwierdzona przez Stripe — to ona realnie pójdzie do obciążenia.
    console.log(
      `[CENA / STRIPE] pi=${paymentIntent.id}` +
        ` | przekazano: ${paymentIntent.amount} gr (${formatPln(paymentIntent.amount)})`,
    );

    await prisma.order.create({
      data: {
        userId: userId,
        amount: pricing.finalAmount, // Zapisujemy faktycznie zapłaconą kwotę
        currency: CHECKOUT_CURRENCY,
        status: "pending",
        paymentIntentId: paymentIntent.id,
        billingType: billingData.billingType,
        billingName: billingData.billingName,
        billingAddress: billingData.billingAddress,
        billingCity: billingData.billingCity,
        billingPostalCode: billingData.billingPostalCode,
        billingCountry: billingData.billingCountry,
        billingNip: billingData.billingNip || null,
        // Zakup testowy: nie liczy się do statystyk sprzedaży i nigdy nie
        // wygeneruje faktury (patrz webhook).
        isSandbox: sandbox.active,
        // Snapshot wszystkich źródeł obniżki — widoczny w historii zamówień.
        discountCode: appliedCouponCode,
        discountCodeId: appliedCouponId,
        ...snapshot,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      pricing,
      appliedCode: appliedCouponCode,
      couponRejected,
    });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return NextResponse.json(
      { message: "Wystąpił błąd serwera podczas inicjowania płatności." },
      { status: 500 },
    );
  }
}
