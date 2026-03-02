// proxy.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;

        // --- STREFA 1: ADMINISTRATOR ---
        if (pathname.startsWith("/admin")) {
          // Wstęp tylko dla roli 'admin'
          return token?.role === "admin";
        }

        // --- STREFA 2: KURSANT ---
        // if (pathname.startsWith("/panel-kursanta")) {
        //   // Wstęp tylko dla roli 'client' (kursanta).
        //   // Admin otrzyma tu 'false' i zostanie wyrzucony do logowania.
        //   return token?.role === "client";
        // }

        // Domyślnie pozwalamy (ale matcher filtruje resztę)
        return true;
      },
    },
    pages: {
      signIn: "/logowanie",
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/panel-kursanta/:path*"],
};
