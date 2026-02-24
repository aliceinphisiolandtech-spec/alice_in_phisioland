"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Session } from "next-auth";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { toast } from "sonner";

interface CheckoutFormProps {
  session: Session | null;
}

export const CheckoutForm = ({ session }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  /* SAFE GUARD: Jeśli brak sesji, nie renderuj nic (zabezpieczenie) */
  if (!session || !session.user) {
    return null;
  }

  /* Obsługa płatności Stripe */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!acceptTerms) {
      toast.error("Proszę zaakceptować regulamin.");
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Tutaj wraca użytkownik po sukcesie
        return_url: `${window.location.origin}/panel-wiedzy?payment_success=true`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      toast.error(error.message || "Wystąpił błąd.");
    } else {
      toast.error("Wystąpił nieoczekiwany błąd.");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 1. KONTO UŻYTKOWNIKA */}

      {/* 2. STRIPE PAYMENT ELEMENT */}
      <div className="">
        <h2 className="text-lg font-bold text-[#103830] mb-4 flex items-center gap-2">
          2. Metoda płatności
        </h2>

        {/* Kontener Stripe - ładuje BLIK, Karty, P24 automatycznie */}
        <div className="min-h-[300px]">
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </div>
      </div>

      {/* 3. ZGODY */}
      <div className="mb-8  p-4 bg-gray-50 rounded-lg">
        <label className="flex items-start gap-3 pointer-cursor select-none">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 cursor-pointer text-[#103830] focus:ring-[#103830] pointer-cursor"
          />
          <span className="text-[12px] text-gray-600 leading-relaxed">
            Akceptuję{" "}
            <Link
              href="/regulamin"
              className="underline font-medium text-[#103830] pointer-cursor"
            >
              Regulamin
            </Link>
            . Rozumiem, że kupuję dostęp do treści cyfrowej i tracę prawo do
            odstąpienia od umowy z momentem otrzymania dostępu.
          </span>
        </label>
      </div>

      <div className="flex w-full items-center justify-center">
        <LoadingButton
          isLoading={isProcessing}
          className="self-center justify-self-center"
        >
          Kupuję i płacę
        </LoadingButton>
      </div>

      <p className="mt-6 text-center text-xs text-gray-400 flex justify-center items-center gap-1">
        <ShieldCheck size={12} />
        Płatności obsługuje Stripe (SSL Secure)
      </p>
    </form>
  );
};
