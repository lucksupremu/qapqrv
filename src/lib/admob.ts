/**
 * AdMob — integração para o APK Capacitor.
 * - App Open Ad: plugin nativo próprio (`AppOpenAdPlugin.kt`).
 * - Intersticial: @capacitor-community/admob v8 (reservado para uso futuro).
 *
 * Web/PWA: estas funções são no-op. Os anúncios na web usam AdSense.
 */
import { registerPlugin } from "@capacitor/core";
import { isNativeApp } from "./in-app-browser";

export const ADMOB_APP_ID = "ca-app-pub-9197484743954603~4917243774";
export const ADMOB_APP_OPEN_ID = "ca-app-pub-9197484743954603/8424254265";
export const ADMOB_INTERSTITIAL_ID = "ca-app-pub-4966192764194561/3034845147";

interface AppOpenAdPlugin {
  initialize(): Promise<{ initialized: boolean }>;
  show(): Promise<{ shown: boolean; reason?: string; dismissed?: boolean }>;
}

const AppOpenAd = registerPlugin<AppOpenAdPlugin>("AppOpenAd");

let initialized = false;
let lastShownAt = 0;
const MIN_INTERVAL_MS = 4 * 60 * 1000; // 4 min — não mostra de novo logo após exibir

/** Inicializa o SDK do AdMob (uma única vez, apenas no APK). */
export async function initAdMob(): Promise<void> {
  if (!isNativeApp() || initialized) return;
  try {
    await AppOpenAd.initialize();
    initialized = true;
  } catch (e) {
    console.warn("[admob] init falhou:", e);
  }
}

/**
 * Mostra o App Open Ad. Só dispara se:
 *  - estiver no APK
 *  - o SDK já estiver inicializado
 *  - tiver passado o intervalo mínimo desde o último ad
 */
export async function showAppOpenAd(): Promise<void> {
  if (!isNativeApp()) return;
  const now = Date.now();
  if (now - lastShownAt < MIN_INTERVAL_MS) return;
  try {
    if (!initialized) await initAdMob();
    const res = await AppOpenAd.show();
    if (res?.shown) lastShownAt = now;
  } catch (e) {
    console.warn("[admob] app open falhou:", e);
  }
}

/** Compat: o intersticial não é mais usado, mas mantém a API antiga. */
export async function prepareInterstitial(): Promise<void> {
  /* no-op */
}

export async function showInterstitial(): Promise<void> {
  await showAppOpenAd();
}
