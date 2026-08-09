import { NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/cron-tasks";
import { runWaitlistSync } from "@/lib/waitlist";

/**
 * Dosyłanie do MailerLite zapisów, które nie przeszły za pierwszym razem —
 * pojedyncze zadanie.
 *
 * Logika jest ta sama, którą odpala zbiorczy /api/cron/daily. Ten endpoint
 * istnieje po to, żeby dało się rozdzielić harmonogram: w trakcie kampanii
 * warto dosyłać co godzinę, a nie raz na dobę.
 *
 * Ma to znaczenie zwłaszcza wtedy, gdy konto MailerLite chwilowo nie przyjmuje
 * kontaktów (wyczerpany limit planu, konto w weryfikacji). Wszystkie zapisy
 * czekają wtedy w naszej bazie ze statusem „pending" i idą dopiero przy
 * kolejnym przebiegu — przy cyklu dobowym oznacza to nawet 24 godziny
 * opóźnienia od momentu odblokowania konta.
 *
 * Endpoint jest chroniony nagłówkiem `Authorization: Bearer <CRON_SECRET>`:
 *   GET https://twojadomena.pl/api/cron/waitlist
 *   Header: Authorization: Bearer <CRON_SECRET>
 */

export const dynamic = "force-dynamic";

// Zadanie jest sieciowe: jedno zapytanie do MailerLite na każdy zaległy zapis,
// paczkami po 100. Domyślne 15 s bywa za mało przy większej zaległości.
export const maxDuration = 60;

async function handle(req: Request) {
  const auth = checkCronAuth(req);
  if (auth === "unconfigured") {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (auth === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWaitlistSync();
    console.log("✅ [cron/waitlist]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [cron/waitlist] nie powiodło się:", error);

    // 500 świadomie: scheduler ma oznaczyć przebieg jako błędny i powiadomić.
    // Cicha „dwusetka" przy nieudanej dosyłce znaczyłaby, że nikt się nie
    // dowie, że kontakty stoją w miejscu.
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handle(req);
}

// Część schedulerów woła POST — obsługujemy oba.
export async function POST(req: Request) {
  return handle(req);
}
