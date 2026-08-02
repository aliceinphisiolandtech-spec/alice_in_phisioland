import { NextResponse } from "next/server";
import { checkCronAuth, runDiscountCodes } from "@/lib/cron-tasks";

/**
 * Porządkowanie kodów rabatowych — pojedyncze zadanie.
 *
 * Logika siedzi w src/lib/cron-tasks.ts i jest współdzielona ze zbiorczym
 * /api/cron/daily, który w normalnym harmonogramie odpala to raz na dobę.
 * Ten endpoint zostaje do ręcznego odpalenia i debugowania.
 *
 * Wyłącza kody po terminie i powiadamia admina. To WYŁĄCZNIE porządkowanie
 * stanu w panelu — egzekwowanie terminu dzieje się przy każdej próbie użycia
 * kodu (`evaluateDiscount` w src/lib/discounts.ts).
 *
 * Endpoint jest chroniony nagłówkiem `Authorization: Bearer <CRON_SECRET>`:
 *   GET https://twojadomena.pl/api/cron/discount-codes
 *   Header: Authorization: Bearer <CRON_SECRET>
 */

export const dynamic = "force-dynamic";

async function handle(req: Request) {
  const auth = checkCronAuth(req);
  if (auth === "unconfigured") {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (auth === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDiscountCodes();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return handle(req);
}

// Część schedulerów woła POST — obsługujemy oba.
export async function POST(req: Request) {
  return handle(req);
}
