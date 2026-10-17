"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Session } from "next-auth";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Pencil,
  Lock,
  ShieldAlert,
  FlaskConical,
} from "lucide-react";

import { OrderSummary } from "./OrderSummary";
import { CheckoutForm } from "./CheckoutForm";
import { LoginPrompt } from "./LoginPrompt";
import { BillingForm } from "./BillingForm";
import { BillingFormData } from "@/lib/validators/orders";
import { formatPln, isTesterEmail } from "@/lib/pricing";
import { COUPON_ERROR_MESSAGES } from "@/lib/validators/coupon";
import type { PriceResult } from "@/lib/pricing-engine";
import type { SandboxInfo } from "@/lib/checkout-pricing";
import type { CouponApplyResult } from "./CouponField";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const IS_TESTING_WEEK = process.env.NEXT_PUBLIC_IS_TESTING_WEEK === "true";

// Podstawiane w czasie builda. Warunek musi stać TUTAJ, a nie tylko w
// LoginPrompt: gdyby handler powstawał bezwarunkowo, samo wywołanie
// signIn("dev-login") lądowałoby w produkcyjnym bundle jako martwy kod.
const IS_DEV = process.env.NODE_ENV !== "production";

interface CheckoutSectionProps {
  session: Session | null;
  /** Wycena bez kodu (przecena + zniżka mailowa), policzona na serwerze. */
  initialPricing: PriceResult;
  sandbox: SandboxInfo;
}

