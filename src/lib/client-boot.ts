// Inicialização que só faz sentido no navegador (tema, service worker, PWA).
// Antes vivia em src/main.tsx; com SSR o entry do cliente é gerado pelo
// TanStack Start, então chamamos isso de dentro do root em um useEffect.
import { initTheme } from "./theme";
import { registerAppServiceWorker } from "./sw-register";
import { initPwaInstallManager } from "./pwa-install-manager";

let booted = false;

export function bootClient() {
  if (typeof window === "undefined" || booted) return;
  booted = true;
  try {
    initTheme();
    initPwaInstallManager();
    registerAppServiceWorker();
  } catch (e) {
    console.warn("[client-boot] falhou", e);
  }
}
