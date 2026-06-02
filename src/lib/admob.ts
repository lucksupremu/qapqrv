/**
 * AdMob — integração para o APK Capacitor.
 * Não roda no navegador (PWA). Na web, os anúncios usam AdSense.
 *
 * Nota: @capacitor-community/admob v8 ainda não tem suporte oficial a
 * "App Open Ads". Como substituto, mostramos um intersticial logo após
 * a abertura do app.
 */
import { isNativeApp } from "./in-app-browser";

export const ADMOB_APP_ID = "ca-app-pub-4966192764194561~2515666476";
/** Reservado para quando o plugin suportar App Open Ads. */
export const ADMOB_APP_OPEN_ID = "ca-app-pub-4966192764194561/9412551231";
export const ADMOB_INTERSTITIAL_ID = "ca-app-pub-4966192764194561/3034845147";

let initialized = false;
let interstitialPrepared = false;

/** Inicializa o SDK do AdMob (uma única vez, apenas no APK). */
export async function initAdMob(): Promise<void> {
  if (!isNativeApp() || initialized) return;
  try {
    const { AdMob } = await import(/* @vite-ignore */ "@capacitor-community/admob");
    await AdMob.initialize({ initializeForTesting: false });
    initialized = true;
  } catch (e) {
    console.warn("[admob] init falhou:", e);
  }
}

/** Pré-carrega o intersticial. */
export async function prepareInterstitial(): Promise<void> {
  if (!isNativeApp() || interstitialPrepared) return;
  try {
    await initAdMob();
    const { AdMob } = await import(/* @vite-ignore */ "@capacitor-community/admob");
    await AdMob.prepareInterstitial({ adId: ADMOB_INTERSTITIAL_ID });
    interstitialPrepared = true;
  } catch (e) {
    console.warn("[admob] prepare interstitial falhou:", e);
  }
}

/** Mostra o intersticial. Se não estiver preparado, prepara antes. */
export async function showInterstitial(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    if (!interstitialPrepared) await prepareInterstitial();
    const { AdMob } = await import(/* @vite-ignore */ "@capacitor-community/admob");
    await AdMob.showInterstitial();
    interstitialPrepared = false;
    void prepareInterstitial(); // pré-carrega o próximo
  } catch (e) {
    console.warn("[admob] show interstitial falhou:", e);
  }
}

/**
 * Substituto de App Open: mostra um intersticial logo após o app abrir.
 */
export async function showAppOpenAd(): Promise<void> {
  await showInterstitial();
}
