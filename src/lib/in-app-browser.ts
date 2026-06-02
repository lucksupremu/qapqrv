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
      let fellBack = false;
      const fallbackTimer: { current?: number } = {};
      const removeHandles: Array<{ remove: () => Promise<void> }> = [];

      const cleanup = () => {
        if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
        void Promise.allSettled(removeHandles.map((handle) => handle.remove()));
      };

      const fallbackToSystem = (motivo: string) => {
        if (fellBack || closed) return;
        fellBack = true;
        closed = true;
        cleanup();
        console.warn(`[InAppBrowser] fallback p/ Chrome do sistema: ${motivo}`);
        void InAppBrowser.close()
          .catch(() => undefined)
          .finally(() =>
            openSystemBrowser(InAppBrowser, mod, targetUrl).catch(() => undefined),
          );
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
      // Eventos de erro variam entre versões do plugin; registramos todos os
      // candidatos conhecidos. Qualquer falha de SSL/rede dispara o fallback.
      const errorEvents = [
        "browserPageLoadError",
        "pageLoadError",
        "browserPageLoadFailed",
        "sslError",
      ];
      for (const ev of errorEvents) {
        try {
          const handle = await (
            InAppBrowser as unknown as {
              addListener: (
                name: string,
                cb: (err: unknown) => void,
              ) => Promise<{ remove: () => Promise<void> }>;
            }
          ).addListener(ev, (err) => {
            fallbackToSystem(`${ev}: ${JSON.stringify(err ?? {})}`);
          });
          if (handle?.remove) removeHandles.push(handle);
        } catch {
          // listener inexistente nessa versão do plugin — ignora
        }
      }

      fallbackTimer.current = window.setTimeout(() => {
        if (loaded || closed) return;
        // Mesmo com forceMobileUA, se nada carregou é melhor cair p/ Custom Tabs
        // (onde o usuário pode aceitar manualmente o certificado interno).
        fallbackToSystem("timeout sem browserPageLoaded");
      }, opts.timeoutMs ?? (opts.forceMobileUA ? 12000 : 8000));


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
