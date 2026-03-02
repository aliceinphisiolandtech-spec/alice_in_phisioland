import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const STATIC_PRODUCT_IMAGE = "/landing-assets/E-book-presentation.webp";

export const OrderSummary = () => {
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
            <span className="font-bold text-[#103830]">149,00 zł</span>
          </div>
        </div>

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
