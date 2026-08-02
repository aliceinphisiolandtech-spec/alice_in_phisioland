"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { CouponField, type CouponApplyResult } from "./CouponField";
import { formatPln } from "@/lib/pricing";
import type { PriceResult } from "@/lib/pricing-engine";

const STATIC_PRODUCT_IMAGE = "/landing-assets/E-book-presentation.webp";

interface OrderSummaryProps {
  /** Pełne rozbicie ceny policzone po stronie serwera. */
  pricing: PriceResult;
  appliedCode: string | null;
  outrankedCode: string | null;
  onCouponApplied: (result: CouponApplyResult) => void;
  onCouponRemoved: () => void;
  /** Ukrywamy pole kodu np. gdy sprzedaż jest zamknięta albo user niezalogowany. */
  showCoupon?: boolean;
  couponDisabled?: boolean;
}

export const OrderSummary = ({
  pricing,
  appliedCode,
  outrankedCode,
  onCouponApplied,
  onCouponRemoved,
  showCoupon = true,
  couponDisabled = false,
}: OrderSummaryProps) => {
  const hasDiscount = pricing.totalDiscount > 0;

  // Przekreślamy WYŁĄCZNIE cenę sprzed realnej obniżki. Bez czynnej promocji
  // nie ma czego przekreślać — pokazywanie wtedy „ceny regularnej" sugerowałoby
  // rabat, którego nie ma.
  const showStrikeThrough =
    hasDiscount && pricing.baseAmount > pricing.finalAmount;

  return (
    <div className="w-[380px] shrink-0 max-[1024px]:w-full">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24 transition-all">
        <div className="max-[1024px]:hidden mb-6 pb-6 border-b border-gray-100">
          <h3 className="font-bold text-lg text-[#103830]">Twoje zamówienie</h3>
        </div>

        <div className="flex gap-4 mb-6">
          <Image
            src={STATIC_PRODUCT_IMAGE}
            alt="Okładka"
            className="object-cover"
            height={70}
            width={80}
          />

          <div>
            <h4 className="font-bold text-[#103830] text-md leading-tight mb-1">
              Fizjoterapeutyczna Diagnostyka Różnicowa
            </h4>
            <p className="text-sm text-gray-500 mb-2">Tom 1 • Aplikacja PWA</p>

            {/* --- SEKCJA CENY --- */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#103830] text-lg">
                {formatPln(pricing.finalAmount)}
              </span>
              {showStrikeThrough && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPln(pricing.baseAmount)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* --- ROZBICIE KWOT --- */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Wartość zamówienia</span>
            <span
              className={
                hasDiscount
                  ? "text-gray-400 line-through"
                  : "text-gray-700 font-medium"
              }
            >
              {formatPln(pricing.baseAmount)}
            </span>
          </div>

          {/* Jedna linia na każde źródło obniżki: przecena, zniżka mailowa, kod */}
          {pricing.lines.map((line) => (
            <div
              key={`${line.kind}-${line.name}`}
              className="flex justify-between items-start gap-3 text-sm animate-in fade-in slide-in-from-top-1"
            >
              <span className="text-[#103830] font-medium min-w-0">
                <span className="block truncate">{line.name}</span>
                <span className="text-xs font-normal text-gray-500">
                  {line.label}
                </span>
              </span>
              <span className="text-[#103830] font-semibold shrink-0">
                −{formatPln(line.amount)}
              </span>
            </div>
          ))}

          <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-100">
            <span className="font-bold text-[#103830]">Do zapłaty</span>
            <span className="font-bold text-xl text-[#103830]">
              {formatPln(pricing.finalAmount)}
            </span>
          </div>

          {hasDiscount && (
            <p className="text-right text-xs text-gray-400">
              Oszczędzasz {formatPln(pricing.totalDiscount)}
            </p>
          )}
        </div>

        {/* --- KOD RABATOWY --- */}
        {showCoupon && (
          <CouponField
            appliedCode={appliedCode}
            outrankedCode={outrankedCode}
            onApplied={onCouponApplied}
            onRemoved={onCouponRemoved}
            disabled={couponDisabled}
          />
        )}

        <div className="bg-[#F9FAFB] p-4 rounded-xl mt-6">
          <p className="text-sm text-gray-500 mb-2 font-medium">W pakiecie:</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <FeatureItem text="Dożywotni dostęp do Aplikacji" />
            <FeatureItem text="Panel Wiedzy (Secure Viewer)" />
            <FeatureItem text="Dostęp natychmiastowy" />
          </ul>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex gap-2 items-center">
    <CheckCircle2 size={14} className="text-[#103830] shrink-0" />
    <span>{text}</span>
  </li>
);
