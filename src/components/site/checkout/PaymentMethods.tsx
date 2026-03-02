import { Smartphone, Landmark, CreditCard, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PaymentMethodsProps {
  selected: any;
  onSelect: (method: any) => void;
}

export const PaymentMethods = ({ selected, onSelect }: PaymentMethodsProps) => {
  return (
    <div className="grid grid-cols-3 gap-4 max-[600px]:grid-cols-1">
      <PaymentCard
        id="blik"
        label="BLIK"
        icon={Smartphone}
        selected={selected}
        onSelect={onSelect}
      />
      <PaymentCard
        id="p24"
        label="Przelew"
        icon={Landmark}
        selected={selected}
        onSelect={onSelect}
      />
      <PaymentCard
        id="card"
        label="Karta"
        icon={CreditCard}
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  );
};

// Sub-komponent pojedynczej karty
const PaymentCard = ({
  id,
  label,
  icon: Icon,
  selected,
  onSelect,
}: {
  id: any;
  label: string;
  icon: any;
  selected: any;
  onSelect: (id: any) => void;
}) => {
  const isActive = selected === id;
  return (
    <div
      onClick={() => onSelect(id)}
      className={cn(
        "relative flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer h-[100px] transition-all duration-200 pointer-cursor",
        isActive
          ? "border-[#103830] bg-[#103830]/5 shadow-sm"
          : "border-gray-200 hover:border-[#103830]/50 hover:bg-gray-50",
      )}
    >
      <Icon
        className={cn("mb-2", isActive ? "text-[#103830]" : "text-gray-400")}
        size={32}
      />
      <span
        className={cn(
          "font-bold text-sm",
          isActive ? "text-[#103830]" : "text-gray-600",
        )}
      >
        {label}
      </span>
      {isActive && (
        <div className="absolute top-2 right-2 text-[#103830]">
          <CheckCircle2 size={16} />
        </div>
      )}
    </div>
  );
};
