// Abre links externos em um navegador interno.
// - No app nativo (Capacitor Android): usa nosso plugin próprio
//   `InAppWebView` (WebView nativa em Activity dedicada — controle total
//   de UA, cookies, JS, zoom). Resolve o problema de acesso à intranet
//   PMESP que o navegador externo não conseguia.
// - No web (navegador comum): abre nova aba.

import { InAppWebView } from "./in-app-webview";

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
};

export type AbrirOpts = {
  titulo?: string;
  /** Mantido por compatibilidade — não tem mais efeito (sempre WebView interna). */
  modo?: "webview" | "system" | "external";
  /** Mantido por compatibilidade — sem efeito. */
  timeoutMs?: number;
  /** Mantido por compatibilidade — sempre força UA mobile interno. */
  forceMobileUA?: boolean;
};

const INTERNAL_WEBVIEW_UA =
  "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 QAPQRVWebView/1.0";

function normalizarUrl(url: string) {
  const clean = url.trim();
  if (/^(https?:|mailto:|tel:|market:|intent:)/i.test(clean)) return clean;
  return `https://${clean}`;
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

  if (isNativeApp()) {
    try {
      await InAppWebView.open({
        url: targetUrl,
        title: opts.titulo ?? "",
        userAgent: INTERNAL_WEBVIEW_UA,
      });
      return;
    } catch (e) {
      console.warn("InAppWebView indisponível, fallback web", e);
    }
  }

  if (typeof window !== "undefined") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}
