import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Walidacja maila
const newsletterSchema = z.object({
  email: z.string().email("Niepoprawny format adresu e-mail"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ZMIANA 1: Używamy safeParse zamiast parse
    const result = newsletterSchema.safeParse(body);

    // ZMIANA 2: Sprawdzamy, czy walidacja się NIE powiodła
    // ZMIANA 2: Sprawdzamy, czy walidacja się NIE powiodła
    if (!result.success) {
      // Używamy .issues zamiast .errors
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 },
      );
    }

    // ZMIANA 3: Jeśli wszystko ok, wyciągamy e-mail
    const { email } = result.data;

    // Sprawdzenie czy mail już istnieje
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      return NextResponse.json(
        { message: "Ten adres jest już zapisany na newsletter!" },
        { status: 400 },
      );
    }

    // Zapis do bazy
    await prisma.newsletterSubscriber.create({
      data: { email },
    });

    return NextResponse.json(
      { message: "Dziękujemy za zapisanie się do newslettera!" },
      { status: 201 },
    );
  } catch (error) {
    // Blok catch łapie już tylko "grube" błędy (np. awaria bazy danych)
    console.error("Błąd zapisu do newslettera:", error);
    return NextResponse.json(
      { message: "Wystąpił błąd podczas zapisu. Spróbuj ponownie później." },
      { status: 500 },
    );
  }
}
