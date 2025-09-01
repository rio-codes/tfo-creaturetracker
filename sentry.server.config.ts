// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: "https://3616158881e491a24b8bbb66d8dc3eb5@o4509935574712320.ingest.us.sentry.io/4509935575629829",

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,

    integrations: [
        // send console.log, console.warn, and console.error calls as logs to Sentry
        Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
    ],
    // Enable logs to be sent to Sentry
    enableLogs: true,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
});
