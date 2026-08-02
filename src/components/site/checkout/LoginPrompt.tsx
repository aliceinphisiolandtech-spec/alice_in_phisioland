import { UserCircle2 } from "lucide-react";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

interface LoginPromptProps {
  onGoogleLogin: () => void;
  /** DEV-ONLY: logowanie bez OAuth, żeby dało się przeklikać koszyk. */
  onDevLogin?: (payload: {
    role: "client" | "admin";
    /** Numer klienta testowego (1..5). Ignorowany dla admina. */
    slot?: number;
  }) => void;
}

// Sprawdzane w czasie builda — na produkcji cały blok wypada z bundle'a.
const IS_DEV = process.env.NODE_ENV !== "production";

// Musi się zgadzać z DEV_CLIENT_COUNT w src/lib/auth.ts. Nie importujemy tego
// stamtąd, bo auth.ts ciągnie za sobą prismę do bundla klienckiego.
const DEV_CLIENTS = [1, 2, 3, 4, 5];

export const LoginPrompt = ({
  onGoogleLogin,
  onDevLogin,
}: LoginPromptProps) => {
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
        className=" cursor-pointer group relative flex w-full max-w-sm items-center justify-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-6 py-4 text-[15px] font-semibold text-[#1f2937] transition-all hover:bg-[#f9fafb] hover:shadow-md active:scale-[0.98] pointer-cursor"
      >
        <GoogleIcon className="h-5 w-5" />
        <span>Kontynuuj przez Google</span>
      </button>

      {/* --- DEV LOGIN (tylko lokalnie, nie buduje się na produkcji) --- */}
      {IS_DEV && onDevLogin && (
        <div className="mt-6 w-full max-w-sm rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-left">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Dev login · wraca do koszyka
          </p>

          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600/80">
            Klienci — każdy to osobne konto
          </p>
          <div className="mb-3 grid grid-cols-5 gap-2">
            {DEV_CLIENTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onDevLogin({ role: "client", slot })}
                title={`Zaloguj jako Dev Klient ${slot}`}
                className="cursor-pointer rounded-lg border border-amber-300 bg-white py-2 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-100"
              >
                {slot}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onDevLogin({ role: "admin" })}
            className="w-full cursor-pointer rounded-lg bg-[#0c493e] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#09362e]"
          >
            Admin
          </button>
        </div>
      )}

      {/* Wizualna blokada sekcji płatności */}
      <div className="w-full mt-12 -mb-12  pt-12 border-t border-gray-100 opacity-40 grayscale select-none pointer-events-none">
        <h2 className="text-xl font-bold text-[#103830] mb-6 flex items-center gap-3 bb-">
          Dane do faktury
        </h2>
        <h2 className="text-xl font-bold text-[#103830] mb-6 flex items-center gap-3">
          Metoda płatności
        </h2>
      </div>
    </div>
  );
};
