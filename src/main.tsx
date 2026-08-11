import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import "./styles.css";
import { getRouter } from "./router";
import { initTheme } from "./lib/theme";
import { registerAppServiceWorker } from "./lib/sw-register";
import { initPwaInstallManager } from "./lib/pwa-install-manager";

initTheme();
initPwaInstallManager();
registerAppServiceWorker();

const router = getRouter();
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento raiz do aplicativo Android não encontrado.");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
