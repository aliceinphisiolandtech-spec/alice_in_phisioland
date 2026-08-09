/**
 * Test całej ścieżki zapisu: żądanie HTTP -> nasza baza -> MailerLite.
 *
 * Uruchomienie:  node --env-file=.env scripts/waitlist-e2e-test.js <baseUrl> <slug>
 *
 * Skrypt jest SPRZĄTAJĄCY: kontakt testowy usuwa i z MailerLite, i z naszej
 * bazy. Konto klientki ma zostać takie, jakie było — test nie może zostawiać
 * śmieci na liście, do której zaraz pójdzie prawdziwa kampania.
 *
 * Nie importuje `src/lib/mailerlite.ts` (TypeScript + aliasy ścieżek), tylko
 * woła API bezpośrednio — ma działać czystym `node`, bez budowania projektu.
 */

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

const API = "https://connect.mailerlite.com/api";
const KEY = process.env.MAILERLITE_API_KEY?.trim();

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const slug = process.argv[3] ?? "lato";
const email = `e2e-test-${Date.now()}@kocikdev.com`;

const ok = (label) => console.log(`   ✅ ${label}`);
const fail = (label) => {
  console.log(`   ❌ ${label}`);
  process.exitCode = 1;
};

async function mailerlite(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const text = await response.text();
  return {
    status: response.status,
    data: text ? JSON.parse(text) : null,
  };
}

async function main() {
  if (!KEY) {
    console.error("❌ Brak MAILERLITE_API_KEY.");
    process.exit(1);
  }

  console.log(`\n🧪 Test ścieżki zapisu\n`);
  console.log(`   Strona: ${baseUrl}/zapisy/${slug}`);
  console.log(`   Adres testowy: ${email}\n`);

  // --- 1. Zapis przez publiczny formularz ---
  console.log("1) Wysyłam formularz…");
  const response = await fetch(`${baseUrl}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, email, consent: true }),
  });
  const body = await response.json();

  if (response.status === 200 && body.status === "subscribed") {
    ok(`Formularz przyjął zapis (HTTP 200)`);
  } else {
    fail(`Nieoczekiwana odpowiedź (HTTP ${response.status}): ${body.message}`);
    return;
  }

  // --- 2. Nasza baza ---
  console.log("\n2) Sprawdzam naszą bazę…");
  const page = await prisma.waitlistPage.findUnique({ where: { slug } });
  const record = await prisma.waitlistSubscriber.findUnique({
    where: { pageId_email: { pageId: page.id, email } },
  });

  if (!record) {
    fail("Kontaktu nie ma w naszej bazie");
    return;
  }

  ok("Kontakt zapisany lokalnie (kopia zapasowa działa)");
  console.log(`      status wysyłki: ${record.syncStatus}`);
  if (record.syncError) console.log(`      komunikat: ${record.syncError}`);

  if (record.syncStatus === "synced") ok("Oznaczony jako wysłany do MailerLite");
  else fail(`Spodziewano się 'synced', jest '${record.syncStatus}'`);

  // --- 3. MailerLite ---
  console.log("\n3) Sprawdzam konto MailerLite…");
  const found = await mailerlite(`/subscribers/${encodeURIComponent(email)}`);

  if (found.status === 200) {
    ok("Kontakt jest na koncie MailerLite");
    console.log(`      status: ${found.data?.data?.status}`);
    const groups = found.data?.data?.groups ?? [];
    console.log(
      `      grupy: ${groups.length ? groups.map((g) => g.name).join(", ") : "— (bez grupy)"}`,
    );
  } else {
    fail(`MailerLite nie zna tego adresu (HTTP ${found.status})`);
  }

  // --- 4. Sprzątanie ---
  console.log("\n4) Sprzątam po teście…");
  const subscriberId = found.data?.data?.id;

  if (subscriberId) {
    const removed = await mailerlite(`/subscribers/${subscriberId}`, {
      method: "DELETE",
    });
    if (removed.status === 204 || removed.status === 200) {
      ok("Usunięto kontakt testowy z MailerLite");
    } else {
      fail(
        `NIE UDAŁO SIĘ usunąć z MailerLite (HTTP ${removed.status}) — skasuj ręcznie: ${email}`,
      );
    }
  }

  await prisma.waitlistSubscriber.delete({ where: { id: record.id } });
  ok("Usunięto kontakt testowy z naszej bazy");

  console.log(
    process.exitCode === 1
      ? "\n❌ Test zakończony błędami — patrz wyżej.\n"
      : "\n✅ Cała ścieżka działa: formularz → baza → MailerLite.\n",
  );
}

main()
  .catch((error) => {
    console.error("\n❌ Test przerwany:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
