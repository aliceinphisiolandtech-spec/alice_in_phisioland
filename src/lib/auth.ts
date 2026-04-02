// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

// --- KONFIGURACJA WHITE-LISTY ---
const WHITELISTED_EMAILS = [
  "dstolarczyk6231@gmail.com",
  "highland.therapist@gmail.com",
  "e.kulmaczewska@gmail.com",
  "orlowska.katarzynaaa@gmail.com",
  "jangryczka21@gmail.com",
  "biuro@kocikdev.com",
  "piotr.eher@gmail.com",
].map((email) => email.toLowerCase().trim());

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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/logowanie",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // --- ZDARZENIA NEXT-AUTH ---
  events: {
    // To odpala się TYLKO RAZ, gdy w bazie powstaje nowy użytkownik
    async createUser({ user }) {
      if (user.email && WHITELISTED_EMAILS.includes(user.email.toLowerCase())) {
        try {
          await prisma.$transaction(async (tx) => {
            // 1. Nadaj dostęp do e-booka
            await tx.purchase.create({
              data: {
                userId: user.id,
                productId: "ebook-tom-1",
              },
            });

            // 2. Ustaw 100% postępu
            const progressData = CHAPTER_SLUGS.map((slug) => ({
              userId: user.id,
              chapterId: slug,
            }));

            await tx.userProgress.createMany({
              data: progressData,
              skipDuplicates: true,
            });

            // 3. Ustaw flagę pierwszego logowania na true (żeby dostał konfetti)
            await tx.user.update({
              where: { id: user.id },
              data: { isFirstLogin: true },
            });
          });

          console.log(
            `[WHITELIST] ✅ Automatycznie nadano pełen dostęp dla: ${user.email}`,
          );
        } catch (error) {
          console.error(
            `[WHITELIST ERROR] 💥 Błąd podczas nadawania uprawnień dla ${user.email}:`,
            error,
          );
        }
      }
    },
  },
  // ... reszta pliku na górze (importy, whitelist, events) pozostaje bez zmian

  callbacks: {
    // 1. NOWY CALLBACK: Sprawdza i aktualizuje zdjęcie przy każdym logowaniu
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        // Pobieramy najświeższe zdjęcie prosto z profilu Google
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const freshGooglePicture = (profile as any).picture;

        // Jeśli Google zwróciło zdjęcie, a w naszej bazie jest inne (lub puste)
        if (freshGooglePicture && user.image !== freshGooglePicture) {
          try {
            await prisma.user.update({
              where: { email: user.email! }, // Aktualizujemy po mailu
              data: { image: freshGooglePicture },
            });
            // Ważne: aktualizujemy też obiekt w pamięci, żeby funkcja 'jwt'
            // (która odpala się ułamek sekundy później) dostała już nowy link
            user.image = freshGooglePicture;

            console.log(`🔄 Zaktualizowano avatar dla ${user.email}`);
          } catch (error) {
            console.error("Błąd podczas aktualizacji avatara z Google:", error);
          }
        }
      }
      return true; // Zawsze zwracamy true, żeby pozwolić na zalogowanie
    },

    // 2. Twój dotychczasowy callback JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        token.picture = user.image; // Tutaj trafi już zaktualizowane zdjęcie!
      }
      return token;
    },

    // 3. Twój dotychczasowy callback Session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.picture as string | null | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
