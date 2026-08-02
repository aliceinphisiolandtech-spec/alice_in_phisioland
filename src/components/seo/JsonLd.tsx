import React from "react";

/**
 * Wstrzykuje dane strukturalne schema.org (JSON-LD) jako <script>.
 * Używaj w server componentach stron, przekazując obiekt(y) z buildera z @/lib/seo.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = Array.isArray(data) ? data : [data];
  return (
    <>
      {json.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Dane pochodzą z naszych buildterów (nie od użytkownika) — bezpieczne.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
