"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Samodzielne usunięcie konta przez kursantkę (panel → Profil).
 *
 * NIE jest to `prisma.user.delete()`, i to jest świadoma decyzja.
 *
 * `Order.user` ma w schemacie `onDelete: Cascade`, a `Order.userId` jest polem
 * wymaganym — skasowanie rekordu User zabrałoby ze sobą wszystkie zamówienia
 * razem z `invoiceNumber` i `fakturowniaId`. Zniknąłby więc ślad po fakturach,
 * które trzeba przechowywać przez okres wymagany przepisami prawa podatkowego
 * (patrz §6 polityki prywatności), a przychód w panelu cofnąłby się o zakupy
 * tej osoby.
 *
 * Dlatego kasujemy WSZYSTKO, co jest daną osobową powiązaną z kontem, a sam
 * rekord User zostaje jako pusta kotwica dla zamówień: bez imienia, bez
 * adresu e-mail, bez awatara. Z punktu widzenia osoby usuwającej konto efekt
 * jest ten sam — nie da się już zalogować, nie ma dostępu do materiałów,
 * a jej dane zniknęły.
 *
 * Adres e-mail zwalniamy do ponownego użycia (kolumna jest unikalna i
 * dopuszcza NULL), więc ta sama osoba może później założyć konto od zera —
 * będzie to jednak NOWE konto, bez dostępu do e-booka.
 */
export async function deleteMyAccountAction() {
  const session = await getServerSession(authOptions);

  // Identyfikator bierzemy WYŁĄCZNIE z sesji. Gdyby przychodził z formularza,
  // każda zalogowana osoba mogłaby skasować cudze konto, podmieniając go
  // w żądaniu.
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Musisz być zalogowana, żeby usunąć konto." };
  }

  // Administrator kasujący własne konto odciąłby sobie panel — a jeśli jest
  // jedynym administratorem, nie miałby jak go odzyskać z poziomu aplikacji.
  if (session.user.role === "admin") {
    return {
      error:
        "Konto administratora usuwa się z panelu administracyjnego, nie stąd.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return { error: "Nie znaleźliśmy tego konta." };
    }

    await prisma.$transaction([
      // Logowanie przez Google — bez tego wpisu konta nie da się otworzyć
      // ponownie tym samym kontem Google.
      prisma.account.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      // Dostęp do materiałów. Czytnik i panel sprawdzają wyłącznie istnienie
      // tego rekordu, więc jego usunięcie odbiera dostęp natychmiast.
      prisma.purchase.deleteMany({ where: { userId } }),
      prisma.userProgress.deleteMany({ where: { userId } }),
      prisma.review.deleteMany({ where: { userId } }),

      // Gdyby adres siedział na liście darmowych dostępów, samo założenie
      // konta od nowa nadałoby dostęp jeszcze raz — a osoba właśnie
      // zażądała usunięcia swoich danych.
      ...(user.email
        ? [prisma.whitelistedEmail.deleteMany({ where: { email: user.email } })]
        : []),

      prisma.user.update({
        where: { id: userId },
        data: {
          // Nazwa zastępcza zamiast pustki — w panelu admina zamówienie ma
          // dalej podpowiadać, dlaczego nie ma przy nim żadnych danych.
          // Kto realnie kupił, wynika ze snapshotu na samym zamówieniu
          // (billingName i reszta pól do faktury).
          name: "Konto usunięte",
          email: null,
          emailVerified: null,
          image: null,
          isFirstLogin: false,
        },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("[ACCOUNT_DELETE_ERROR]", error);
    return { error: "Nie udało się usunąć konta. Spróbuj ponownie za chwilę." };
  }
}
