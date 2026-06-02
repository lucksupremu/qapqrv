// O app roda apenas como web/PWA. APK (Capacitor) foi descontinuado.
// Esta função abre links sempre em nova aba do navegador padrão.



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

// APK foi descontinuado — o app roda apenas como web/PWA.
// `isNativeApp` permanece exportado para compatibilidade com chamadas existentes,
// mas sempre retorna false. Assim, todas as branches `if (isNativeApp())` no
// código viram dead-code e nada do Capacitor é executado em produção.
export function isNativeApp(): boolean {
  return false;
}

export async function openInAppBrowser(url: string, _opts: AbrirOpts = {}) {
  const targetUrl = normalizarUrl(url);
  if (typeof window !== "undefined") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}
