import { useCallback, useEffect, useState } from "react";
import { isNativeApp } from "@/lib/in-app-browser";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa_install_dismissed_at";
const DISMISS_DAYS = 7;

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOS =
    /Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document;
  return iOS || iPadOS;
}

function detectAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

function detectFirefox(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Firefox desktop e Firefox Android (Fennec/Fenix)
  return /Firefox\//i.test(ua) || /FxiOS\//i.test(ua);
}

function detectChromeFamily(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Chrome, Chromium, Edge, Brave, Opera, Samsung Internet, etc. — qualquer Chromium.
  // Excluímos explicitamente Firefox.
  if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) return false;
  return /Chrome\//i.test(ua) || /Chromium\//i.test(ua) || /CriOS\//i.test(ua);
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean })
    .standalone === true;
  return !!mql || iosStandalone;
}

function isDismissExpired(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return true;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return true;
    const elapsed = Date.now() - ts;
    return elapsed > DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsIOS(detectIOS());
    setIsAndroid(detectAndroid());
    setIsInstalled(detectStandalone());
    setIsNative(isNativeApp());
    setDismissed(!isDismissExpired());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
      // limpa dismiss ao instalar com sucesso
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        // ignore
      }
      setDismissed(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        // ignore
      }
      setDismissed(false);
    }
    return choice.outcome;
  }, [deferred]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setDismissed(true);
  }, []);

  const canPrompt = !!deferred;
  const isChromeFamily = detectChromeFamily();
  // Política: bloquear instalação PWA apenas no Chrome/Chromium (inclui Edge,
  // Brave, Opera, Samsung Internet, CriOS). Firefox, Safari e demais ficam liberados.
  const browserAllowsInstall = !isChromeFamily;
  const isInstallable =
    !isNative && !isInstalled && browserAllowsInstall && (canPrompt || isIOS);
  const shouldShowBanner = isInstallable && !dismissed;

  return {
    canPrompt,
    promptInstall,
    dismiss,
    isIOS,
    isAndroid,
    isInstalled,
    isNative,
    isInstallable,
    shouldShowBanner,
  };
}
