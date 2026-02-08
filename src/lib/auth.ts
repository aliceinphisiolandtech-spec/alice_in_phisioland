// src/lib/auth.ts

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/logowanie", // Upewnij się, że ścieżka do Twojej strony logowania jest poprawna (wcześniej używaliśmy /login)
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // AppleProvider został usunięty
  ],
  callbacks: {
    // 1. Zapisujemy rolę do tokenu (JWT)
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        // NextAuth zazwyczaj automatycznie mapuje 'image' z usera na 'token.picture',
        // ale dla pewności możemy to przypisać ręcznie, jeśli user pochodzi z bazy.
        token.picture = user.image;
      }
      return token;
    },
    // 2. Przekazujemy rolę z tokenu do sesji (Client)
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        // Przypisujemy zdjęcie z tokena do sesji
        session.user.image = token.picture;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
