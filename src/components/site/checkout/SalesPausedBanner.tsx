import { ShieldAlert } from "lucide-react";

/**
 * Baner awaryjnego wstrzymania sprzedaży (patrz src/lib/sales-pause.ts).
 * Stoi w miejscu formularza zakupu, więc nie da się go przeoczyć.
 */
export const SalesPausedBanner = () => (
  <div
    role="alert"
    className="rounded-2xl border border-amber-300 bg-amber-50 p-6 md:p-8 animate-in fade-in"
  >
    <div className="flex flex-col sm:flex-row items-start gap-4">
      <div className="shrink-0 rounded-xl bg-amber-400/20 p-2.5 text-amber-700">
        <ShieldAlert size={24} />
      </div>
      <div className="min-w-0 space-y-3 text-sm leading-relaxed text-amber-900">
        <h2 className="text-lg font-bold text-amber-950">
          Zakupy są chwilowo wstrzymane
        </h2>
        <p>
          Faktury za zakup e-booka były wystawiane automatycznie w serwisie{" "}
          <strong>Fakturownia</strong> — to tam trafiały dane do faktury
          (imię i nazwisko lub nazwa firmy, adres, NIP) i stamtąd można było
          pobrać fakturę. 28 września 2026 r. Fakturownia padła ofiarą ataku i
          poinformowała o naruszeniu ochrony danych.
        </p>
        <p>
          W ramach zabezpieczeń klucze dostępu, przez które nasz sklep łączył
          się z Fakturownią, zostały wygaszone. Bez nich nie możemy wystawiać
          faktur, dlatego do czasu wyjaśnienia sprawy{" "}
          <strong>wstrzymaliśmy sprzedaż e-booka</strong>.
        </p>
        <p>
          Jeśli kupiłaś/kupiłeś e-booka wcześniej, Twój dostęp działa bez zmian.
          Płatności obsługuje Stripe, a dane kart płatniczych nie były
          przekazywane do Fakturowni.
        </p>
        <p>
          Zachowaj czujność wobec wiadomości i telefonów z prośbą o przelew,
          zmianę numeru rachunku, hasła, kody BLIK lub dane karty — nie prosimy
          o nie w żadnej wiadomości.
        </p>
        <p className="font-medium">
          Przepraszamy za utrudnienia. Sprzedaż wznowimy, gdy tylko będzie to
          bezpieczne.
        </p>
      </div>
    </div>
  </div>
);
