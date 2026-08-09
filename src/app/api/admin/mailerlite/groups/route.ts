import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isMailerliteConfigured,
  listMailerliteGroups,
  type MailerliteGroup,
} from "@/lib/mailerlite";

/**
 * Lista grup z konta MailerLite — zasila pole wyboru w kreatorze stron zapisów.
 *
 * Endpoint zawsze odpowiada 200 z rozróżnialnym stanem, nawet gdy MailerLite
 * nie odpowiada. Powód: brak listy grup NIE MOŻE zablokować zapisania kampanii.
 * Formularz degraduje się wtedy do ręcznego wpisania ID grupy i klientka nadal
 * może opublikować stronę — awaria cudzego API nie zatrzymuje jej pracy.
 */

export const dynamic = "force-dynamic";

/**
 * Prosty cache w pamięci procesu. Kreator odpytuje ten endpoint przy każdym
 * otwarciu formularza, a grupy zmieniają się raz na kilka tygodni — bez tego
 * kilka kliknięć pod rząd zjadałoby limit zapytań MailerLite bez powodu.
 *
 * Na serverless cache żyje per instancja, więc to zabezpieczenie „best effort",
 * dokładnie tak jak limiter w `src/lib/rate-limit.ts`.
 */
const CACHE_TTL_MS = 60_000;

let cache: { groups: MailerliteGroup[]; storedAt: number } | null = null;

type GroupsResponse =
  | { status: "ok"; groups: MailerliteGroup[] }
  /** Brak klucza API — to konfiguracja, nie awaria. */
  | { status: "not_configured"; groups: []; message: string }
  /** MailerLite nie odpowiedział — formularz przechodzi na ręczne ID. */
  | { status: "unavailable"; groups: []; message: string };

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 403 });
  }

  if (!isMailerliteConfigured()) {
    return NextResponse.json<GroupsResponse>({
      status: "not_configured",
      groups: [],
      message:
        "Konto MailerLite nie jest podpięte. Uzupełnij MAILERLITE_API_KEY, " +
        "albo wpisz ID grupy ręcznie — strona będzie zbierać adresy niezależnie.",
    });
  }

  const fresh = cache && Date.now() - cache.storedAt < CACHE_TTL_MS;
  if (fresh && cache) {
    return NextResponse.json<GroupsResponse>({
      status: "ok",
      groups: cache.groups,
    });
  }

  const result = await listMailerliteGroups();

  if (!result.ok) {
    console.error("[MAILERLITE_GROUPS_ERROR]", result.reason, result.message);

    // Nieświeży cache jest lepszy niż pusta lista: grupy zmieniają się rzadko,
    // a wybór sprzed minuty prawie na pewno jest nadal poprawny.
    if (cache) {
      return NextResponse.json<GroupsResponse>({
        status: "ok",
        groups: cache.groups,
      });
    }

    return NextResponse.json<GroupsResponse>({
      status: "unavailable",
      groups: [],
      message:
        result.reason === "unauthorized"
          ? "MailerLite odrzucił klucz API. Sprawdź MAILERLITE_API_KEY."
          : "MailerLite chwilowo nie odpowiada. Możesz wpisać ID grupy ręcznie.",
    });
  }

  cache = { groups: result.data, storedAt: Date.now() };

  return NextResponse.json<GroupsResponse>({
    status: "ok",
    groups: result.data,
  });
}
