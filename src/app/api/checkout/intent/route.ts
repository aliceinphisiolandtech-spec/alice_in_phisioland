import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/utils/stripe";
import { prisma } from "@/lib/prisma";
import { BillingSchema } from "@/lib/validators/orders";

const EBOOK_PRICE = 10900; // 149.00 PLN standardowo
const PRODUCT_ID = "ebook-tom-1";

// Konfiguracja Tygodnia Testowego
const IS_TESTING_WEEK = process.env.IS_TESTING_WEEK === "true";
const TESTERS_WHITELIST = [
  "juszczakmat@gmail.com",
  "aleksandra.kozlowska38@gmail.com",
  "mlech.pan@gmail.com",
  "gaskaula9@gmail.com",
  "kosminskanatalia95@gmail.com",
  "biuro@kocikdev.com",
];

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
    const isTester = TESTERS_WHITELIST.includes(userEmail);
    if (IS_TESTING_WEEK && !isTester) {
      return NextResponse.json(
        { message: "Sprzedaż jest obecnie zamknięta (Okres Testowy)." },
        { status: 403 },
      );
    }

    // --- LOGIKA CENY ---
    let amountToCharge = EBOOK_PRICE;
    if (IS_TESTING_WEEK && isTester) {
      amountToCharge = 8900; // 89.00 PLN (zniżka)
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountToCharge, // Dynamiczna kwota (89zł lub 149zł)
      currency: "pln",
      automatic_payment_methods: { enabled: true },
      receipt_email: session.user.email,
      description:
        "E-book: Fizjoterapeutyczna diagnostyka różnicowa W ujęciu klinicznym. Tom 1",
      metadata: {
        userId: userId,
        email: session.user.email,
        productId: PRODUCT_ID,
        billingNip: billingData.billingNip || "",
      },
    });

    await prisma.order.create({
      data: {
        userId: userId,
        amount: amountToCharge, // Zapisujemy faktycznie zapłaconą kwotę
        currency: "pln",
        status: "pending",
        paymentIntentId: paymentIntent.id,
        billingType: billingData.billingType,
        billingName: billingData.billingName,
        billingAddress: billingData.billingAddress,
        billingCity: billingData.billingCity,
        billingPostalCode: billingData.billingPostalCode,
        billingCountry: billingData.billingCountry,
        billingNip: billingData.billingNip || null,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return NextResponse.json(
      { message: "Wystąpił błąd serwera podczas inicjowania płatności." },
      { status: 500 },
    );
  }
}
