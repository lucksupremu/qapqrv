// Abre links externos em um navegador interno.
// - No app nativo (Capacitor): usa @capacitor/inappbrowser
// - No web (navegador comum): abre nova aba
//
// Importes do Capacitor são DINÂMICOS para evitar quebrar o SSR — o
// pacote toca `window`/`navigator` no carregamento.
import type { InAppBrowserPlugin } from "@capacitor/inappbrowser";

type InAppBrowserModule = typeof import("@capacitor/inappbrowser");

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
};

export type AbrirOpts = {
  titulo?: string;
  /** Mantém no WebView interno por padrão; usa Custom Tabs como fallback. */
  modo?: "webview" | "system" | "external";
  timeoutMs?: number;
  /** Força UA mobile e desabilita fallback p/ Custom Tabs (que herda UA do Chrome do device). */
  forceMobileUA?: boolean;
};

const ANDROID_CHROME_UA =
  "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

function normalizarUrl(url: string) {
  const clean = url.trim();
  if (/^(https?:|mailto:|tel:|market:|intent:)/i.test(clean)) return clean;
  return `https://${clean}`;
}

async function openSystemBrowser(
  InAppBrowser: InAppBrowserPlugin,
  mod: InAppBrowserModule,
  url: string,
) {
  await InAppBrowser.openInSystemBrowser({
    url,
    options: {
      ...mod.DefaultSystemBrowserOptions,
      android: {
        ...mod.DefaultAndroidSystemBrowserOptions,
        showTitle: true,
        hideToolbarOnScroll: false,
      },
      iOS: {
        ...mod.DefaultiOSSystemBrowserOptions,
        closeButtonText: mod.DismissStyle.DONE,
      },
    },
  });
}

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // require síncrono não funciona em ESM; usamos a global que o Capacitor
    // injeta no runtime nativo. Em web, retorna false.
    const cap = (window as CapacitorWindow).Capacitor;
    return !!cap?.isNativePlatform?.();
  } catch {
    return false;
  }
}

export async function openInAppBrowser(url: string, opts: AbrirOpts = {}) {
  void opts.titulo; // reservado para futura customização da toolbar
  const targetUrl = normalizarUrl(url);
  // Padrão: forçar WebView interna do app + UA mobile próprio.
  // O Chrome / Custom Tabs está bloqueando o acesso à intranet PMESP, então
  // NÃO caímos mais para o navegador do sistema automaticamente.
  const forceMobileUA = opts.forceMobileUA ?? true;

  if (isNativeApp()) {
    try {
      const mod = await import("@capacitor/inappbrowser");
      const { InAppBrowser } = mod;

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
      const fallbackTimer: { current?: number } = {};
      const removeHandles: Array<{ remove: () => Promise<void> }> = [];

      const cleanup = () => {
        if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
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

      fallbackTimer.current = window.setTimeout(() => {
        if (loaded || closed) return;
        // Não cai mais para o Custom Tabs (Chrome). Apenas fecha a WebView;
        // o usuário vê a tela anterior com aviso de VPN/erro.
        if (forceMobileUA) return;
        closed = true;
        void InAppBrowser.close()
          .catch(() => undefined)
          .finally(() => openSystemBrowser(InAppBrowser, mod, targetUrl).catch(() => undefined));
      }, opts.timeoutMs ?? 22000);

      await InAppBrowser.openInWebView({
        url: targetUrl,
        options: {
          ...mod.DefaultWebViewOptions,
          clearCache: false,
          clearSessionCache: false,
          showToolbar: true,
          showURL: true,
          showNavigationButtons: true,
          closeButtonText: "Fechar",
          customWebViewUserAgent: ANDROID_CHROME_UA,
          android: {
            ...mod.DefaultAndroidWebViewOptions,
            allowZoom: true,
            hardwareBack: true,
            pauseMedia: true,
            isIsolated: false,
          },
          iOS: {
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
