// Abre links externos em um navegador interno.
// - No app nativo (Capacitor): usa @capacitor/inappbrowser
// - No web (navegador comum): abre nova aba

import { Capacitor } from "@capacitor/core";

export type AbrirOpts = {
  titulo?: string;
};

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function isNative() {
  return isNativeApp();
}

export async function openInAppBrowser(url: string, opts: AbrirOpts = {}) {
  void opts.titulo; // reservado para futura customização da toolbar

  if (await isNative()) {
    try {
      const mod = await import("@capacitor/inappbrowser");
      // @ts-expect-error tipos do pacote variam por versão
      const InAppBrowser = mod.InAppBrowser ?? mod.default;

      await InAppBrowser.openInWebView({
        url,
        options: {
          ...mod.DefaultWebViewOptions,
          showURL: true,
          showNavigationButtons: true,
          closeButtonText: "Fechar",
        },
      });
      return;
    } catch (e) {
      console.warn("InAppBrowser indisponível, fallback web", e);
    }
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
