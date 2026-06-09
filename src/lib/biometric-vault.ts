// Atalho biométrico para o cofre de credenciais.
//
// Como funciona:
// - Só ativo no APK Android (Capacitor). No web é no-op.
// - Armazena o PIN do cofre em localStorage do APK (sandbox por app) sob a
//   chave `intranet_vault_bio_pin_v1`.
// - Ao desbloquear, exige `BiometricAuth.authenticate()` (digital/face) antes
//   de devolver o PIN. Sem biometria válida, nada é retornado.
//
// Trade-off: o PIN não é cifrado por chave do Keystore — o gatekeeper é o
// prompt biométrico do Android. Para o caso de uso (apenas evitar redigitar
// o PIN a cada acesso) é suficiente; a senha da intranet em si continua
// protegida por AES-GCM no `credential-vault.ts`.

import { isNativeApp } from "@/lib/in-app-browser";

const BIO_PIN_KEY = "intranet_vault_bio_pin_v1";
const BIO_ENABLED_KEY = "intranet_vault_bio_enabled_v1";

type BiometryCheck = {
  isAvailable: boolean;
  strongBiometryIsAvailable?: boolean;
  reason?: string;
};

async function getBioPlugin() {
  if (!isNativeApp()) return null;
  try {
    const mod = await import("@aparajita/capacitor-biometric-auth");
    return mod.BiometricAuth;
  } catch (e) {
    console.warn("[biometric] plugin indisponível", e);
    return null;
  }
}

export async function biometricSupported(): Promise<boolean> {
  const plugin = await getBioPlugin();
  if (!plugin) return false;
  try {
    const res = (await plugin.checkBiometry()) as BiometryCheck;
    return !!res?.isAvailable;
  } catch {
    return false;
  }
}

export function biometricEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.localStorage.getItem(BIO_ENABLED_KEY) === "1" &&
    !!window.localStorage.getItem(BIO_PIN_KEY)
  );
}

/**
 * Ativa o atalho biométrico. Exige o PIN atual (já validado pelo chamador)
 * e dispara um prompt biométrico de confirmação. Só persiste se a biometria
 * for aceita.
 */
export async function enableBiometric(pin: string): Promise<boolean> {
  const plugin = await getBioPlugin();
  if (!plugin) return false;
  try {
    await plugin.authenticate({
      reason: "Confirme sua biometria para ativar o desbloqueio rápido",
      cancelTitle: "Cancelar",
      androidTitle: "Ativar biometria",
      androidSubtitle: "Toque no sensor de digital",
      allowDeviceCredential: false,
    });
  } catch {
    return false;
  }
  window.localStorage.setItem(BIO_PIN_KEY, pin);
  window.localStorage.setItem(BIO_ENABLED_KEY, "1");
  return true;
}

export function disableBiometric(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(BIO_PIN_KEY);
  window.localStorage.removeItem(BIO_ENABLED_KEY);
}

/**
 * Tenta desbloquear via biometria. Retorna o PIN guardado em caso de sucesso,
 * ou null se o usuário cancelar / falhar / não houver biometria configurada.
 */
export async function unlockPinWithBiometric(): Promise<string | null> {
  if (!biometricEnabled()) return null;
  const plugin = await getBioPlugin();
  if (!plugin) return null;
  try {
    await plugin.authenticate({
      reason: "Desbloquear cofre da intranet",
      cancelTitle: "Usar PIN",
      androidTitle: "Desbloquear cofre",
      androidSubtitle: "Toque no sensor de digital",
      allowDeviceCredential: false,
    });
  } catch {
    return null;
  }
  return window.localStorage.getItem(BIO_PIN_KEY);
}
