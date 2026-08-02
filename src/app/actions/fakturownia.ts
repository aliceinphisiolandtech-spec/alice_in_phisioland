// src/lib/fakturownia.ts

// `Order` to wyłącznie typ — import wartościowy zostawał w wynikowym module
// i wywracał się poza webpackiem (Prisma nie eksportuje takiego runtime'u).
import type { Order } from "@/generated/prisma";

const API_TOKEN = process.env.FAKTUROWNIA_API_TOKEN;
const DOMAIN = process.env.FAKTUROWNIA_DOMAIN; // np. "twojaklientka.fakturownia.pl" (bez https)

const IS_DEV = process.env.NODE_ENV !== "production";
/** Awaryjne wymuszenie realnego wystawienia faktury poza produkcją. */
const FORCE_IN_DEV = process.env.FAKTUROWNIA_FORCE === "true";

export async function createFakturowniaInvoice(
  order: Order,
  productName: string,
) {
  // Bezpiecznik na dev: testowy zakup z NIP-em wystawiłby PRAWDZIWĄ fakturę
  // w Fakturowni, której nie da się po prostu cofnąć. Blokada siedzi tutaj,
  // a nie w webhooku, żeby chroniła też każde przyszłe wywołanie.
  if (IS_DEV && !FORCE_IN_DEV) {
    console.warn(
      `🧾 [DEV] Pomijam wystawienie faktury w Fakturowni dla zamówienia ${order.id}` +
        ` (NIP: ${order.billingNip ?? "brak"}, kwota: ${order.amount} gr).` +
        ` Ustaw FAKTUROWNIA_FORCE=true w .env, żeby wystawić ją mimo wszystko.`,
    );

    return { id: null, number: null };
  }

  if (!API_TOKEN || !DOMAIN) {
    throw new Error("Brak konfiguracji Fakturowni w .env");
  }

  // Konwersja groszy na PLN
  const price = order.amount / 100;

  // Przygotowanie payloadu
  const payload = {
    api_token: API_TOKEN,
    invoice: {
      kind: "vat",
      number: null,
      sell_date: new Date().toISOString().split("T")[0],
      issue_date: new Date().toISOString().split("T")[0],
      payment_to: new Date().toISOString().split("T")[0],
      payment_type: "transfer", // lub "card" - zależy jak księgowa woli
      status: "paid", // Od razu oznaczamy jako opłaconą

      // DANE NABYWCY
      buyer_name: order.billingName,
      buyer_tax_no: order.billingNip || null, // Ważne dla KSeF!
      buyer_post_code: order.billingPostalCode,
      buyer_city: order.billingCity,
      buyer_street: order.billingAddress,
      buyer_country: "PL",
      buyer_email: "", // Opcjonalnie: email usera, jeśli chcesz by Fakturownia wysłała fakturę sama

      // POZYCJE NA FAKTURZE
      positions: [
        {
          name: productName,
          tax: "zw", // Stawka VAT (dostosuj do produktu)
          total_price_gross: price,
          quantity: 1,
        },
      ],

      // Opcjonalnie: automatyczna wysyłka do KSeF (zależy od ustawień konta w Fakturowni)
      // W większości przypadków wystarczy, że faktura trafi do systemu, a KSeF leci automatem.
    },
  };

  const response = await fetch(`https://${DOMAIN}/invoices.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Fakturownia Error:", errorText);
    throw new Error(`Błąd Fakturowni: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    id: data.id, // ID (np. 123456)
    number: data.number, // Numer (np. 15/2024)
  };
}
