import { PrismaClient } from "../src/generated/prisma/index.js";

// Inicjalizacja klienta Prisma
const prisma = new PrismaClient();
// ⬇️ TUTAJ WPISZ MAILE, KTÓRYM CHCESZ NADAĆ DOSTĘP I 100% POSTĘPU ⬇️
const EMAILS_TO_GRANT_ACCESS = ["biuro@kocikdev.com"];

const PRODUCT_ID = "ebook-tom-1";

// ⬇️ WAŻNE: WPISZ TUTAJ WSZYSTKIE SLUGI SWOICH ROZDZIAŁÓW ⬇️
// Użytkownik musi mieć wpis dla każdego z nich, żeby mieć 100%
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
      // 1. Znajdź użytkownika w bazie
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        console.log(
          `❌ POMINIĘTO: Użytkownik ${normalizedEmail} nie istnieje w bazie. (Musi najpierw założyć konto)`,
        );
        errorCount++;
        continue;
      }

      // 2. Sprawdź, czy ma już dostęp do e-booka
      const existingPurchase = await prisma.purchase.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId: PRODUCT_ID,
          },
        },
      });

      // Używamy transakcji, żeby na pewno dodać zakup ORAZ wszystkie postępy, albo nic
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
        // Robimy createMany ze skipDuplicates, więc jeśli już jakiś rozdział miał "przeczytany",
        // to go nie nadpisze błędem, tylko doda brakujące.
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

        // C. WYMUSZENIE POP-UPA Z KONFETTI PO PIERWSZYM LOGOWANIU
        await tx.user.update({
          where: { id: user.id },
          data: { isFirstLogin: true },
        });
      });

      if (existingPurchase) {
        console.log(
          `⚠️ OSTRZEŻENIE: ${normalizedEmail} już miał dostęp, zaktualizowano mu postęp na 100% i ustawiono flagę pierwszego logowania.`,
        );
        skippedCount++;
      } else {
        console.log(
          `✅ SUKCES: Nadano dostęp, 100% postępu i flagę pierwszego logowania dla ${normalizedEmail}`,
        );
        successCount++;
      }
    } catch (error) {
      console.error(`💥 BŁĄD podczas przetwarzania ${normalizedEmail}:`, error);
      errorCount++;
    }
  }

  console.log("\n--- PODSUMOWANIE ---");
  console.log(
    `Pomyślnie nadano nowe dostępy (z 100% postępem): ${successCount}`,
  );
  console.log(
    `Zaktualizowano sam postęp i flagę (mieli już dostęp): ${skippedCount}`,
  );
  console.log(`Błędy (brak konta itp.): ${errorCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
