/**
 * Wypisuje grupy dostępne na koncie MailerLite wraz z ich ID.
 *
 * Uruchomienie:  npm run waitlist:groups
 *
 * Po co: żeby wskazać w `prisma/seedWaitlist.js`, do której grupy mają trafiać
 * zapisy — MailerLite nie pokazuje ID grupy nigdzie w interfejsie.
 *
 * Skrypt celowo nie importuje `src/lib/mailerlite.ts`: to plik TypeScriptowy
 * z aliasami ścieżek, a ten skrypt ma się uruchamiać czystym `node`, bez
 * budowania projektu. Powiela więc jedno zapytanie GET i tyle.
 */

const API_URL = "https://connect.mailerlite.com/api/groups?limit=100";

async function main() {
  const apiKey = process.env.MAILERLITE_API_KEY?.trim();

  if (!apiKey) {
    console.error(
      "\n❌ Brak MAILERLITE_API_KEY.\n" +
        "   Dodaj klucz do pliku .env w katalogu projektu:\n" +
        '   MAILERLITE_API_KEY="..."\n\n' +
        "   Klucz wygenerujesz w MailerLite: Integrations → API → Generate new token.\n",
    );
    process.exit(1);
  }

  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(
      `\n❌ MailerLite odpowiedział błędem ${response.status}.\n   ${detail}\n`,
    );
    if (response.status === 401 || response.status === 403) {
      console.error("   Najczęstsza przyczyna: nieprawidłowy klucz API.\n");
    }
    process.exit(1);
  }

  const { data = [] } = await response.json();

  if (data.length === 0) {
    console.log(
      "\nℹ️  Na koncie nie ma jeszcze żadnej grupy.\n" +
        "   Załóż ją w MailerLite (Subscribers → Groups → Create group)\n" +
        "   i uruchom to polecenie ponownie.\n",
    );
    return;
  }

  console.log("\n📋 Grupy na koncie MailerLite:\n");

  for (const group of data) {
    console.log(`   ID: ${group.id}`);
    console.log(`   Nazwa: ${group.name}`);
    console.log(`   Aktywnych kontaktów: ${group.active_count ?? 0}\n`);
  }

  console.log(
    "Skopiuj wybrane ID do pola `mailerliteGroupId` w prisma/seedWaitlist.js,\n" +
      "a potem uruchom: npm run waitlist:seed\n",
  );
}

main().catch((error) => {
  console.error("\n❌ Nie udało się pobrać grup:", error);
  process.exit(1);
});
