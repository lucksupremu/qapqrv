import { registerPlugin } from "@capacitor/core";

export interface VpnStatusPlugin {
  /** Retorna { active: boolean } consultando ConnectivityManager (Android). */
  isActive(): Promise<{ active: boolean }>;
}

// No Android, a implementação nativa (Kotlin) é registrada via @CapacitorPlugin.
// Na web, o fallback abaixo lança e caímos no probe HTTP da intranet.
const VpnStatus = registerPlugin<VpnStatusPlugin>("VpnStatus", {
  web: {
    isActive: async () => {
      throw new Error("VpnStatus indisponível na web");
    },
  },
});

/**
 * Probe silencioso: tenta alcançar a intranet PMESP em segundo plano.
 * - Sucesso (qualquer resposta HTTP, mesmo opaca) → VPN ativa.
 * - Erro de rede ou timeout → VPN desconectada.
 *
 * Usa `no-cors` para não exigir CORS do servidor. Não bloqueia, não mostra
 * nada ao usuário — é o mesmo princípio de "pesquisar id escala em background".
 */
const INTRANET_PROBE_URL =
  "https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/arrelconesc.aspx?ping";
const PROBE_TIMEOUT_MS = 3500;

let cache: { value: boolean | null; at: number } | null = null;
const CACHE_TTL_MS = 15_000;

async function probeIntranet(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(INTRANET_PROBE_URL, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: ctrl.signal,
      // evita reusar conexão antiga
      redirect: "follow",
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Detecta VPN ativa de forma não-intrusiva.
 * - App nativo Android: plugin Kotlin (NetworkCapabilities.TRANSPORT_VPN) — instantâneo, offline.
 * - Web/PWA: probe silencioso na intranet PMESP (`no-cors` fetch com timeout).
 *   Resultado é cacheado por 15s para não martelar a rede.
 */
export async function isVpnActive(): Promise<boolean | null> {
  // 1) Tenta plugin nativo (Android)
  try {
    const res = await VpnStatus.isActive();
    return !!res.active;
  } catch {
    // segue para probe web
  }

  // 2) Probe web com cache curto
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return cache.value;
  }
  const ok = await probeIntranet();
  cache = { value: ok, at: now };
  return ok;
}
