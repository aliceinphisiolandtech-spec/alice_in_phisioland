import { PrismaClient } from "../src/generated/prisma/index.js";

// Inicjalizacja klienta Prisma
const prisma = new PrismaClient();
// ⬇️ TUTAJ WPISZ MAILE, KTÓRYM CHCESZ NADAĆ DOSTĘP I 100% POSTĘPU ⬇️
const EMAILS_TO_GRANT_ACCESS = [
  "biuro@kocikdev.com",
  // dodaj kolejne maile...
];

const PRODUCT_ID = "ebook-tom-1";

// ⬇️ WAŻNE: WPISZ TUTAJ WSZYSTKIE SLUGI SWOICH ROZDZIAŁÓW ⬇️
const CHAPTER_SLUGS = [
  "00-start",
  "01-wstep-diagnostyka",
  "02-gojenie-tkanek",
  "03-bol",
  "04-centralne",
  "05-fenotypowanie",
  "06-czerwone-flagi",
  "07-dekalog-diagnostyczny",
  "08-testy-kliniczne-wedlug-EBM",
  "09-diagnostyka-roznicowa-jako-fundament-wspolczesnej-praktyki-fizjoterapeutycznej",
  "10-biografia",
];

async function main() {
  console.log(
    "Rozpoczynam nadawanie dostępów, postępu i flagi pierwszego logowania...\n",
  );

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const email of EMAILS_TO_GRANT_ACCESS) {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // 1. ZNAJDŹ LUB STWÓRZ UŻYTKOWNIKA (Upsert)
      // Jeśli użytkownik z tym emailem nie istnieje, zostanie automatycznie utworzony!
      // Ustawiamy od razu flagę isFirstLogin na true przy tworzeniu.
      const user = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {}, // Nic nie aktualizujemy w profilu usera jeśli już istnieje (flagę zmienimy w transakcji niżej)
        create: {
          email: normalizedEmail,
          isFirstLogin: true, // Nowe konto z definicji ma true
        },
      });

      // 2. Sprawdź, czy ma już dostęp do e-booka (żeby nie duplikować logów)
      const existingPurchase = await prisma.purchase.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId: PRODUCT_ID,
          },
        },
      });

      // 3. Używamy transakcji, żeby na pewno dodać zakup ORAZ wszystkie postępy
      await prisma.$transaction(async (tx) => {
        // A. Dodaj zakup (tylko jeśli go jeszcze nie ma)
        if (!existingPurchase) {
          await tx.purchase.create({
            data: {
              userId: user.id,
              productId: PRODUCT_ID,
            },
          });
        }

        // B. Ustaw postęp na 100% (dodaj wpisy dla każdego rozdziału)
        if (CHAPTER_SLUGS.length > 0) {
          const progressData = CHAPTER_SLUGS.map((slug) => ({
            userId: user.id,
            chapterId: slug,
          }));

          await tx.userProgress.createMany({
            data: progressData,
            skipDuplicates: true, // Zabezpieczenie przed błędem "unikalnego klucza"
          });
        }

        // C. WYMUSZENIE POP-UPA Z KONFETTI PO PIERWSZYM LOGOWANIU (dla pewności, nawet jeśli konto istniało)
        await tx.user.update({
          where: { id: user.id },
          data: { isFirstLogin: true },
        });
      });

      if (existingPurchase) {
        console.log(
          `⚠️ OSTRZEŻENIE: ${normalizedEmail} (konto istniało, zakup już był). Zaktualizowano postęp na 100% i ustawiono flagę powitania.`,
        );
        skippedCount++;
      } else {
        console.log(
          `✅ SUKCES: Nadano dostęp, 100% postępu i przygotowano powitanie dla ${normalizedEmail}`,
        );
        successCount++;
      }
    } catch (error) {
      console.error(`💥 BŁĄD podczas przetwarzania ${normalizedEmail}:`, error);
      errorCount++;
    }
  }

  console.log("\n--- PODSUMOWANIE ---");
  console.log(`Pomyślnie przetworzono nowe dostępy: ${successCount}`);
  console.log(
    `Zaktualizowano istniejące (tylko postęp/flaga): ${skippedCount}`,
  );
  console.log(`Błędy: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
