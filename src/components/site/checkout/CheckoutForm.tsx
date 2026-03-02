"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Session } from "next-auth";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
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

  if (!session || !session.user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    if (!acceptTerms) {
      toast.error("Proszę zaakceptować regulamin.");
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/panel-kursanta?payment_success=true`,
      },
    });

    if (error) {
      toast.error(error.message || "Wystąpił błąd płatności.");
    }

    setIsProcessing(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Kontener Stripe - tylko metoda płatności */}
      <div className="min-h-[300px]">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* ZGODY */}
      <div className="mb-8 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#103830] focus:ring-[#103830]"
          />
          <span className="text-xs text-gray-600 leading-relaxed">
            Akceptuję{" "}
            <Link
              href="/regulamin"
              className="underline font-medium text-[#103830]"
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
          type="submit"
          isLoading={isProcessing}
          disabled={!stripe || !elements || !acceptTerms}
          className="w-full py-6 text-lg font-semibold rounded-xl"
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
