// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentry-scrub";

// Patrz komentarz w src/instrumentation-client.ts — poza produkcją nie startujemy.
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://ef97eca8d3790bbf145066e436c7ef95@o4510039353262080.ingest.de.sentry.io/4511106057699408",

    // Te same ustawienia co na serwerze — uzasadnienie w sentry.server.config.ts.
    tracesSampleRate: 0.1,

    enableLogs: true,

    sendDefaultPii: false,

    beforeSend: (event) => scrubEvent(event),
  });
}
