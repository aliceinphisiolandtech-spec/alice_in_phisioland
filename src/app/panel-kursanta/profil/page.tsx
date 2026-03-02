import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Upewnij się co do ścieżki
import { redirect } from "next/navigation";
import AccountClient from "@/components/panel-kursanta/account/AccountClient";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/logowanie");
  }

  // Przekazujemy tylko niezbędne dane
  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return <AccountClient user={user} />;
}
