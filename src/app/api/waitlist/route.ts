import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { SubscribeToWaitlistSchema } from "@/lib/validators/waitlist";
import {
  countWaitlistSignups,
  getWaitlistPageBySlug,
  recordWaitlistSubscription,
  resolveWaitlistPageStatus,
  type WaitlistPageStatus,
} from "@/lib/waitlist";

/**
 * Publiczny zapis na listę oczekujących.
 *
 * Endpoint jest otwarty (bez logowania) i linkowany wprost z posta w social
 * mediach, więc traktujemy go jak powierzchnię ataku: limit zapytań na IP,
 * pułapka na boty i walidacja przed dotknięciem bazy.
 */

// Zapis musi widzieć aktualny stan kampanii — żadnego cache'owania odpowiedzi.
export const dynamic = "force-dynamic";

/**
 * Limit prób na IP. Świadomie luźny: ruch idzie z posta na Instagramie, czyli
 * w większości z telefonów, a operatorzy komórkowi trzymają setki klientów za
 * jednym adresem (CGNAT). Zbyt ciasny limit odciąłby realne zapisy w szczycie
 * kampanii, a przed zmasowanym botem i tak nie chroni — ten zmienia IP.
 * Chodzi o zatrzymanie prostego zapętlonego skryptu, nie o twardą bramkę.
 */
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 10 * 60_000;

/**
 * Wyjaśnienie dla użytkownika, dlaczego zapis nie przeszedł.
 *
 * Komunikat ma podawać prawdziwy powód, bo od niego zależy, co ktoś zrobi
 * dalej: „jeszcze nie ruszyły" znaczy wróć później, „komplet" znaczy pilnuj
 * kolejnej akcji, „zamknięte" znaczy koniec tematu. Rekord po `Exclude`
 * wymusza uzupełnienie tej mapy, gdyby doszedł nowy status — inaczej nowy
 * przypadek po cichu dostałby `undefined` zamiast zdania.
 */
const CLOSED_MESSAGES: Record<Exclude<WaitlistPageStatus, "open">, string> = {
  not_started: "Zapisy jeszcze się nie rozpoczęły.",
  closed: "Zapisy na tę listę zostały już zamknięte.",
  full: "Wszystkie miejsca zostały już zajęte.",
};

function clientIp(req: Request): string {
  // Za proxy (Vercel) prawdziwy adres jest w x-forwarded-for; pierwszy wpis
  // to klient, kolejne to proxy po drodze.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);

    const limit = rateLimit(`waitlist:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: "Zbyt wiele prób zapisu. Spróbuj ponownie za chwilę." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await req.json().catch(() => null);
    const validation = SubscribeToWaitlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    // `consent` nie jest tu potrzebne: schemat wymaga wartości `true`, więc do
    // tego miejsca docierają wyłącznie żądania z zaznaczoną zgodą. Jej treść
    // zapisujemy przy kontakcie ze strony (nie z żądania — przeglądarka mogłaby
    // przysłać dowolny tekst).
    const { slug, email, name, website } = validation.data;

    // Honeypot wypełniony = bot. Odpowiadamy sukcesem i nic nie zapisujemy,
    // żeby nie dawać sygnału, że pułapka została wykryta.
    if (website) {
      return NextResponse.json(
        { status: "subscribed", title: "Gotowe!", message: "Dziękujemy." },
        { status: 200 },
      );
    }

    const page = await getWaitlistPageBySlug(slug);

    if (!page) {
      return NextResponse.json(
        { message: "Nie znaleźliśmy tej listy zapisów." },
        { status: 404 },
      );
    }

    // Powtórka sprawdzenia z renderowania strony: między wyświetleniem
    // formularza a kliknięciem kampania mogła zostać zamknięta albo zapełniona.
    //
    // Licznik pobieramy tylko przy ustawionym limicie — bez niego byłoby to
    // zbędne zapytanie przy każdym zapisie. Pominięcie go tutaj sprawiłoby, że
    // reguła widzi zero zajętych miejsc i limit 0 („zatrzymaj zapisy") byłby
    // jedynym, który by zadziałał.
    const signupCount =
      page.maxSignups === null ? 0 : await countWaitlistSignups(page.id);

    const status = resolveWaitlistPageStatus({ ...page, signupCount });

    // „Komplet" świadomie NIE kończy tu sprawy.
    //
    // Osoba już zapisana nie zajmuje nowego miejsca, a bywa, że klika drugi raz
    // — bo nie była pewna, czy zapis przeszedł. Odcięcie jej tutaj dałoby
    // komunikat „nie zdążyłaś", mimo że jest na liście. Decyzję podejmuje więc
    // sam zapis, który jako jedyny wie, czy ten adres już istnieje.
    //
    // Pozostałe stany (przed startem, po terminie, wyłączona) dotyczą całej
    // kampanii i nie zależą od tego, kto wysyła formularz.
    if (status !== "open" && status !== "full") {
      return NextResponse.json(
        { message: CLOSED_MESSAGES[status] },
        { status: 409 },
      );
    }

    if (page.collectName && !name) {
      return NextResponse.json(
        { message: "Podaj swoje imię." },
        { status: 400 },
      );
    }

    const outcome = await recordWaitlistSubscription({
      page,
      email,
      name,
      ipAddress: ip === "unknown" ? null : ip,
      userAgent: req.headers.get("user-agent"),
    });

    // Nowy adres, a miejsc już nie ma. 409, bo to konflikt ze stanem kampanii,
    // a nie błąd wysłanych danych — front rozróżnia te przypadki po statusie.
    if (outcome.status === "full") {
      return NextResponse.json(
        { message: CLOSED_MESSAGES.full },
        { status: 409 },
      );
    }

    // Ponowny zapis tego samego adresu to dla użytkownika również sukces —
    // nie karzemy komunikatem o błędzie kogoś, kto po prostu zapomniał.
    return NextResponse.json(
      {
        status: outcome.status,
        title: page.successTitle,
        message:
          outcome.status === "already_subscribed"
            ? "Ten adres jest już na liście — nie musisz robić nic więcej."
            : page.successMessage,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[WAITLIST_SUBSCRIBE_ERROR]", error);
    return NextResponse.json(
      { message: "Nie udało się zapisać. Spróbuj ponownie za chwilę." },
      { status: 500 },
    );
  }
}
