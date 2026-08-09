import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Strefy prywatne / transakcyjne / techniczne — poza indeksem.
        disallow: [
          "/admin",
          "/panel-kursanta",
          "/logowanie",
          "/zakup",
          "/api/",
          // Strony kampanijne (lista oczekujących) są tymczasowe — zaindeksowana
          // zamknięta promocja to martwy wynik konkurujący ze stroną główną.
          // Link z posta działa niezależnie od tego wpisu.
          "/zapisy",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
