import "../styles/tailwind.css";

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { I18n } from "../shared/providers/i18n";
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("admin-root")!).render(
  <React.StrictMode>
    <I18n>
      <App />
    </I18n>
  </React.StrictMode>
);
