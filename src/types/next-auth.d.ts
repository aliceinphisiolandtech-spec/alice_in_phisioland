import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      // TypeScript domyślnie wie, że 'image' tu jest dzięki DefaultSession["user"],
      // ale dla jasności możemy to zostawić.
    } & DefaultSession["user"];
  }

  // Interfejs User (to co przychodzi z bazy Prismy)
  interface User {
    role: string;
    image?: string | null; // <--- Dodajemy informację o zdjęciu
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    picture?: string | null; // <--- W tokenie JWT zdjęcie standardowo nazywa się 'picture'
  }
}
