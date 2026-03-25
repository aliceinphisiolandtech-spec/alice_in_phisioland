import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamin | Alice in Physioland",
  description: "Regulamin korzystania z aplikacji Alice in Physioland.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm border border-gray-100 sm:p-12">
        {/* NAGŁÓWEK DOKUMENTU */}
        <header className="mb-12 border-b border-gray-100 pb-8 text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-[#0c493e] sm:text-4xl">
            REGULAMIN KORZYSTANIA Z APLIKACJI
          </h1>
          <h2 className="text-xl font-bold text-gray-800">
            Alice in Physioland
          </h2>
          <p className="mt-4 text-sm text-gray-400">
            Ostatnia aktualizacja: {new Date().toLocaleDateString("pl-PL")}
          </p>
        </header>

        {/* TREŚĆ REGULAMINU */}
        <div className="space-y-10 text-gray-600 leading-relaxed">
          {/* Paragraf 1 */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §1 Postanowienia ogólne
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Regulamin określa zasady korzystania z aplikacji mobilnej Alice
                in Physioland.
              </li>
              <li>
                Właścicielem aplikacji jest Alicja Wójcik, prowadząca
                jednoosobową działalność gospodarczą pod firmą Alicja Wójcik, z
                siedzibą przy ul. Herbu Janina 9/23, 02-972 Warszawa, NIP
                9512526595.
              </li>
              <li>
                Kontakt z administratorem możliwy jest pod adresem e-mail:{" "}
                <a
                  href="mailto:aliceinphysioland@gmail.com"
                  className="font-medium text-[#0c493e] hover:underline"
                >
                  aliceinphysioland@gmail.com
                </a>
                .
              </li>
              <li>
                Aplikacja jest dostępna na urządzeniach mobilnych oraz w wersji
                webowej.
              </li>
              <li>
                Regulamin jest dostępny w aplikacji oraz na stronie internetowej
                powiązanej z aplikacją.
              </li>
            </ol>
          </section>

          {/* Paragraf 2 */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §2 Definicje
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Aplikacja</strong> – aplikacja Alice in Physioland
                umożliwiająca dostęp do treści edukacyjnych.
              </li>
              <li>
                <strong>Administrator / Usługodawca</strong> – Alicja Wójcik.
              </li>
              <li>
                <strong>Użytkownik</strong> – osoba fizyczna korzystająca z
                aplikacji.
              </li>
              <li>
                <strong>Konto</strong> – indywidualne konto użytkownika
                utworzone w aplikacji.
              </li>
              <li>
                <strong>Treści cyfrowe</strong> – materiały udostępniane w
                aplikacji, w szczególności ebooki.
              </li>
            </ul>
          </section>

          {/* Paragraf 3 */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §3 Warunki korzystania z aplikacji
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Korzystanie z aplikacji jest bezpłatne.</li>
              <li>
                Dostęp do niektórych treści w aplikacji może wymagać dokonania
                zakupu.
              </li>
              <li>
                Użytkownik może korzystać z aplikacji wyłącznie w sposób zgodny
                z prawem i niniejszym regulaminem.
              </li>
              <li>
                Zabronione jest:
                <ul className="mt-2 list-[circle] pl-5 space-y-1 text-gray-500">
                  <li>podejmowanie prób ingerencji w działanie aplikacji,</li>
                  <li>
                    wykorzystywanie aplikacji w sposób sprzeczny z jej
                    przeznaczeniem,
                  </li>
                  <li>
                    kopiowanie lub rozpowszechnianie treści bez zgody
                    administratora.
                  </li>
                </ul>
              </li>
            </ol>
          </section>

          {/* Paragraf 4 */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §4 Konto użytkownika
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Aby korzystać z aplikacji, użytkownik musi utworzyć konto.
              </li>
              <li>Rejestracja odbywa się za pomocą konta Google.</li>
              <li>
                Podczas rejestracji aplikacja może uzyskać dostęp do
                podstawowych danych użytkownika, takich jak imię, nazwisko oraz
                adres e-mail.
              </li>
              <li>
                Użytkownik jest zobowiązany do korzystania z konta w sposób
                zgodny z prawem.
              </li>
              <li>
                Użytkownik może usunąć konto w dowolnym momencie poprzez
                wysłanie wiadomości e-mail do administratora.
              </li>
            </ol>
          </section>

          {/* Paragraf 5 */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §5 Wiek użytkownika
            </h3>
            <p>
              Korzystanie z aplikacji jest przeznaczone dla osób, które
              ukończyły 16 lat.
            </p>
          </section>

          {/* Paragraf 6 */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §6 Treści edukacyjne
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Treści dostępne w aplikacji mają charakter edukacyjny i są
                skierowane do studentów fizjoterapii oraz fizjoterapeutów.
              </li>
              <li>
                Administrator dokłada starań, aby treści były rzetelne i
                aktualne.
              </li>
              <li>
                Treści nie stanowią indywidualnej porady medycznej ani
                konsultacji medycznej.
              </li>
            </ol>
          </section>

          {/* Paragraf 7 */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §7 Szkolenia
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                W aplikacji mogą być prezentowane informacje o szkoleniach
                stacjonarnych.
              </li>
              <li>
                Zapisy na szkolenia odbywają się poprzez zewnętrzną stronę
                internetową.
              </li>
              <li>
                Administrator nie odpowiada za działanie zewnętrznych stron
                internetowych.
              </li>
            </ol>
          </section>

          {/* Paragraf 8 */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §8 Linki zewnętrzne
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Aplikacja może zawierać linki do zewnętrznych serwisów, w tym do
                serwisu Instagram.
              </li>
              <li>
                Administrator nie ponosi odpowiedzialności za treści publikowane
                w tych serwisach.
              </li>
            </ol>
          </section>

          {/* Paragraf 9 */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §9 Odpowiedzialność
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Administrator dokłada starań, aby aplikacja działała prawidłowo.
              </li>
              <li>
                Administrator nie gwarantuje nieprzerwanego działania aplikacji.
              </li>
              <li>
                Administrator nie odpowiada za problemy techniczne wynikające z
                urządzenia użytkownika lub połączenia internetowego.
              </li>
            </ol>
          </section>

          {/* Paragraf 10 */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §10 Zmiany regulaminu
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Administrator może zmienić regulamin w przypadku:
                <ul className="mt-2 list-[circle] pl-5 space-y-1 text-gray-500">
                  <li>zmian w funkcjonowaniu aplikacji,</li>
                  <li>zmian w przepisach prawa.</li>
                </ul>
              </li>
              <li>
                Aktualna wersja regulaminu jest zawsze dostępna w aplikacji.
              </li>
            </ol>
          </section>
        </div>
      </article>
    </main>
  );
}
