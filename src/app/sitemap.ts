import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Publiczne, indeksowalne strony. Strony za logowaniem (panel, admin, zakup)
  // celowo pomijamy — są wykluczone także w robots.ts.
  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/strefa-pacjenta", priority: 0.9, changeFrequency: "monthly" },
    { path: "/regulamin", priority: 0.3, changeFrequency: "yearly" },
    { path: "/regulamin-zakupow", priority: 0.3, changeFrequency: "yearly" },
    {
      path: "/polityka-prywatnosci",
      priority: 0.3,
      changeFrequency: "yearly",
    },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
