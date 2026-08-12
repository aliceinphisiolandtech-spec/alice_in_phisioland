// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentry-scrub";

// Patrz komentarz w src/instrumentation-client.ts — poza produkcją nie startujemy.
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://ef97eca8d3790bbf145066e436c7ef95@o4510039353262080.ingest.de.sentry.io/4511106057699408",

    // 10% śladów zamiast wszystkich. Pełne próbkowanie przy tym ruchu nie daje
    // lepszej diagnostyki, a wysyła do dostawcy komplet ścieżek każdej sesji.
    tracesSampleRate: 0.1,

    enableLogs: true,

    // Bez adresu IP, ciasteczek i tożsamości zgłaszającego. Do naprawienia
    // błędu potrzebny jest ślad stosu, a nie dane osoby, która go trafiła.
    sendDefaultPii: false,

    // Druga warstwa: treść żądania nie wychodzi nawet wtedy, gdy SDK dołączy
    // ją mimo powyższego. Szczegóły w lib/sentry-scrub.
    beforeSend: (event) => scrubEvent(event),
  });
}
