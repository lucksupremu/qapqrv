import { registerPlugin } from "@capacitor/core";

export interface VpnStatusPlugin {
  /** Retorna { active: boolean } consultando ConnectivityManager (Android). */
  isActive(): Promise<{ active: boolean }>;
}

// No Android, a implementação nativa (Kotlin) é registrada via @CapacitorPlugin.
// Na web, o fallback abaixo é usado (sem como detectar VPN → retorna unknown).
const VpnStatus = registerPlugin<VpnStatusPlugin>("VpnStatus", {
  web: {
    isActive: async () => {
      throw new Error("VpnStatus indisponível na web");
    },
  },
});

/**
 * Detecta VPN ativa de forma 100% offline (sem requisição de rede).
 * - Em app nativo Android: consulta NetworkCapabilities.TRANSPORT_VPN.
 * - Em web ou plugin ausente: retorna `null` (desconhecido).
 */
export async function isVpnActive(): Promise<boolean | null> {
  try {
    const res = await VpnStatus.isActive();
    return !!res.active;
  } catch {
    return null;
  }
}
