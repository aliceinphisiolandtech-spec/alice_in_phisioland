import React from "react";
import { ANALYTICS_ENABLED } from "@/lib/consent";
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
              Dane mogą być przekazywane podmiotom przetwarzającym je na
              zlecenie Administratora:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>obsługa płatności — Stripe</li>
              <li>wystawianie faktur — Fakturownia</li>
              <li>
                hosting aplikacji i baza danych (serwery w Unii Europejskiej)
              </li>
              <li>
                wysyłka wiadomości e-mail i obsługa list adresowych — MailerLite
                (MailerLite Limited, Irlandia / MailerLite UAB, Litwa)
              </li>
              <li>monitorowanie błędów aplikacji — Sentry (region UE)</li>
              <li>statystyki odwiedzin strony — Vercel Analytics</li>
              <li>powiadomienia push — OneSignal</li>
              <li>logowanie kontem Google — Google</li>
            </ul>
            <p className="mt-4">
              Dane nie są przekazywane poza Europejski Obszar Gospodarczy, chyba
              że dostawca zapewnia odpowiedni stopień ochrony na podstawie
              standardowych klauzul umownych.
            </p>
          </section>

          {/*
            Lista oczekujących ma własny paragraf, a nie wzmiankę w §8, bo
            zbiera inny komplet danych niż newsletter (dowód zgody: jej treść,
            moment, adres IP) i na innej podstawie niż konto użytkownika.
            RODO wymaga, żeby osoba zapisująca się wiedziała dokładnie, co
            i po co zapisujemy — a te dane są zapisywane właśnie po to,
            by móc później wykazać, na co się zgodziła.
          */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §5a Lista oczekujących (zapisy na akcje i promocje)
            </h3>

            <p className="mb-2">
              Na stronach zapisów (adresy w formie{" "}
              <span className="font-mono text-sm">/zapisy/…</span>)
              Administrator zbiera dane osób zainteresowanych nadchodzącymi
              akcjami, promocjami i premierami.
            </p>

            <p className="mt-4 mb-2 font-medium text-gray-800">
              Zakres zbieranych danych:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>adres e-mail</li>
              <li>imię — wyłącznie, jeśli formularz o nie pyta</li>
              <li>
                dowód udzielonej zgody: jej dokładna treść, data i godzina
                zapisu, adres IP oraz informacja o przeglądarce
              </li>
            </ul>

            <p className="mt-4 mb-2 font-medium text-gray-800">
              Cel i podstawa prawna:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                wysyłka informacji handlowych o zapowiadanej akcji — zgoda
                osoby, której dane dotyczą (art. 6 ust. 1 lit. a RODO)
              </li>
              <li>
                zapisanie treści zgody, daty i adresu IP — prawnie uzasadniony
                interes Administratora polegający na możliwości wykazania, że
                zgoda została udzielona (art. 6 ust. 1 lit. f w związku z art. 7
                ust. 1 RODO)
              </li>
            </ul>

            <p className="mt-4 mb-2 font-medium text-gray-800">
              Okres przechowywania:
            </p>
            <p>
              Do momentu wycofania zgody, a jeżeli zgoda nie zostanie wycofana —
              nie dłużej niż 3 lata od ostatniego kontaktu. Dowód udzielenia
              zgody jest przechowywany przez okres przedawnienia ewentualnych
              roszczeń.
            </p>

            <p className="mt-4">
              Zgodę można wycofać w każdej chwili, klikając link rezygnacji w
              stopce wiadomości albo pisząc na adres e-mail Administratora.
              Wycofanie zgody nie wpływa na zgodność z prawem przetwarzania,
              którego dokonano przed jej wycofaniem.
            </p>

            <p className="mt-4">
              Zebrane adresy są przekazywane do systemu MailerLite, który
              obsługuje wysyłkę wiadomości na zlecenie Administratora.
            </p>
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

          {/*
            Sekcja o cookies opisuje STAN FAKTYCZNY. Akapit o Google Analytics
            renderuje się wyłącznie, gdy GA4 jest włączone (NEXT_PUBLIC_GA_ID)
            — polityka nie może obiecywać ani ukrywać czegoś, czego strona
            akurat nie robi. Analityka startuje dopiero po zgodzie z banera
            (components/consent). PROJEKT TREŚCI — do akceptacji klientki.
          */}
          <section id="cookies" className="scroll-mt-24">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              §6a Pliki cookies i dane zapisywane na urządzeniu
            </h3>
            <p className="mb-2">
              Serwis zapisuje na urządzeniu dane niezbędne do jego działania —
              na to zgoda nie jest wymagana:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                pliki cookies sesji logowania — bez nich nie da się utrzymać
                zalogowania i korzystać z panelu
              </li>
              <li>
                dane powiadomień push — zapisywane dopiero po samodzielnym
                włączeniu powiadomień w panelu, w zakładce Profil, i możliwe do
                wyłączenia w ustawieniach przeglądarki
              </li>
              {ANALYTICS_ENABLED && (
                <li>
                  informacja o Twojej decyzji dotyczącej plików cookies — żeby
                  nie pytać o nią przy każdej wizycie
                </li>
              )}
            </ul>

            {ANALYTICS_ENABLED ? (
              <>
                <p className="mt-4 mb-2 font-semibold text-gray-900">
                  Analityczne pliki cookies (Google Analytics 4) — tylko za
                  Twoją zgodą
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Cel: statystyki odwiedzin (np. które strony są czytane, skąd
                    przychodzą odwiedzający), żeby rozwijać serwis.
                  </li>
                  <li>
                    Podstawa prawna: Twoja zgoda (art. 6 ust. 1 lit. a RODO oraz
                    art. 399 ustawy Prawo komunikacji elektronicznej). Bez zgody
                    skrypt Google Analytics nie jest w ogóle ładowany.
                  </li>
                  <li>
                    Odbiorca: Google Ireland Limited (Gordon House, Barrow
                    Street, Dublin 4, Irlandia) jako podmiot przetwarzający.
                    Dane mogą być przekazywane do Google LLC w USA na podstawie
                    decyzji Komisji Europejskiej o odpowiednim stopniu ochrony
                    (EU-US Data Privacy Framework).
                  </li>
                  <li>
                    Pliki: <code>_ga</code> i{" "}
                    <code>_ga_&lt;identyfikator&gt;</code>, przechowywane do 13
                    miesięcy. Funkcje reklamowe i personalizacja reklam są
                    wyłączone.
                  </li>
                  <li>
                    Zgodę możesz w każdej chwili zmienić lub wycofać przez link
                    „Ustawienia cookies” w stopce strony — wycofanie usuwa pliki
                    Google Analytics z Twojej przeglądarki. Wycofanie zgody nie
                    wpływa na zgodność z prawem przetwarzania sprzed wycofania.
                  </li>
                </ul>
              </>
            ) : (
              <p className="mt-3">
                Statystyki odwiedzin prowadzone są w sposób, który nie
                wykorzystuje plików cookies ani trwałych identyfikatorów
                użytkownika.
              </p>
            )}

            <p className="mt-3">
              Serwis nie korzysta z reklamowych plików cookies ani z
              profilowania na potrzeby reklamy.
            </p>
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
              <li>
                wniesienia skargi do organu nadzorczego — Prezesa Urzędu Ochrony
                Danych Osobowych, ul. Stawki 2, 00-193 Warszawa
              </li>
            </ul>
            <p className="mt-3">
              Konto wraz z powiązanymi danymi można usunąć samodzielnie w
              panelu, w zakładce Profil. Dane z wystawionych faktur pozostają
              przez okres wymagany przepisami prawa podatkowego.
            </p>
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
