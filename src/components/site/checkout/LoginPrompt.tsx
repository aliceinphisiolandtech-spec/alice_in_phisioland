import { UserCircle2 } from "lucide-react";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

interface LoginPromptProps {
  onGoogleLogin: () => void;
}

export const LoginPrompt = ({ onGoogleLogin }: LoginPromptProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-6 h-16 w-16 bg-[#D4F0C8]/30 rounded-full flex items-center justify-center text-[#103830]">
        <UserCircle2 size={32} />
      </div>

      <h2 className="text-2xl font-bold text-[#103830] mb-3">
        Wymagane konto użytkownika
      </h2>
      <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
        Kupujesz <strong>dożywotni dostęp do aplikacji</strong>. Zaloguj się,
        abyśmy mogli przypisać licencję do Twojego konta.
      </p>

      <button
        onClick={onGoogleLogin}
        className="group relative flex w-full max-w-sm items-center justify-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-6 py-4 text-[15px] font-semibold text-[#1f2937] transition-all hover:bg-[#f9fafb] hover:shadow-md active:scale-[0.98] pointer-cursor"
      >
        <GoogleIcon className="h-5 w-5" />
        <span>Kontynuuj przez Google</span>
      </button>

      {/* Wizualna blokada sekcji płatności */}
      <div className="w-full mt-12 pt-12 border-t border-gray-100 opacity-40 grayscale select-none pointer-events-none">
        <h2 className="text-xl font-bold text-[#103830] mb-6 flex items-center gap-3">
          Metoda płatności
        </h2>
        <div className="h-24 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center">
          <span className="text-sm font-medium">Dostępne po zalogowaniu</span>
        </div>
      </div>
    </div>
  );
};
