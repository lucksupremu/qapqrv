import { useCallback, useEffect, useState } from "react";
import { isNativeApp } from "@/lib/in-app-browser";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa_install_dismissed";

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ se passa por Mac; detecta via touch
  const iPadOS =
    /Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document;
  return iOS || iPadOS;
}

function detectAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean })
    .standalone === true;
  return !!mql || iosStandalone;
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
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // ignore
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
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
    return choice.outcome;
  }, [deferred]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }, []);

  const canPrompt = !!deferred;
  // Mostrável quando: não está no APK, não está instalado, e
  // (a) há prompt nativo disponível, OU (b) é iOS (precisa instruções)
  const isInstallable = !isNative && !isInstalled && (canPrompt || isIOS);
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
