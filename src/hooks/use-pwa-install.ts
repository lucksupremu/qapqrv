import { useCallback, useEffect, useState } from "react";
import { isNativeApp } from "@/lib/in-app-browser";
import {
  getPwaInstallState,
  promptPwaInstall,
  subscribePwaInstall,
} from "@/lib/pwa-install-manager";

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

function isDismissExpired(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return true;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return true;
    return Date.now() - ts > DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

export function usePwaInstall() {
  const [{ canPrompt, installed: isInstalled }, setState] = useState(() =>
    getPwaInstallState(),
  );
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsIOS(detectIOS());
    setIsAndroid(detectAndroid());
    setIsNative(isNativeApp());
    setDismissed(!isDismissExpired());

    const unsub = subscribePwaInstall(() => setState(getPwaInstallState()));
    setState(getPwaInstallState());
    return unsub;
  }, []);

  const promptInstall = useCallback(async () => {
    const result = await promptPwaInstall();
    if (result === "accepted") {
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        /* ignore */
      }
      setDismissed(false);
    }
    return result;
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  const isInstallable = !isNative && !isInstalled && canPrompt;
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
