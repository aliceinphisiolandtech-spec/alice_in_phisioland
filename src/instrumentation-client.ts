// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Sentry startuje wyłącznie na produkcji. W dev tylko zaśmieca konsolę, spowalnia
// nawigację i wysyła zdarzenia z localhosta do produkcyjnego projektu — przez co
// realne błędy klientek toną w szumie z pracy nad kodem.
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://ef97eca8d3790bbf145066e436c7ef95@o4510039353262080.ingest.de.sentry.io/4511106057699408",

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,
    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
