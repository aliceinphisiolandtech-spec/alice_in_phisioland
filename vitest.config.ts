import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Testy jednostkowe czystej domeny — silnik cenowy, reguły rabatów, konwersje dat.
 *
 * Świadomie NIE testujemy tu warstwy serwerowej (Prisma, sesja, Stripe): moduły
 * w `src/lib` są rozdzielone tak, że cała logika decydująca o kwocie do zapłaty
 * jest wolna od importów serwerowych i da się ją sprawdzić bez bazy.
 *
 * Alias `@` musi odpowiadać `paths` z tsconfig.json — inaczej importy w testach
 * rozjechałyby się z tymi w aplikacji.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
