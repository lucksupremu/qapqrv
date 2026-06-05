// Warm-up de sessão na intranet PMESP no APK.
// Cria uma WebView invisível, carrega uma página leve da intranet e popula
// o CookieManager compartilhado com o HttpURLConnection usado pelo
// downloadPdf. Sem isso, a primeira consulta de escala no APK costuma
// retornar HTML de login (sem cookie de sessão) em vez do PDF.
//
// Gating:
//  - só roda no APK (Capacitor native)
//  - só roda se a VPN estiver ativa (NetworkCapabilities.TRANSPORT_VPN)
//  - cache de 30 min em memória — não re-executa em todo resume

import { isNativeApp } from "@/lib/in-app-browser";
import { isVpnActive } from "@/lib/vpn-status";
import { InAppWebView } from "@/lib/in-app-webview";

const WARMUP_URL =
  "https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/EscOpeDel.aspx";
const TTL_MS = 30 * 60 * 1000; // 30 min

let lastOkAt = 0;
let inflight: Promise<boolean> | null = null;

export async function warmupIntranetSession(force = false): Promise<boolean> {
  if (!isNativeApp()) return false;
  if (!force && Date.now() - lastOkAt < TTL_MS) return true;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const vpn = await isVpnActive();
      if (vpn === false) return false; // VPN comprovadamente desligada
      const res = await InAppWebView.warmupIntranet({
        url: WARMUP_URL,
        timeoutMs: 15000,
      });
      const ok = !!res?.ok;
      if (ok) lastOkAt = Date.now();
      return ok;
    } catch (e) {
      console.warn("[warmup] falhou", e);
      return false;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
