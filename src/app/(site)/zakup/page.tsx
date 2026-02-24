import { CheckoutSection } from "@/components/site/checkout/CheckoutSection";
import { authOptions } from "@/lib/auth";
import { getServerSession, Session } from "next-auth";
import React from "react";

const page = async () => {
  const session: Session | null = await getServerSession(authOptions);
  return <CheckoutSection session={session} />;
};
export default page;
