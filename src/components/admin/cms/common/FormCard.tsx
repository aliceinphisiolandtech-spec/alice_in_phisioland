import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface FormCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
}

export const FormCard = ({
  title,
  description,
  icon: Icon,
  children,
}: FormCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-start gap-3">
        <div className="p-2 bg-white border border-gray-200 rounded-lg text-[#0c493e] shadow-sm">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
};
