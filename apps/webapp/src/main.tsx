import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as Sentry from "@sentry/capacitor";
import * as SentryReact from "@sentry/react";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silent fail - PWA features just won't work
    });
  });
}

if(sentryDsn) {
  Sentry.init(
    {
      dsn: sentryDsn,
      // Adds request headers and IP for users, for more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/capacitor/configuration/options/#sendDefaultPii
      sendDefaultPii: true,
      // Set your release version, such as "getsentry@1.0.0"
      release: "worldinmovies@0.0.1",
      // Set your dist version, such as "1"
      dist: "1",
      // Logs requires @sentry/capacitor 2.0.0 or newer.
      _experiments: {
        enableLogs: true,
        beforeSendLog: (log) => {
          // Add custom filters to logs.
          return log;
        },
      },
      integrations: [
      ],
    },
    // Forward the init method from @sentry/react
    SentryReact.init,
  );
}

createRoot(document.getElementById("root")!).render(<App />);
