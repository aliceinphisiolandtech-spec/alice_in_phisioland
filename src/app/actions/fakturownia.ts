// src/lib/fakturownia.ts

import { Order } from "@/generated/prisma";

const API_TOKEN = process.env.FAKTUROWNIA_API_TOKEN;
const DOMAIN = process.env.FAKTUROWNIA_DOMAIN; // np. "twojaklientka.fakturownia.pl" (bez https)

export async function createFakturowniaInvoice(
  order: Order,
  productName: string,
) {
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
      // ZAMIAST department_id, wpisz to ręcznie:
      seller_name: "Moja Firma Testowa", // Cokolwiek
      seller_tax_no: "5252445767", // Przykładowy poprawny NIP (Fakturownia waliduje sumy kontrolne)
      seller_street: "Ulica Testowa 1/2",
      seller_post_code: "00-001",
      seller_city: "Warszawa",

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
