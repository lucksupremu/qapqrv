// Abre links externos em um navegador interno.
// - No app nativo (Capacitor): usa @capacitor/inappbrowser
// - No web (navegador comum): abre nova aba
//
// Importes do Capacitor são DINÂMICOS para evitar quebrar o SSR — o
// pacote toca `window`/`navigator` no carregamento.

export type AbrirOpts = {
  titulo?: string;
  /** Mantém no WebView interno por padrão; usa Custom Tabs como fallback. */
  modo?: "webview" | "system" | "external";
  timeoutMs?: number;
};

const ANDROID_CHROME_UA =
  "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

function normalizarUrl(url: string) {
  const clean = url.trim();
  if (/^(https?:|mailto:|tel:|market:|intent:)/i.test(clean)) return clean;
  return `https://${clean}`;
}

async function openSystemBrowser(InAppBrowser: any, mod: any, url: string) {
  await InAppBrowser.openInSystemBrowser({
    url,
    options: {
      // @ts-ignore
      ...mod.DefaultSystemBrowserOptions,
      android: {
        // @ts-ignore
        ...mod.DefaultAndroidSystemBrowserOptions,
        showTitle: true,
        hideToolbarOnScroll: false,
      },
      iOS: {
        // @ts-ignore
        ...mod.DefaultiOSSystemBrowserOptions,
        closeButtonText: "Fechar",
      },
    },
  });
}

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
  const targetUrl = normalizarUrl(url);

  if (isNativeApp()) {
    try {
      const mod = await import("@capacitor/inappbrowser");
      // @ts-expect-error tipos do pacote variam por versão
      const InAppBrowser = mod.InAppBrowser ?? mod.default;

      if (opts.modo === "external") {
        await InAppBrowser.openInExternalBrowser({ url: targetUrl });
        return;
      }

      if (opts.modo === "system") {
        await openSystemBrowser(InAppBrowser, mod, targetUrl);
        return;
      }

      let loaded = false;
      let closed = false;
      let fallbackTimer: ReturnType<typeof window.setTimeout> | undefined;
      const removeHandles: Array<{ remove: () => Promise<void> }> = [];

      const cleanup = () => {
        if (fallbackTimer) window.clearTimeout(fallbackTimer);
        void Promise.allSettled(removeHandles.map((handle) => handle.remove()));
      };

      await InAppBrowser.removeAllListeners?.();
      removeHandles.push(
        await InAppBrowser.addListener("browserPageLoaded", () => {
          loaded = true;
          cleanup();
        }),
      );
      removeHandles.push(
        await InAppBrowser.addListener("browserPageNavigationCompleted", () => {
          loaded = true;
          cleanup();
        }),
      );
      removeHandles.push(
        await InAppBrowser.addListener("browserClosed", () => {
          closed = true;
          cleanup();
        }),
      );

      fallbackTimer = window.setTimeout(() => {
        if (loaded || closed) return;
        closed = true;
        void InAppBrowser.close()
          .catch(() => undefined)
          .finally(() => openSystemBrowser(InAppBrowser, mod, targetUrl).catch(() => undefined));
      }, opts.timeoutMs ?? 22000);

      await InAppBrowser.openInWebView({
        url: targetUrl,
        options: {
          // @ts-ignore
          ...mod.DefaultWebViewOptions,
          clearCache: false,
          clearSessionCache: false,
          showToolbar: true,
          showURL: true,
          showNavigationButtons: true,
          closeButtonText: "Fechar",
          customWebViewUserAgent: ANDROID_CHROME_UA,
          android: {
            // @ts-ignore
            ...mod.DefaultAndroidWebViewOptions,
            allowZoom: true,
            hardwareBack: true,
            pauseMedia: true,
            isIsolated: false,
          },
          iOS: {
            // @ts-ignore
            ...mod.DefaultiOSWebViewOptions,
            allowsBackForwardNavigationGestures: true,
            enableViewportScale: true,
          },
        },
      });
      return;
    } catch (e) {
      console.warn("InAppBrowser indisponível, fallback web", e);
    }
  }

  if (typeof window !== "undefined") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}
