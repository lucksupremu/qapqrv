/**
 * Native Ad bridge (Capacitor → AdMob).
 *
 * Web: no-op (o AdSlot cai pro AdSense banner).
 * APK: cobre o elemento `el` com uma NativeAdView real desenhada acima do WebView,
 *      acompanhando posição/scroll/resize via rAF throttle.
 */
import { registerPlugin } from "@capacitor/core";
import { useEffect, useRef } from "react";
import { isNativeApp } from "./in-app-browser";

interface NativeAdPlugin {
  initialize(): Promise<{ initialized: boolean }>;
  render(opts: { slotId: string; x: number; y: number; w: number; h: number }): Promise<{ ok: boolean }>;
  update(opts: { slotId: string; x: number; y: number; w: number; h: number }): Promise<{ ok: boolean }>;
  remove(opts: { slotId: string }): Promise<{ removed: boolean }>;
}

const NativeAd = registerPlugin<NativeAdPlugin>("NativeAd");

let initialized = false;
let counter = 0;

async function ensureInit() {
  if (initialized) return;
  try {
    await NativeAd.initialize();
    initialized = true;
  } catch (e) {
    console.warn("[native-ad] init falhou:", e);
  }
}

/**
 * Hook que cobre `ref` com um Native Ad nativo enquanto o elemento está montado.
 * No web ou se o plugin não existir, é no-op (o placeholder web continua aparecendo).
 */
export function useNativeAd(ref: React.RefObject<HTMLElement>) {
  const slotIdRef = useRef<string>(`slot-${++counter}`);

  useEffect(() => {
    if (!isNativeApp()) return;
    const slotId = slotIdRef.current;
    let cancelled = false;
    let rafId = 0;
    let lastSig = "";

    const measureAndSync = async (firstRender: boolean) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const sig = `${r.left.toFixed(1)}|${r.top.toFixed(1)}|${r.width.toFixed(1)}|${r.height.toFixed(1)}`;
      if (sig === lastSig) return;
      lastSig = sig;
      const payload = { slotId, x: r.left, y: r.top, w: r.width, h: r.height };
      try {
        if (firstRender) await NativeAd.render(payload);
        else await NativeAd.update(payload);
      } catch (e) {
        console.warn("[native-ad] render/update falhou:", e);
      }
    };

    const tick = () => {
      if (cancelled) return;
      measureAndSync(false);
      rafId = requestAnimationFrame(tick);
    };

    const onResize = () => measureAndSync(false);

    (async () => {
      await ensureInit();
      if (cancelled) return;
      await measureAndSync(true);
      rafId = requestAnimationFrame(tick);
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onResize, true);
    })();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      NativeAd.remove({ slotId }).catch(() => {});
    };
  }, [ref]);
}
