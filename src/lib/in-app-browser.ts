// Abre links externos em um navegador interno.
// - No app nativo (Capacitor Android):
//     • Intranet PMESP (`*.policiamilitar.sp.gov.br`): WebView interna dedicada
//       (`InAppWebView`) — necessária para autofill de credenciais, cookies,
//       TLS relaxado da CA própria e download de PDFs de escala.
//     • Outros links: Chrome Custom Tabs — usa o Chrome do usuário, com
//       autofill/senhas/dark-mode nativos, muito mais leve e estável.
//     • `forceWebview: true` força a WebView interna (ex.: rota /intranet).
// - No web (navegador comum): abre nova aba.

import { InAppWebView } from "./in-app-webview";
import { CustomTabs } from "./custom-tabs";

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
};

export type AbrirOpts = {
  titulo?: string;
  /**
   * - "webview": força WebView interna (PMESP e similares).
   * - "system" / "external" / undefined: padrão → escolhe automaticamente
   *   (Custom Tabs para links genéricos, WebView para PMESP).
   */
  modo?: "webview" | "system" | "external";
  /** Mantido por compatibilidade — sem efeito. */
  timeoutMs?: number;
  /** Mantido por compatibilidade — sempre força UA mobile interno na WebView. */
  forceMobileUA?: boolean;
  /** Força a WebView interna mesmo para links não-PMESP. */
  forceWebview?: boolean;
};

const INTERNAL_WEBVIEW_UA =
  "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 QAPQRVWebView/1.0";

const TOOLBAR_COLOR = "#2e6b8a";

function normalizarUrl(url: string) {
  const clean = url.trim();
  if (/^(https?:|mailto:|tel:|market:|intent:)/i.test(clean)) return clean;
  return `https://${clean}`;
}

function isPmespHost(url: string): boolean {
  try {
    const u = new URL(url);
    return /(^|\.)policiamilitar\.sp\.gov\.br$/i.test(u.hostname);
  } catch {
    return /policiamilitar\.sp\.gov\.br/i.test(url);
  }
}

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cap = (window as CapacitorWindow).Capacitor;
    return !!cap?.isNativePlatform?.();
  } catch {
    return false;
  }
}

export async function openInAppBrowser(url: string, opts: AbrirOpts = {}) {
  const targetUrl = normalizarUrl(url);
  const forceWebview = opts.forceWebview || opts.modo === "webview";

  if (isNativeApp()) {
    const useWebview = forceWebview || isPmespHost(targetUrl);

    if (useWebview) {
      try {
        await InAppWebView.open({
          url: targetUrl,
          title: opts.titulo ?? "",
          userAgent: INTERNAL_WEBVIEW_UA,
        });
        return;
      } catch (e) {
        console.warn("InAppWebView indisponível, tentando Custom Tabs", e);
      }
    }

    // Padrão para links genéricos: Chrome Custom Tabs.
    try {
      await CustomTabs.open({ url: targetUrl, toolbarColor: TOOLBAR_COLOR });
      return;
    } catch (e) {
      console.warn("CustomTabs indisponível, fallback WebView interna", e);
      try {
        await InAppWebView.open({
          url: targetUrl,
          title: opts.titulo ?? "",
          userAgent: INTERNAL_WEBVIEW_UA,
        });
        return;
      } catch (e2) {
        console.warn("WebView fallback falhou, fallback browser web", e2);
      }
    }
  }

  if (typeof window !== "undefined") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}
