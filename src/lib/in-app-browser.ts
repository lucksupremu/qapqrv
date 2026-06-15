// Abre links externos no navegador interno imersivo (estilo Instagram/Twitter):
//  - No app nativo Android: WebView interna em modo full-screen (sem URL bar,
//    sem toolbar). Botão × flutuante, ⋮ flutuante, pull-to-refresh, edge-swipe
//    pra voltar. PMESP usa a mesma WebView (com autofill de credenciais via
//    plugin nativo, configurado antes de abrir).
//  - No web (navegador comum): abre nova aba.

import { InAppWebView } from "./in-app-webview";

type CapacitorWindow = Window & {
  Capacitor?: { isNativePlatform?: () => boolean };
};

export type AbrirOpts = {
  titulo?: string;
  /** Mantido por compatibilidade — sem efeito (sempre WebView interna no APK). */
  modo?: "webview" | "system" | "external";
  /** Mantido por compatibilidade. */
  timeoutMs?: number;
  /** Mantido por compatibilidade — sempre força UA mobile interno. */
  forceMobileUA?: boolean;
  /** Mantido por compatibilidade — sempre WebView interna agora. */
  forceWebview?: boolean;
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
    return !!(window as CapacitorWindow).Capacitor?.isNativePlatform?.();
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
      console.warn("InAppWebView falhou, fallback browser web", e);
    }
  }

  if (typeof window !== "undefined") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}
