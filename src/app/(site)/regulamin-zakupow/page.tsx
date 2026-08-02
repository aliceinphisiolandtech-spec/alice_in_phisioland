import React from "react";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Regulamin zakupu e-booka",
  description: "Regulamin zakupu treści cyfrowych w aplikacji Alice in Physioland.",
  path: "/regulamin-zakupow",
});

export default function EbookTermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm border border-gray-100 sm:p-12">
        <header className="mb-12 border-b border-gray-100 pb-8 text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-[#0c493e] sm:text-4xl">
            REGULAMIN ZAKUPU EBOOKA
          </h1>
          <h2 className="text-xl font-bold text-gray-800">
            Alice in Physioland
          </h2>
        </header>

        <div className="space-y-10 text-gray-600 leading-relaxed">
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §1 Postanowienia ogólne
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Regulamin określa zasady zakupu ebooków w aplikacji Alice in
                Physioland.
              </li>
              <li>Ebook jest treścią cyfrową udostępnianą w aplikacji.</li>
            </ol>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">§2 Zakup</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Zakup ebooka odbywa się poprzez aplikację.</li>
              <li>
                Płatności obsługiwane są przez operatora płatności Stripe.
              </li>
              <li>Ceny podane w aplikacji są cenami brutto.</li>
              <li>Sprzedawca korzysta ze zwolnienia z podatku VAT.</li>
            </ol>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §3 Dostęp do ebooka
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Po dokonaniu płatności użytkownik uzyskuje dostęp do ebooka w
                aplikacji.
              </li>
              <li>Ebook dostępny jest w formacie PDF w viewerze aplikacji.</li>
              <li>
                Pobranie pliku na urządzenie użytkownika nie jest możliwe.
              </li>
              <li>Dostęp do ebooka ma charakter bezterminowy.</li>
            </ol>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §4 Licencja
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Użytkownik otrzymuje niewyłączną licencję na korzystanie z
                ebooka.
              </li>
              <li>Licencja obejmuje korzystanie wyłącznie na własny użytek.</li>
              <li>
                Zabronione jest:
                <ul className="mt-2 list-[circle] pl-5 space-y-1 text-gray-500">
                  <li>kopiowanie ebooka</li>
                  <li>rozpowszechnianie ebooka</li>
                  <li>sprzedaż lub udostępnianie osobom trzecim.</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §5 Prawo odstąpienia od umowy
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Ebook jest treścią cyfrową dostarczaną natychmiast po zakupie.
              </li>
              <li>
                Użytkownik wyraża zgodę na rozpoczęcie świadczenia przed upływem
                14 dni.
              </li>
              <li>
                W związku z tym użytkownikowi nie przysługuje prawo odstąpienia
                od umowy zgodnie z art. 38 ustawy o prawach konsumenta.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §6 Reklamacje
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Reklamacje można zgłaszać na adres:{" "}
                <a
                  href="mailto:aliceinphysioland@gmail.com"
                  className="font-medium text-[#0c493e] hover:underline"
                >
                  aliceinphysioland@gmail.com
                </a>
              </li>
              <li>Reklamacja powinna zawierać opis problemu.</li>
              <li>Reklamacje rozpatrywane są w terminie 14 dni.</li>
            </ol>
          </section>
        </div>
      </article>
    </main>
  );
}
