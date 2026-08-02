import { NextResponse } from "next/server";
import {
  checkCronAuth,
  runAbandonedCarts,
  runDiscountCodes,
} from "@/lib/cron-tasks";

/**
 * Zbiorcze zadanie dobowe — jeden wpis w schedulerze zamiast dwóch.
 *
 * Uruchamia po kolei porządkowanie kodów rabatowych i wykrywanie porzuconych
 * koszyków. Zadania są od siebie niezależne: błąd jednego nie blokuje drugiego,
 * ale endpoint zwróci wtedy 500, żeby scheduler oznaczył przebieg jako błędny
 * i wysłał powiadomienie.
 *
 * Endpoint jest chroniony nagłówkiem `Authorization: Bearer <CRON_SECRET>`.
 * Podłącz pod zewnętrzny scheduler (np. cron-job.org), wołając raz na dobę:
 *   GET https://twojadomena.pl/api/cron/daily
 *   Header: Authorization: Bearer <CRON_SECRET>
 *   Harmonogram: 30 23 * * *  (strefa Europe/Warsaw)
 *
 * Pojedyncze endpointy /api/cron/discount-codes i /api/cron/abandoned-carts
 * zostają — służą do ręcznego odpalenia jednego zadania i do rozdzielenia
 * harmonogramu, gdyby porzucone koszyki miały wrócić na częstszy cykl.
 */

// Zbiorczy przebieg robi dwa razy więcej roboty niż pojedynczy — dajemy mu
// zapas czasu ponad domyślne 15 s (limit respektuje Vercel; gdzie indziej ignorowany).
export const maxDuration = 60;

// Zadanie zawsze ma czytać aktualny stan bazy, nigdy cache'owaną odpowiedź.
export const dynamic = "force-dynamic";

type TaskOutcome =
  | { ok: true; result: unknown }
  | { ok: false; error: string };

async function runTask(
  name: string,
  task: () => Promise<unknown>,
): Promise<TaskOutcome> {
  try {
    const result = await task();
    console.log(`✅ [cron/daily] ${name}`, result);
    return { ok: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ [cron/daily] ${name} nie powiodło się:`, error);
    return { ok: false, error: message };
  }
}

async function handle(req: Request) {
  const auth = checkCronAuth(req);
  if (auth === "unconfigured") {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (auth === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();

  // Kolejność ma znaczenie tylko o tyle, że kody rabatowe to zadanie krótkie
  // i przewidywalne — niech zdąży, zanim koszyki zaczną odpytywać OneSignal.
  const discountCodes = await runTask("discount-codes", runDiscountCodes);
  const abandonedCarts = await runTask("abandoned-carts", runAbandonedCarts);

  const allOk = discountCodes.ok && abandonedCarts.ok;

  return NextResponse.json(
    {
      ok: allOk,
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      tasks: { discountCodes, abandonedCarts },
    },
    { status: allOk ? 200 : 500 },
  );
}

export async function GET(req: Request) {
  return handle(req);
}

// Część schedulerów woła POST — obsługujemy oba.
export async function POST(req: Request) {
  return handle(req);
}
