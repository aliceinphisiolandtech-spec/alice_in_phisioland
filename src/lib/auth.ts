// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifySessionUser } from "@/lib/session-user";

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Ilu osobnych klientów testowych udostępnia dev login.
 * Każdy to inne konto, więc każdy może przejść własny zakup — jeden użytkownik
 * kupi e-booka tylko raz (unikat userId+productId na tabeli Purchase).
 */
export const DEV_CLIENT_COUNT = 5;

/**
 * DEV-ONLY: szybkie logowanie "na klienta" / "na admina" bez OAuth.
 * Tworzy (lub odświeża) deterministycznych użytkowników w bazie z PRAWDZIWĄ rolą,
 * dzięki czemu cały realny pipeline ról (JWT -> session -> guardy /admin) jest
 * testowany tak samo jak na produkcji. Potrójnie zabezpieczone przed produkcją:
 * provider nie jest rejestrowany w prod, a authorize i tak zwraca null.
 */
const devProviders: NextAuthOptions["providers"] = IS_DEV
  ? [
      CredentialsProvider({
        id: "dev-login",
        name: "Dev Login",
        credentials: {
          role: { label: "Rola", type: "text" },
          slot: { label: "Numer klienta", type: "text" },
        },
        async authorize(credentials) {
          // Twardy bezpiecznik — nawet gdyby provider jakimś cudem trafił na prod.
          if (process.env.NODE_ENV === "production") return null;

          const requestedRole =
            credentials?.role === "admin" ? "admin" : "client";

          let email: string;
          let name: string;

          if (requestedRole === "admin") {
            email = "dev-admin@local.dev";
            name = "Dev Admin";
          } else {
            // Numer przycina się do dostępnego zakresu — z przeglądarki może
            // przyjść dowolna wartość, a nie chcemy zakładać kont "dev-klient-99".
            const parsed = Number(credentials?.slot);
            const slot =
              Number.isInteger(parsed) && parsed >= 1 && parsed <= DEV_CLIENT_COUNT
                ? parsed
                : 1;

            email = `dev-klient-${slot}@local.dev`;
            name = `Dev Klient ${slot}`;
          }

          // upsert => klik "Admin" zawsze daje realnego admina (rola zapisana w DB).
          const user = await prisma.user.upsert({
            where: { email },
            update: { role: requestedRole },
            create: { email, name, role: requestedRole },
          });

          return user;
        },
      }),
    ]
  : [];

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
    ...devProviders,
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
      // Moment logowania — `user` przychodzi prosto z adaptera, więc token
      // dopiero powstaje i nie ma czego weryfikować.
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        token.picture = user.image;
        return token;
      }

      // Każde kolejne żądanie. Token to wyłącznie odszyfrowane ciasteczko
      // z urządzenia użytkownika — sam z siebie nie wie nic o tym, czy konto
      // nadal istnieje. Bez tego sprawdzenia usunięty użytkownik zostawał
      // zalogowany do wygaśnięcia ciasteczka.
      if (!token.id) return token;

      const state = await verifySessionUser(token.id);

      if (state.status === "deleted") {
        // NextAuth traktuje `null` jako token nieważny: czyści ciasteczko sesji,
        // a getServerSession() zwraca null. Typy w v4 tego nie przewidują, choć
        // core to obsługuje (core/routes/session.ts) — stąd rzutowanie.
        return null as unknown as JWT;
      }

      if (state.status === "exists") {
        // Rola czytana z bazy, a nie zamrożona w tokenie przy logowaniu.
        // Zmiana uprawnień działa więc w ciągu minuty, bez ponownego logowania.
        token.role = state.role;
      }

      // status "unknown" = baza chwilowo nie odpowiada. Zostawiamy token bez
      // zmian, żeby awaria połączenia nie wylogowała wszystkich naraz.
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
