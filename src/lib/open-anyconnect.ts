import { toast } from "sonner";
import { isNativeApp } from "@/lib/in-app-browser";

const ANDROID_PACKAGE = "com.cisco.anyconnect.vpn.android.avf";
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const PLAY_STORE_MARKET = `market://details?id=${ANDROID_PACKAGE}`;
const APP_STORE_URL = "https://apps.apple.com/us/app/cisco-secure-client/id1135064690";
const SCHEME = "anyconnect://";

type Platform = "android" | "ios" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/i.test(ua)) return "ios";
  // iPadOS 13+ se identifica como Mac
  if (/Macintosh/i.test(ua) && "ontouchend" in document) return "ios";
  return "other";
}

async function openViaCapacitor(platform: Platform): Promise<boolean> {
  try {
    const { AppLauncher } = await import("@capacitor/app-launcher");
    if (platform === "android") {
      // Tenta abrir pelo package (Android consegue resolver direto)
      const { value } = await AppLauncher.canOpenUrl({ url: ANDROID_PACKAGE });
      if (value) {
        await AppLauncher.openUrl({ url: ANDROID_PACKAGE });
        return true;
      }
      // App não instalado → Play Store
      await AppLauncher.openUrl({ url: PLAY_STORE_MARKET }).catch(async () => {
        await AppLauncher.openUrl({ url: PLAY_STORE_URL });
      });
      return true;
    }
    if (platform === "ios") {
      const { value } = await AppLauncher.canOpenUrl({ url: SCHEME });
      if (value) {
        await AppLauncher.openUrl({ url: SCHEME });
        return true;
      }
      await AppLauncher.openUrl({ url: APP_STORE_URL });
      return true;
    }
  } catch (err) {
    console.error("[anyconnect] AppLauncher falhou:", err);
  }
  return false;
}

export function openAnyConnect() {
  if (typeof window === "undefined") return;
  const platform = detectPlatform();

  if (platform === "android") {
    // Intent URL: abre o app se instalado, ou cai na Play Store via fallback.
    // Usa scheme=android-app + package como host (formato comprovadamente
    // funcional na tela /intranet) — o formato com scheme=anyconnect causava
    // "página não encontrada" no Chrome quando o app não registrava o esquema.
    const fallback = encodeURIComponent(PLAY_STORE_URL);
    window.location.href = `intent://${ANDROID_PACKAGE}#Intent;scheme=android-app;package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
    return;
  }

  if (platform === "ios") {
    const start = Date.now();
    const timeout = window.setTimeout(() => {
      // Se ainda estivermos visíveis depois de ~1.5s, o app não abriu
      if (Date.now() - start < 2000 && !document.hidden) {
        window.location.href = APP_STORE_URL;
      }
    }, 1500);

    const onVisibility = () => {
      if (document.hidden) window.clearTimeout(timeout);
    };
    document.addEventListener("visibilitychange", onVisibility, { once: true });

    window.location.href = SCHEME;
    return;
  }

  toast.info("Abra este link no seu celular para iniciar o Cisco Secure Client (AnyConnect).");
}
