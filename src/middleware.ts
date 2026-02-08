import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // Ta funkcja wykonuje się TYLKO, gdy 'authorized' zwróci true
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // 1. Sprawdź czy użytkownik jest w ogóle zalogowany (czy ma token)
        // 2. Sprawdź czy ma rolę "admin"
        return !!token && token.role === "admin";
      },
    },
    // Opcjonalnie: Gdzie przekierować, jeśli brak uprawnień (domyślnie leci na signin)
    pages: {
      signIn: "/logowanie",
    },
  },
);

// Tutaj definiujemy, które ścieżki mają być chronione
export const config = {
  matcher: ["/admin/:path*"],
};
