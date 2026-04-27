// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

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
      if (!user.email) return;

      const emailToSearch = user.email.toLowerCase().trim();

      try {
        // 1. Sprawdzamy, czy mail znajduje się w naszej nowej tabeli w bazie
        const isWhitelisted = await prisma.whitelistedEmail.findUnique({
          where: { email: emailToSearch },
        });

        if (isWhitelisted) {
          // 2. Jeśli jest na liście, wykonujemy transakcję (wszystko albo nic!)
          await prisma.$transaction(async (tx) => {
            // a. Nadaj dostęp do e-booka
            await tx.purchase.create({
              data: {
                userId: user.id,
                productId: "ebook-tom-1",
              },
            });

            // b. Ustaw 100% postępu
            const progressData = CHAPTER_SLUGS.map((slug) => ({
              userId: user.id,
              chapterId: slug,
            }));

            await tx.userProgress.createMany({
              data: progressData,
              skipDuplicates: true,
            });

            // c. Ustaw flagę pierwszego logowania na true (żeby dostał konfetti)
            await tx.user.update({
              where: { id: user.id },
              data: { isFirstLogin: true },
            });

            // d. NOWOŚĆ: Usuń maila z listy (baza sama się czyści z każdym logowaniem)
            await tx.whitelistedEmail.delete({
              where: { email: emailToSearch },
            });
          });

          console.log(
            `[WHITELIST] ✅ Automatycznie nadano pełen dostęp i usunięto z bazy: ${user.email}`,
          );
        }
      } catch (error) {
        console.error(
          `[WHITELIST ERROR] 💥 Błąd podczas nadawania uprawnień dla ${user.email}:`,
          error,
        );
      }
    },
  },

  callbacks: {
    // 1. Sprawdza i aktualizuje zdjęcie przy każdym logowaniu
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const freshGooglePicture = (profile as any).picture;

        if (freshGooglePicture && user.image !== freshGooglePicture) {
          try {
            await prisma.user.update({
              where: { email: user.email! },
              data: { image: freshGooglePicture },
            });
            user.image = freshGooglePicture;

            console.log(`🔄 Zaktualizowano avatar dla ${user.email}`);
          } catch (error) {
            console.error("Błąd podczas aktualizacji avatara z Google:", error);
          }
        }
      }
      return true;
    },

    // 2. JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        token.picture = user.image;
      }
      return token;
    },

    // 3. Session
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
