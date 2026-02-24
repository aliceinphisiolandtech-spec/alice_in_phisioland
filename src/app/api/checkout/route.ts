import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/utils/stripe";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    /* Tworzenie PaymentIntent zamiast Checkout Session */
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 14900, // 149.00 PLN
      currency: "pln",
      automatic_payment_methods: { enabled: true }, // Włącza BLIK, Karty, P24 automatycznie
      metadata: {
        userId: session.user.email,
        product: "ebook-tom-1",
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("[STRIPE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
