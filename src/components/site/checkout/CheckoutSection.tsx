"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Session } from "next-auth";
import { OrderSummary } from "./OrderSummary"; // Twój komponent
import { CheckoutForm } from "./CheckoutForm"; // Nowy formularz poniżej
import { LoginPrompt } from "./LoginPrompt";
import Image from "next/image";
import { signIn } from "next-auth/react";
export type PaymentMethodType = "blik" | "p24" | "card";
/* Inicjalizacja Stripe (klucz publiczny) */
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export const CheckoutSection = ({ session }: { session: Session | null }) => {
  const [clientSecret, setClientSecret] = useState("");

  /* Pobranie sekretu płatności przy wejściu na stronę */
  useEffect(() => {
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#103830",
    },
  };

  const options = {
    clientSecret,
    appearance,
    locale: "pl" as const,
  };

  return (
    <section className="min-h-screen bg-white pt-28 pb-20">
      <div className="custom-container px-4">
        <h1 className="text-3xl font-bold text-[#103830] mb-8 text-center">
          Finalizacja Zamówienia
        </h1>

        <div className="flex flex-row items-start gap-12 max-[1024px]:flex-col-reverse">
          {/* Lewa kolumna - Formularz */}
          <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {!session ? (
              <LoginPrompt onGoogleLogin={() => signIn("google")} />
            ) : (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-[#103830] mb-4 flex items-center gap-2">
                  1. Konto użytkownika
                </h2>
                <div className="p-4 bg-[#D4F0C8]/20 border border-[#D4F0C8] rounded-xl flex items-center gap-4 max-[475px]:flex-col max-[475px]:text-center  ">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt="Avatar"
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#103830] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {session.user.name?.charAt(0)}
                    </div>
                  )}
                  <div className="max-[475px]:flex max-[475px]:flex-col max-[475px]:gap-1">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">
                      Licencja zostanie przypisana do:
                    </p>
                    <p className="font-bold text-[#103830] text-lg leading-tight">
                      {session.user.name}
                    </p>
                    <p className="text-[12px] text-gray-600">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {clientSecret && (
              <Elements options={options} stripe={stripePromise}>
                <CheckoutForm session={session} />
              </Elements>
            )}
          </div>

          {/* Prawa kolumna - Podsumowanie */}
          <OrderSummary />
        </div>
      </div>
    </section>
  );
};
