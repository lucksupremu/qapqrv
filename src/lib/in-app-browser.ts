// Abre links sempre no navegador padrão do aparelho.
// - No APK (Capacitor): usa InAppBrowser.openInExternalBrowser → Chrome do sistema
// - No web (PWA/desktop): window.open em nova aba
//
// Decisão: NÃO usamos mais WebView interno. O Chrome externo dá ao usuário o
// menu completo (3 pontos → "Site para computador", recarregar, etc.), mantém
// cookies/certificados aceitos entre sessões e elimina toda a lógica frágil de
// fallback / timeout / handler de SSL do plugin.

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
};

// `AbrirOpts` é mantido como tipo opcional só para compatibilidade com chamadas
// antigas — os campos são ignorados. Sempre abrimos no navegador padrão.
export type AbrirOpts = {
  titulo?: string;
  modo?: "webview" | "system" | "external";
  timeoutMs?: number;
  forceMobileUA?: boolean;
};

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

export async function openInAppBrowser(url: string, _opts: AbrirOpts = {}) {
  const targetUrl = normalizarUrl(url);

  if (isNativeApp()) {
    try {
      const { InAppBrowser } = await import("@capacitor/inappbrowser");
      await InAppBrowser.openInExternalBrowser({ url: targetUrl });
      return;
    } catch (e) {
      console.warn("InAppBrowser indisponível, fallback window.open", e);
    }
  }

  if (typeof window !== "undefined") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}
