// Registra o /sw.js no escopo "/" em produção web.
// Necessário para que Chrome/Edge/Brave disparem `beforeinstallprompt`
// e habilitem a instalação nativa com 1 toque.
//
// Não registra em: dev, preview do Lovable, iframe, APK Capacitor, ou ?sw=off.
// Nesses ambientes, desregistra SWs antigos por segurança.

import { isNativeApp } from "@/lib/in-app-browser";

function isLovablePreviewHost(host: string): boolean {
  return (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  );
}

async function unregisterIfAny(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (reg) await reg.unregister();
  } catch {
    /* ignore */
  }
}

export function registerAppServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const inIframe = (() => {
    try {
      return window.top !== window.self;
    } catch {
      return true;
    }
  })();
  const host = window.location.hostname;
  const swOff = new URLSearchParams(window.location.search).get("sw") === "off";

  const blocked =
    !import.meta.env.PROD ||
    inIframe ||
    isLovablePreviewHost(host) ||
    swOff ||
    isNativeApp();

  if (blocked) {
    void unregisterIfAny();
    return;
  }

  const run = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((e) => console.warn("[sw] register failed", e));
  };

  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void })
      .requestIdleCallback(run);
  } else {
    setTimeout(run, 0);
  }
}
