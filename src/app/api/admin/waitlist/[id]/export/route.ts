import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCsv, csvFilename } from "@/lib/csv";

/**
 * Pobranie listy zapisanych osób jako plik CSV.
 *
 * Trasa GET, a nie server action, bo przeglądarka ma ten plik ZAPISAĆ —
 * to zwykły link `<a download>`, bez JavaScriptu po stronie klienta.
 *
 * W eksporcie jest komplet danych wymaganych przy RODO (treść zgody, moment,
 * IP), a nie same adresy. Klientka jako administrator danych musi umieć
 * wykazać, na co konkretnie zgodziła się każda osoba — sam e-mail tego nie
 * dowodzi, a wyciągnięcie tego później z bazy wymagałoby programisty.
 *
 * Świadomie BEZ blokady zakresem (`isWaitlistBuilderEnabled`), w odróżnieniu
 * od tras kreatora. Powód jest prawny, nie handlowy: to jedyna droga do
 * wykazania zgód przy żądaniu z RODO, a termin na odpowiedź biegnie niezależnie
 * od tego, który etap projektu jest opłacony. Trasa wymaga roli administratora
 * i nie jest nigdzie linkowana w zakresie Etapu 1, więc niczego nie odsłania.
 */

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Europe/Warsaw",
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 403 });
  }

  const { id } = await params;

  const page = await prisma.waitlistPage.findUnique({
    where: { id },
    select: { slug: true, name: true },
  });

  if (!page) {
    return NextResponse.json(
      { error: "Nie znaleziono tej strony zapisów." },
      { status: 404 },
    );
  }

  const subscribers = await prisma.waitlistSubscriber.findMany({
    where: { pageId: id },
    orderBy: { createdAt: "asc" },
  });

  const csv = buildCsv(
    [
      "E-mail",
      "Imię",
      "Data zapisu",
      "Treść zgody",
      "Data zgody",
      "Adres IP",
      "Status w MailerLite",
    ],
    subscribers.map((subscriber) => [
      subscriber.email,
      subscriber.name,
      dateFormatter.format(subscriber.createdAt),
      subscriber.consentText,
      dateFormatter.format(subscriber.consentAt),
      subscriber.ipAddress,
      describeSyncStatus(subscriber.syncStatus),
    ]),
  );

  const filename = csvFilename(["zapisy", page.slug]);

  return new NextResponse(csv, {
    headers: {
      // charset=utf-8 razem z BOM-em z `buildCsv` — dopiero oba naraz sprawiają,
      // że polskie znaki otwierają się poprawnie i w Excelu, i w Arkuszach Google.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Lista rośnie z minuty na minutę — pobranie ma zawsze dać stan na teraz.
      "Cache-Control": "no-store",
    },
  });
}

/** Techniczny status na słowa, które coś znaczą dla osoby czytającej plik. */
function describeSyncStatus(status: string): string {
  switch (status) {
    case "synced":
      return "Przekazany";
    case "pending":
      return "Czeka na przekazanie";
    case "failed":
      return "Błąd przekazania";
    case "skipped":
      return "Tylko w bazie strony";
    default:
      return status;
  }
}
