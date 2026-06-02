import { registerPlugin, Capacitor } from "@capacitor/core";

export interface VpnStatusPlugin {
  /** Retorna { active: boolean } consultando ConnectivityManager (Android). */
  isActive(): Promise<{ active: boolean }>;
}

// No Android, a implementação nativa (Kotlin) é registrada via @CapacitorPlugin.
// Na web, o fallback abaixo lança e a função retorna null (status desconhecido).
const VpnStatus = registerPlugin<VpnStatusPlugin>("VpnStatus", {
  web: {
    isActive: async () => {
      throw new Error("VpnStatus indisponível na web");
    },
  },
});

/**
 * Indica se o plugin nativo de detecção de VPN está disponível
 * (apenas no APK Android com Capacitor). Na web/PWA/iOS sem plugin → false.
 */
export function isNativeVpnAvailable(): boolean {
  try {
    return (
      typeof Capacitor !== "undefined" &&
      Capacitor.isNativePlatform?.() === true &&
      Capacitor.getPlatform?.() === "android"
    );
  } catch {
    return false;
  }
}

/**
 * Detecta VPN ativa de forma não-intrusiva.
 * - APK Android: plugin Kotlin (NetworkCapabilities.TRANSPORT_VPN) — instantâneo, offline.
 * - Web / iOS (sem plugin): retorna `null` (não há detecção confiável no navegador).
 *   A UI deve, nesses casos, apenas orientar o usuário a conectar o AnyConnect.
 */
export async function isVpnActive(): Promise<boolean | null> {
  try {
    const res = await VpnStatus.isActive();
    return !!res.active;
  } catch {
    return null;
  }
}
