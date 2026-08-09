import Image from "next/image";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { THEME_TOKENS } from "@/lib/waitlist-appearance";

/**
 * Ekran dla nieistniejącego adresu kampanii.
 *
 * Warto go mieć, bo link do strony zapisów żyje w poście na Instagramie —
 * i zdarzy się, że ktoś go przepisze z literówką albo kliknie po zakończeniu
 * i usunięciu akcji. Domyślny ekran Next.js („This page could not be found")
 * jest po angielsku i bez marki; tutaj dostaje tożsamość i wyjście dalej.
 *
 * Motyw jest domyślny (zielony), bo w tym miejscu nie wiadomo już, o którą
 * kampanię chodziło — a więc i jaki miała mieć wygląd.
 *
 * ZNANE OGRANICZENIE: odpowiedź ma status 200, nie 404. Powodem jest
 * `src/app/loading.tsx` w korzeniu aplikacji — tworzy granicę Suspense, więc
 * Next wysyła nagłówki zanim komponent strony zdąży wywołać `notFound()`.
 * Dotyczy to całej aplikacji (tak samo zachowuje się `admin/news/[newsId]`
 * i czytnik e-booka), a nie tylko stron zapisów. Dla tych stron jest to bez
 * praktycznych skutków: są oznaczone `noindex` i wykluczone w `robots.ts`,
 * więc żadna wyszukiwarka i tak ich nie indeksuje.
 */
export default function WaitlistNotFound() {
  const tokens = THEME_TOKENS.forest;

  return (
    <>
      <div aria-hidden className={`fixed inset-0 -z-10 ${tokens.page}`} />

      <header className="flex justify-center px-6 pt-8 pb-2 sm:pt-10">
        <Link href="/" aria-label="Alice in Physioland — strona główna">
          <Image
            src={tokens.logoSrc}
            alt="Alice in Physioland"
            width={132}
            height={44}
            priority
            className="h-9 w-auto sm:h-11"
          />
        </Link>
      </header>

      <main className="flex flex-grow items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <section
          className={`w-full max-w-[520px] rounded-[20px] px-6 py-10 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] sm:px-10 ${tokens.surface}`}
        >
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${tokens.noticeIcon}`}
          >
            <SearchX size={22} />
          </div>

          <h1 className={`text-[24px] font-bold sm:text-[28px] ${tokens.heading}`}>
            Nie ma tu żadnych zapisów
          </h1>

          <p className={`mt-3 text-[15px] leading-[165%] ${tokens.body}`}>
            Ta lista albo już się zamknęła, albo w linku jest literówka.
            Sprawdź adres w poście, z którego tu trafiłaś — a jeśli wszystko się
            zgadza, daj mi znać.
          </p>

          <Link
            href="/"
            className={`mt-7 inline-flex min-h-[48px] items-center justify-center rounded-[10px] px-6 text-[15px] font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] ${tokens.button}`}
          >
            Przejdź na stronę główną
          </Link>
        </section>
      </main>

      <footer className="px-6 pt-4 pb-8 text-center">
        <nav
          className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] ${tokens.footerLink}`}
        >
          <Link href="/polityka-prywatnosci" className="transition-colors">
            Polityka prywatności
          </Link>
          <Link href="/regulamin" className="transition-colors">
            Regulamin
          </Link>
        </nav>
      </footer>
    </>
  );
}