export const CheckoutSection = ({
  session,
  initialPricing,
  sandbox,
}: CheckoutSectionProps) => {
  const [clientSecret, setClientSecret] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [savedBillingData, setSavedBillingData] =
    useState<BillingFormData | null>(null);

  // Wycena trzymana tutaj, bo potrzebują jej i podsumowanie (wyświetlenie kwot),
  // i wywołanie tworzące PaymentIntent. Każda kwota pochodzi z serwera.
  const [pricing, setPricing] = useState<PriceResult>(initialPricing);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  // Kod poprawny, ale przebity korzystniejszą promocją — trzymamy go osobno,
  // żeby pokazać wyjaśnienie zamiast udawać, że nic nie wpisano.
  const [outrankedCode, setOutrankedCode] = useState<string | null>(null);

  // Zabezpieczenie na poziomie wyświetlania
  const userEmail = session?.user?.email?.toLowerCase();
  const isLockedForNonTesters = IS_TESTING_WEEK && !isTesterEmail(userEmail);

  const handleBillingSubmit = async (data: BillingFormData) => {
    setIsInitializing(true);
    try {
      const res = await fetch("/api/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Kod jest tylko sugestią — serwer liczy całą wycenę od nowa i sam
        // przekazuje kwotę do Stripe.
        body: JSON.stringify({ ...data, couponCode: appliedCode }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Błąd inicjalizacji płatności");
      }

      setSavedBillingData(data);
      setClientSecret(result.clientSecret);
      // Płatność powstała na podstawie tej wyceny — pokazujemy dokładnie ją.
      if (result.pricing) setPricing(result.pricing as PriceResult);
      setAppliedCode(result.appliedCode ?? null);

      // Kod przestał być ważny między dodaniem go w koszyku a przejściem do
      // płatności (np. promocja została wyłączona w panelu).
      if (result.couponRejected) {
        setOutrankedCode(null);
        toast.error(
          `${COUPON_ERROR_MESSAGES[result.couponRejected as keyof typeof COUPON_ERROR_MESSAGES] ?? "Kod rabatowy został odrzucony."} Do zapłaty: ${formatPln(result.pricing?.finalAmount ?? 0)}.`,
        );
      } else {
        toast.success("Dane zapisane. Możesz dokonać płatności.");
      }
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

  /**
   * PaymentIntent powstaje już przy zapisaniu danych do faktury, a jego kwoty nie
   * da się zmienić po fakcie. Dlatego każda zmiana kodu unieważnia utworzoną
   * płatność — klientka potwierdza dane ponownie i dostaje intent z nową kwotą.
   */
  const handleCouponApplied = (result: CouponApplyResult) => {
    setPricing(result.pricing);
    setAppliedCode(result.appliedCode);
    setOutrankedCode(result.outranked ? result.enteredCode : null);

    if (result.outranked) {
      toast.info(
        "Kod jest poprawny, ale Twoja obecna promocja daje lepszą cenę — zostawiliśmy niższą kwotę.",
      );
    } else if (clientSecret) {
      setClientSecret("");
      toast.success(
        `Kod ${result.appliedCode} zastosowany. Potwierdź dane do faktury, aby przeliczyć płatność.`,
      );
    } else {
      toast.success(`Kod ${result.appliedCode} zastosowany.`);
    }
  };

  const handleCouponRemoved = () => {
    // Bez kodu wracamy do wyceny wyjściowej — przecena i zniżka mailowa
    // działają niezależnie od tego, co klientka wpisała w polu kodu.
    setPricing(initialPricing);
    setAppliedCode(null);
    setOutrankedCode(null);

    if (clientSecret) {
      setClientSecret("");
      toast.info(
        "Kod usunięty. Potwierdź dane do faktury, aby przeliczyć płatność.",
      );
    } else {
      toast.info("Kod rabatowy usunięty.");
    }
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

        {/* --- PIASKOWNICA ---
            `sandbox.active` liczy się na serwerze i jest true wyłącznie dla
            admina oraz — poza produkcją — kont testowych @local.dev.
            Klientka nigdy tego nie zobaczy. */}
        {sandbox.active && (
          <div className="mb-8 flex items-start gap-4 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-5 animate-in fade-in">
            <div className="shrink-0 rounded-xl bg-amber-400/20 p-2.5 text-amber-700">
              <FlaskConical size={22} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-amber-900">
                System działa w piaskownicy
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                Widzisz wersję testową cennika —{" "}
                <strong>rabaty i ceny poniżej są fikcyjne</strong> i nie
                działają dla klientek. Płatność przejdzie normalnie (Stripe w
                trybie testowym), ale takie zamówienie nie liczy się do
                statystyk sprzedaży i <strong>nie wystawi faktury</strong>.
                {sandbox.usesSandboxPrice && (
                  <> Cena bazowa pochodzi z testowej ceny piaskownicy.</>
                )}
              </p>
              <p className="mt-2 text-xs text-amber-700">
                Tryb wyłączysz w panelu Rabaty, w kafelku „Klientka płaci
                teraz”.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* LEWA KOLUMNA */}
          <div className="flex-1 w-full space-y-6">
            {!session ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <LoginPrompt
                  onGoogleLogin={() => signIn("google")}
                  // callbackUrl wraca na /zakup, żeby dev login nie wyrzucał
                  // z koszyka do panelu w środku testu płatności.
                  onDevLogin={
                    IS_DEV
                      ? ({ role, slot }) =>
                          signIn("dev-login", {
                            role,
                            slot: slot ? String(slot) : undefined,
                            callbackUrl: "/zakup",
                          })
                      : undefined
                  }
                />
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
                      <div className="flex justify-between items-center gap-3 mb-6">
                        <h2 className="text-lg font-bold text-[#103830] flex items-center gap-2">
                          2. Metoda płatności
                          {!clientSecret && (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </h2>

                        {/* Kwota przy przycisku płatności — na mobile podsumowanie
                            jest dopiero pod formularzem, więc bez tego klientka
                            nie widziałaby ceny po rabacie w momencie płacenia. */}
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Do zapłaty
                          </p>
                          <p className="font-bold text-[#103830] leading-tight">
                            {formatPln(pricing.finalAmount)}
                          </p>
                        </div>
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
            <OrderSummary
              pricing={pricing}
              appliedCode={appliedCode}
              outrankedCode={outrankedCode}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              // Kod można wpisać tylko wtedy, gdy zakup jest w ogóle możliwy.
              showCoupon={!!session && !isLockedForNonTesters}
              couponDisabled={isInitializing}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
