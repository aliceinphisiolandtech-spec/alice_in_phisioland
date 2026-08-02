import { NextResponse } from "next/server";
import { checkCronAuth, runAbandonedCarts } from "@/lib/cron-tasks";

/**
 * Wykrywanie porzuconych koszyków — pojedyncze zadanie.
 *
 * Logika siedzi w src/lib/cron-tasks.ts i jest współdzielona ze zbiorczym
 * /api/cron/daily, który w normalnym harmonogramie odpala to raz na dobę.
 * Ten endpoint zostaje do ręcznego odpalenia oraz na wypadek powrotu
 * do częstszego cyklu (np. co 10 min), gdyby powiadomienia miały znów
 * docierać na bieżąco, a nie jako dzienny raport.
 *
 * Endpoint jest chroniony nagłówkiem `Authorization: Bearer <CRON_SECRET>`:
 *   GET https://twojadomena.pl/api/cron/abandoned-carts
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

  const result = await runAbandonedCarts();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return handle(req);
}

// Część schedulerów woła POST — obsługujemy oba.
export async function POST(req: Request) {
  return handle(req);
}
