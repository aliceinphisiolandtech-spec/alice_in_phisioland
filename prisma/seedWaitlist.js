import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

/**
 * Zakłada (lub aktualizuje) stronę zapisów na listę oczekujących.
 *
 * Uruchomienie:  npm run waitlist:seed
 *
 * Skrypt jest idempotentny — działa na `upsert` po slugu, więc można go puścić
 * ponownie po każdej zmianie treści poniżej. Zebrane adresy zostają nietknięte.
 *
 * Docelowo (Etap 2) to samo będzie się dało zrobić z panelu, bez wchodzenia
 * w kod. Ten skrypt jest sposobem na uruchomienie pierwszej kampanii teraz.
 */

// ⬇️ TUTAJ USTAWIASZ CAŁĄ KAMPANIĘ ⬇️
const CAMPAIGN = {
  // Końcówka adresu — link do wklejenia w post to: https://TWOJADOMENA.pl/zapisy/lato
  // Tylko małe litery, cyfry i myślniki.
  slug: "lato",

  // Nazwa robocza, widoczna tylko dla Ciebie.
  name: "Promocja letnia 2026 — lista oczekujących",

  // --- ID GRUPY W MAILERLITE ---
  // Grupa „waiting list" na koncie Alice in Physioland.
  // Inne ID odczytasz poleceniem:  npm run waitlist:groups
  // Wartość null = strona zbiera adresy wyłącznie do naszej bazy, a cron
  // dośle je do MailerLite, gdy grupa zostanie wskazana.
  mailerliteGroupId: "195340041351857622",

  // --- TREŚĆ STRONY ---
  headline: "Promocja letnia — bądź pierwsza w kolejce",
  // Fragment nagłówka do podkreślenia akcentem. Musi występować w `headline`.
  highlight: "Promocja letnia",
  description:
    "Szykuję wakacyjną ofertę na e-book i szkolenia. Liczba miejsc w tej cenie będzie ograniczona, dlatego najpierw informuję osoby z listy — i dopiero potem resztę świata.\n\nZostaw adres e-mail, a dostaniesz wiadomość w dniu startu, zanim promocja pójdzie publicznie.",

  ctaLabel: "Zapisz mnie na listę",
  footnote: "Bez spamu. Wypisujesz się jednym kliknięciem.",

  // Czy formularz pyta też o imię (pozwala pisać maile ze zwrotem po imieniu).
  collectName: false,

  // --- EKRAN PO ZAPISANIU ---
  successTitle: "Jesteś na liście!",
  successMessage:
    "Dam Ci znać mailem, gdy tylko promocja wystartuje — będziesz mieć dostęp przed wszystkimi.\n\nSprawdź proszę skrzynkę (czasem także folder Oferty lub Spam) i dodaj mój adres do kontaktów.",

  // --- ZGODA MARKETINGOWA ---
  // Kopia tej treści zapisuje się przy każdym kontakcie — RODO wymaga wykazania,
  // na co dokładnie zgodziła się dana osoba. Zmiana tekstu tutaj nie zmienia
  // zgód już zebranych, i o to chodzi.
  consentText:
    "Zgadzam się na otrzymywanie informacji handlowych na podany adres e-mail. Administratorem danych jest Alicja Wójcik (Alice in Physioland). Zgodę mogę wycofać w każdej chwili, klikając link w stopce wiadomości.",

  // --- OKNO ZAPISÓW ---
  isActive: true,
  // null = bez ograniczenia. Format: new Date("2026-08-31T23:59:59+02:00")
  opensAt: null,
  closesAt: null,
  closedMessage:
    "Zapisy na listę promocji letniej są już zamknięte — oferta ruszyła. Zajrzyj na stronę główną, żeby sprawdzić, co jest jeszcze dostępne.",
};
// ⬆️ KONIEC USTAWIEŃ ⬆️

async function main() {
  const { slug, ...data } = CAMPAIGN;

  const page = await prisma.waitlistPage.upsert({
    where: { slug },
    create: { slug, ...data },
    update: data,
  });

  const count = await prisma.waitlistSubscriber.count({
    where: { pageId: page.id },
  });

  console.log("\n✅ Strona zapisów gotowa.\n");
  console.log(`   Nazwa:        ${page.name}`);
  console.log(`   Adres:        /zapisy/${page.slug}`);
  console.log(
    `   Grupa ML:     ${page.mailerliteGroupId ?? "— (zapis tylko do naszej bazy)"}`,
  );
  console.log(`   Zapisy:       ${page.isActive ? "otwarte" : "zamknięte"}`);
  console.log(`   Zebrane maile: ${count}\n`);

  if (!page.mailerliteGroupId) {
    console.log(
      "ℹ️  Bez ID grupy adresy lądują wyłącznie w naszej bazie.\n" +
        "   Odczytaj grupy:  npm run waitlist:groups\n" +
        "   Potem wpisz ID w tym pliku i uruchom seed ponownie.\n",
    );
  }
}

main()
  .catch((error) => {
    console.error("\n❌ Nie udało się zapisać strony zapisów:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
