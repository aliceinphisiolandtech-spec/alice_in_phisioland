import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format"); // "pdf" lub "xml"

  // 1. Sprawdzenie sesji (Security)
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Znalezienie faktury użytkownika
  // Pobieramy ostatnie opłacone zamówienie, które ma nadane ID z Fakturowni
  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: "succeeded",
      fakturowniaId: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!order || !order.fakturowniaId) {
    return new NextResponse("Nie znaleziono faktury dla tego użytkownika.", {
      status: 404,
    });
  }

  // 3. Konfiguracja Fakturowni
  const API_TOKEN = process.env.FAKTUROWNIA_API_TOKEN;
  const DOMAIN = process.env.FAKTUROWNIA_DOMAIN;

  if (!API_TOKEN || !DOMAIN) {
    return new NextResponse("Błąd konfiguracji serwera (Fakturownia)", {
      status: 500,
    });
  }

  // Fakturownia obsługuje formaty przez rozszerzenie: .pdf lub .xml
  const extension = format === "xml" ? "xml" : "pdf";

  // URL do API Fakturowni
  const fakturowniaUrl = `https://${DOMAIN}/invoices/${order.fakturowniaId}.${extension}?api_token=${API_TOKEN}`;

  try {
    // 4. Pobieranie pliku z Fakturowni (Server-to-Server)
    const externalRes = await fetch(fakturowniaUrl);

    if (!externalRes.ok) {
      console.error("Błąd pobierania z Fakturowni:", externalRes.statusText);
      return new NextResponse("Błąd zewnętrznego serwera faktur.", {
        status: 502,
      });
    }

    // 5. Przekazanie pliku do Frontendu
    const fileBuffer = await externalRes.arrayBuffer();
    const contentType =
      format === "xml" ? "application/xml" : "application/pdf";
    const fileName = `Faktura_${order.invoiceNumber?.replace(/\//g, "-")}.${extension}`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Critical error downloading invoice:", error);
    return new NextResponse("Wystąpił błąd serwera.", { status: 500 });
  }
}
