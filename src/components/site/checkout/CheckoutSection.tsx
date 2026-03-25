"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Session } from "next-auth";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { CheckCircle2, Pencil, Lock, ShieldAlert } from "lucide-react";

import { OrderSummary } from "./OrderSummary";
import { CheckoutForm } from "./CheckoutForm";
import { LoginPrompt } from "./LoginPrompt";
import { BillingForm } from "./BillingForm";
import { BillingFormData } from "@/lib/validators/orders";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const IS_TESTING_WEEK = process.env.NEXT_PUBLIC_IS_TESTING_WEEK === "true";
const TESTERS_WHITELIST = [
  "juszczakmat@gmail.com",
  "aleksandra.kozlowska38@gmail.com",
  "mlech.pan@gmail.com",
  "gaskaula9@gmail.com",
  "kosminskanatalia95@gmail.com",
  "biuro@kocikdev.com",
];

export const CheckoutSection = ({ session }: { session: Session | null }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [savedBillingData, setSavedBillingData] =
    useState<BillingFormData | null>(null);

  // Zabezpieczenie na poziomie wyświetlania
  const userEmail = session?.user?.email?.toLowerCase();
  const isTester = userEmail && TESTERS_WHITELIST.includes(userEmail);
  const isLockedForNonTesters = IS_TESTING_WEEK && !isTester;

  const handleBillingSubmit = async (data: BillingFormData) => {
    setIsInitializing(true);
    try {
      const res = await fetch("/api/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Błąd inicjalizacji płatności");
      }

      setSavedBillingData(data);
      setClientSecret(result.clientSecret);
      toast.success("Dane zapisane. Możesz dokonać płatności.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Wystąpił błąd połączenia.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleEditBilling = () => {
    setClientSecret("");
  };

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#103830",
      borderRadius: "12px",
    },
  };

  return (
    <section className="min-h-screen bg-white pt-28 pb-20">
      <div className="custom-container px-4">
        <h1 className="text-3xl font-bold text-[#103830] mb-8 text-center">
          Finalizacja Zamówienia
        </h1>

        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* LEWA KOLUMNA */}
          <div className="flex-1 w-full space-y-6">
            {!session ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <LoginPrompt onGoogleLogin={() => signIn("google")} />
              </div>
            ) : (
              <>
                {/* 1. KONTO UŻYTKOWNIKA */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                  {/* ... [Bez zmian - pozostawione awatary i nazwa użytkownika] ... */}
                  <h2 className="text-lg font-bold text-[#103830] mb-4 flex items-center gap-2">
                    1. Konto użytkownika
                  </h2>
                  <div className="p-4 bg-[#D4F0C8]/20 border border-[#D4F0C8] rounded-xl flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt="Avatar"
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-white shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#103830] rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {session.user.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">
                        Licencja zostanie przypisana do:
                      </p>
                      <p className="font-bold text-[#103830] text-lg leading-tight">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* --- NOWA LOGIKA: BLOKADA DLA NIE-TESTERÓW --- */}
                {isLockedForNonTesters ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center bg-red-50/30">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert size={32} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      Okres testowy (Zamknięta sprzedaż)
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Aplikacja znajduje się obecnie w zamkniętej fazie testów.
                      Zakup e-booka jest zablokowany dla osób spoza listy
                      testerów. Dziękujemy za zainteresowanie i zapraszamy na
                      premierę!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 2. DANE DO FAKTURY (Zwykły widok jeśli przeszedł blokadę) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 relative transition-all duration-300">
                      {!clientSecret ? (
                        <BillingForm
                          session={session}
                          onSubmit={handleBillingSubmit}
                          isLoading={isInitializing}
                        />
                      ) : (
                        <div className="flex justify-between items-center animate-in fade-in">
                          {/* ... [KOD PODGLĄDU ZWINIĘTEJ FAKTURY BEZ ZMIAN] ... */}
                          <div className="flex gap-4 items-start">
                            <div className="mt-1 text-green-600 bg-green-100 p-1 rounded-full">
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-[#103830] text-lg">
                                Dane do faktury
                              </h3>
                              <p className="font-medium text-gray-900">
                                {savedBillingData?.billingName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {savedBillingData?.billingAddress},{" "}
                                {savedBillingData?.billingPostalCode}{" "}
                                {savedBillingData?.billingCity}
                              </p>
                              {savedBillingData?.billingNip && (
                                <p className="text-xs text-gray-400 mt-1 font-mono">
                                  NIP: {savedBillingData.billingNip}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={handleEditBilling}
                            className="p-2 text-gray-400 hover:text-[#103830] hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Pencil size={20} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. METODA PŁATNOŚCI */}
                    <div
                      className={`
                        bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 
                        transition-all duration-300
                        ${!clientSecret ? "opacity-50 grayscale pointer-events-none select-none" : "opacity-100"}
                      `}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-[#103830] flex items-center gap-2">
                          2. Metoda płatności
                          {!clientSecret && (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </h2>
                      </div>
                      {clientSecret ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <Elements
                            options={{ clientSecret, appearance, locale: "pl" }}
                            stripe={stripePromise}
                          >
                            <CheckoutForm session={session} />
                          </Elements>
                        </div>
                      ) : (
                        <div className="h-12 bg-gray-50 rounded-xl border border-gray-100 border-dashed flex items-center justify-center text-sm text-gray-400">
                          Uzupełnij dane powyżej, aby odblokować płatność
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* PRAWA KOLUMNA */}
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 lg:sticky lg:top-32">
            {/* Poprawione wywołanie z przekazaniem maila */}
            <OrderSummary />
          </div>
        </div>
      </div>
    </section>
  );
};
