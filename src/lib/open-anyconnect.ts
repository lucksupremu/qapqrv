import { toast } from "sonner";
import { isNativeApp } from "@/lib/in-app-browser";

const ANDROID_PACKAGE = "com.cisco.anyconnect.vpn.android.avf";
// Cisco Secure Client (v5) mantém o mesmo pacote; variantes corporativas usam este outro
const ANDROID_PACKAGES = [ANDROID_PACKAGE, "com.cisco.anyconnect.vpn.android.apex"];
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

function intentUri(pkg: string): string {
  const fallback = encodeURIComponent(
    `https://play.google.com/store/apps/details?id=${pkg}`,
  );
  // Formato canônico: sem host/scheme, o Android resolve a activity de launch
  // do pacote informado. Se o app não estiver instalado, cai na Play Store.
  return `intent://#Intent;package=${pkg};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;S.browser_fallback_url=${fallback};end`;
}

async function openViaCapacitor(platform: Platform): Promise<boolean> {
  try {
    const { AppLauncher } = await import("@capacitor/app-launcher");
    if (platform === "android") {
      for (const pkg of ANDROID_PACKAGES) {
        // No Android, canOpenUrl recebe o nome do pacote
        const { value } = await AppLauncher.canOpenUrl({ url: pkg }).catch(
          () => ({ value: false }),
        );
        if (value) {
          // openUrl precisa de uma URL/intent URI válida
          await AppLauncher.openUrl({ url: intentUri(pkg) });
          return true;
        }
      }
      // App não instalado → Play Store
      await AppLauncher.openUrl({ url: PLAY_STORE_MARKET }).catch(async () => {
        await AppLauncher.openUrl({ url: PLAY_STORE_URL });
      });
      return true;
    }
    if (platform === "ios") {
      const { value } = await AppLauncher.canOpenUrl({ url: SCHEME }).catch(
        () => ({ value: false }),
      );
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

export async function openAnyConnect() {
  if (typeof window === "undefined") return;
  const platform = detectPlatform();

  // Dentro do APK Capacitor: usa o plugin nativo (intent:// não funciona na WebView)
  if (isNativeApp()) {
    const ok = await openViaCapacitor(platform);
    if (ok) return;
    toast.error("Não foi possível abrir o Cisco Secure Client.");
    return;
  }

  if (platform === "android") {
    // Intent URI canônico: abre a activity de launch do app; se não estiver
    // instalado, o Chrome usa o browser_fallback_url (Play Store).
    window.location.href = intentUri(ANDROID_PACKAGE);
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
