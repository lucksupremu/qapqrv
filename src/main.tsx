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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
