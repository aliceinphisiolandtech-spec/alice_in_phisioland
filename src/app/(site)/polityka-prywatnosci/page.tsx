import React from "react";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Polityka prywatności",
  description: "Polityka prywatności aplikacji Alice in Physioland.",
  path: "/polityka-prywatnosci",
});

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm border border-gray-100 sm:p-12">
        <header className="mb-12 border-b border-gray-100 pb-8 text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-[#0c493e] sm:text-4xl">
            POLITYKA PRYWATNOŚCI
          </h1>
          <h2 className="text-xl font-bold text-gray-800">
            Alice in Physioland
          </h2>
        </header>

        <div className="space-y-10 text-gray-600 leading-relaxed">
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §1 Administrator danych
            </h3>
            <p className="mb-2">Administratorem danych osobowych jest:</p>
            <p className="font-medium text-gray-800">
              Alicja Wójcik
              <br />
              ul. Herbu Janina 9/23
              <br />
              02-972 Warszawa
              <br />
              NIP 9512526595
              <br />
              email:{" "}
              <a
                href="mailto:aliceinphysioland@gmail.com"
                className="text-[#0c493e] hover:underline"
              >
                aliceinphysioland@gmail.com
              </a>
            </p>
            <p className="mt-4">
              Administrator nie wyznaczył Inspektora Ochrony Danych.
            </p>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §2 Zakres przetwarzanych danych
            </h3>
            <p className="mb-2">Administrator może przetwarzać:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>imię i nazwisko</li>
              <li>adres e-mail</li>
              <li>dane konta Google</li>
              <li>dane dotyczące korzystania z aplikacji</li>
              <li>dane techniczne urządzenia</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §3 Cel przetwarzania danych
            </h3>
            <p className="mb-2">Dane przetwarzane są w celu:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>utworzenia i obsługi konta użytkownika</li>
              <li>umożliwienia korzystania z aplikacji</li>
              <li>realizacji zakupu ebooków</li>
              <li>obsługi płatności</li>
              <li>wysyłki newslettera</li>
              <li>marketingu własnych usług i produktów</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §4 Podstawa prawna przetwarzania
            </h3>
            <p className="mb-2">Dane przetwarzane są na podstawie:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>art. 6 ust. 1 lit. b RODO – realizacja umowy</li>
              <li>art. 6 ust. 1 lit. a RODO – zgoda użytkownika</li>
              <li>
                art. 6 ust. 1 lit. f RODO – uzasadniony interes administratora
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §5 Udostępnianie danych
            </h3>
            <p className="mb-2">
              Dane mogą być przekazywane podmiotom świadczącym usługi:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>obsługi płatności Stripe</li>
              <li>dostawcom infrastruktury IT i hostingu</li>
              <li>dostawcom usług analitycznych</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §6 Okres przechowywania danych
            </h3>
            <p className="mb-2">Dane przechowywane są przez okres:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>korzystania z konta</li>
              <li>do momentu wycofania zgody marketingowej</li>
              <li>wymagany przepisami prawa podatkowego</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §7 Prawa użytkownika
            </h3>
            <p className="mb-2">Użytkownik ma prawo do:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>dostępu do danych</li>
              <li>sprostowania danych</li>
              <li>usunięcia danych</li>
              <li>ograniczenia przetwarzania</li>
              <li>przeniesienia danych</li>
              <li>wniesienia sprzeciwu</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §8 Newsletter
            </h3>
            <ul className="list-decimal pl-5 space-y-2">
              <li>Użytkownik może zapisać się na newsletter.</li>
              <li>
                Newsletter może zawierać:
                <ul className="mt-2 list-[circle] pl-5 space-y-1 text-gray-500">
                  <li>treści edukacyjne</li>
                  <li>informacje o ebookach</li>
                  <li>informacje o szkoleniach.</li>
                </ul>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </main>
  );
}
