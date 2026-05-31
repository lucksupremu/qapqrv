// Abre links externos em um navegador interno.
// - No app nativo (Capacitor): usa @capacitor/inappbrowser
// - No web (navegador comum): abre nova aba
//
// Importes do Capacitor são DINÂMICOS para evitar quebrar o SSR — o
// pacote toca `window`/`navigator` no carregamento.

export type AbrirOpts = {
  titulo?: string;
};

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // require síncrono não funciona em ESM; usamos a global que o Capacitor
    // injeta no runtime nativo. Em web, retorna false.
    // @ts-ignore
    const cap = (window as any).Capacitor;
    return !!cap?.isNativePlatform?.();
  } catch {
    return false;
  }
}

export async function openInAppBrowser(url: string, opts: AbrirOpts = {}) {
  void opts.titulo; // reservado para futura customização da toolbar

  if (isNativeApp()) {
    try {
      const mod = await import("@capacitor/inappbrowser");
      // @ts-expect-error tipos do pacote variam por versão
      const InAppBrowser = mod.InAppBrowser ?? mod.default;

      await InAppBrowser.openInWebView({
        url,
        options: {
          // @ts-ignore
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
