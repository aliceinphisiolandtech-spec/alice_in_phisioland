import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoginPage } from "@/components/auth/LoginPage";
import { AuthPageData } from "@/lib/types/landing";

// Funkcja pomocnicza do pobierania danych z CMS (taka jak była wcześniej)
async function getAuthData(): Promise<AuthPageData> {
  const section = await prisma.section.findUnique({
    where: { key: "authPage" },
  });

  const defaultData: AuthPageData = {
    heroHeadline: "Witaj w Świecie",
    heroHighlight: "Rzetelnej Fizjoterapii",
    heroDescription: "Zaloguj się, aby uzyskać dostęp do swoich kursów.",
    badgeText: "Dołącz do nas!",
  };

  return (section?.content as unknown as AuthPageData) || defaultData;
}

export default async function LogowaniePage() {
  // 1. POBIERZ SESJĘ
  const session = await getServerSession(authOptions);

  // 2. SPRAWDŹ CZY UŻYTKOWNIK JEST ZALOGOWANY
  if (session) {
    if (session.user.role === "admin") {
      redirect("/admin");
    } else {
      // ZMIANA: Zamiast do nieistniejącego dashboardu, wracamy na główną
      redirect("/?coming-soon=true");
    }
  }

  // 3. JEŚLI NIE ZALOGOWANY -> POBIERZ DANE I POKAŻ FORMULARZ
  const data = await getAuthData();

  return <LoginPage data={data} />;
}
