// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentry-scrub";

// Sentry startuje wyłącznie na produkcji. W dev tylko zaśmieca konsolę, spowalnia
// nawigację i wysyła zdarzenia z localhosta do produkcyjnego projektu — przez co
// realne błędy klientek toną w szumie z pracy nad kodem.
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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
