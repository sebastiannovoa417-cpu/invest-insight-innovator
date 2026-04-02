import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

Sentry.init({
  dsn: "https://0b448fad27fdb3bdfeb5c0e2677521fa@o4511147599462400.ingest.us.sentry.io/4511147608047616",
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0.1,
});

createRoot(document.getElementById("root")!).render(<App />);
