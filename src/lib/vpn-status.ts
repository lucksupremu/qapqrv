// APK descontinuado — app roda apenas como web/PWA.
// Mantemos as exports para compatibilidade com chamadas existentes (vpn-guard,
// anyconnect, etc.). Sem APK, não há detecção confiável de VPN no navegador,
// então `isNativeVpnAvailable` é `false` e `isVpnActive` retorna `null` (a UI
// trata `null` apenas orientando o usuário a conectar o AnyConnect).

export function isNativeVpnAvailable(): boolean {
  return false;
}

export async function isVpnActive(): Promise<boolean | null> {
  return null;
}
