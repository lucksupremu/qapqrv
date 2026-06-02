// Registro do Service Worker offline-first.
// Guarda contra iframe e domínios de preview do Lovable para não interferir no editor.

import { toast } from "sonner";

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Detecta iframe (preview do Lovable)
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovable.dev") ||
    host === "localhost" ||
    host === "127.0.0.1";

  // No preview/iframe: desregistra qualquer SW antigo para não servir conteúdo cacheado.
  if (inIframe || isPreviewHost) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Detecta atualização disponível
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Nova versão pronta — pede para o usuário recarregar
              toast("Nova versão disponível", {
                description: "Toque para atualizar o app.",
                duration: 10000,
                action: {
                  label: "Atualizar",
                  onClick: () => {
                    installing.postMessage({ type: "SKIP_WAITING" });
                  },
                },
              });
            }
          });
        });

        // Verifica updates periodicamente (a cada 30 min em uso)
        setInterval(() => {
          reg.update().catch(() => {});
        }, 30 * 60 * 1000);
      })
      .catch(() => {
        // SW opcional — silenciar
      });

    // Quando o novo SW assume o controle, recarrega uma vez
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}
