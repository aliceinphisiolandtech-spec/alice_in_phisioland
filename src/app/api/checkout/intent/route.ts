import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/utils/stripe";
import { prisma } from "@/lib/prisma";
import { BillingSchema } from "@/lib/validators/orders"; // Import walidacji

const EBOOK_PRICE = 14900; // 149.00 PLN
const PRODUCT_ID = "ebook-tom-1";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Sprawdzenie autoryzacji
    if (!session?.user || !session.user.email || !session.user.id) {
      return NextResponse.json(
        { message: "Musisz być zalogowany, aby dokonać zakupu." },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // ODBIERAMY DANE Z FORMULARZA
    const body = await req.json();

    // 2. WALIDACJA DANYCH DO FAKTURY
    // To jest kluczowe: sprawdzamy czy frontend przysłał poprawne dane zanim ruszymy dalej
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

    // 3. Sprawdzenie, czy użytkownik już nie posiada produktu
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_productId: {
          userId: userId,
          productId: PRODUCT_ID,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { message: "Już posiadasz ten e-book! Przejdź do panelu kursanta." },
        { status: 409 },
      );
    }

    // 4. Utworzenie PaymentIntent w Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: EBOOK_PRICE,
      currency: "pln",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: userId,
        email: session.user.email,
        productId: PRODUCT_ID,
        // Dodajemy NIP do metadata w Stripe (opcjonalnie, dla wygody księgowej)
        billingNip: billingData.billingNip || "",
      },
    });

    // 5. Zapisanie zamówienia w bazie Z DANYMI DO FAKTURY
    // Tutaj robimy "snapshot" danych, które klient wpisał
    await prisma.order.create({
      data: {
        userId: userId,
        amount: EBOOK_PRICE,
        currency: "pln",
        status: "pending",
        paymentIntentId: paymentIntent.id,

        // --- DANE DO FAKTURY ---
        billingType: billingData.billingType,
        billingName: billingData.billingName,
        billingAddress: billingData.billingAddress,
        billingCity: billingData.billingCity,
        billingPostalCode: billingData.billingPostalCode,
        billingCountry: billingData.billingCountry, // To zawsze będzie "PL"
        billingNip: billingData.billingNip || null, // null jeśli user prywatny
      },
    });

    // 6. Zwracamy sekret frontowi
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return NextResponse.json(
      { message: "Wystąpił błąd serwera podczas inicjowania płatności." },
      { status: 500 },
    );
  }
}
