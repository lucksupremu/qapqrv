import { useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AdSenseBanner } from "./adsense-banner";
import { useNativeAd } from "@/lib/native-ad";
import { isAdsAllowedRoute } from "@/lib/ads-allowlist";

/**
 * AdSlot — seletor de anúncio conforme a plataforma. Mesma API em web e APK:
 *
 * - Web (PWA / navegador):
 *     - `banner`        → AdSense responsivo `auto` (slot padrão).
 *     - `in-feed`       → AdSense `fluid` + `layoutKey` (recomendado pro histórico).
 *     - `app-open`/`interstitial` → cai pro banner responsivo.
 *
 * - APK (Capacitor):
 *     - `banner`/`in-feed` → AdMob Native Ad desenhado sobre o WebView
 *       (`NativeAdPlugin.kt`).
 *     - `app-open`/`interstitial` → não renderiza inline (são fluxos próprios).
 *
 * Dimensões reservadas são iguais nas duas plataformas pra não causar CLS
 * nem layouts diferentes entre web e APK.
 */
type SlotType = "app-open" | "interstitial" | "banner" | "in-feed";

type Props = {
  type?: SlotType;
  /** Override do data-ad-slot do AdSense (web). Default = slot de histórico. */
  adSlot?: string;
  /** layoutKey só usado quando `type="in-feed"` (web). */
  layoutKey?: string;
};

// Altura mínima compartilhada — mantém o mesmo footprint em web e APK.
const SLOT_MIN_HEIGHT = 100;
const DEFAULT_SLOT = "7036302359";
// Layout key gerado no AdSense ao criar uma unidade in-feed; ajustar quando
// a unidade in-feed específica do app for criada no console do AdSense.
const DEFAULT_IN_FEED_LAYOUT_KEY = "-fb+5w+4e-db+86";

export function AdSlot({ type = "banner", adSlot = DEFAULT_SLOT, layoutKey }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isNative =
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.isNativePlatform?.() === true;

  // Política AdSense: anúncios só em rotas com conteúdo editorial.
  // Em rotas fora da allowlist o componente não renderiza nada (web).
  if (!isNative && !isAdsAllowedRoute(pathname)) return null;

  if (!isNative) {
    if (type === "in-feed") {
      return (
        <div className="w-full max-w-md">
          <AdSenseBanner
            adSlot={adSlot}
            adFormat="fluid"
            layoutKey={layoutKey ?? DEFAULT_IN_FEED_LAYOUT_KEY}
            minHeight={SLOT_MIN_HEIGHT}
            className="w-full"
          />
        </div>
      );
    }
    return (
      <div className="w-full max-w-md">
        <AdSenseBanner
          adSlot={adSlot}
          adFormat="auto"
          minHeight={SLOT_MIN_HEIGHT}
          className="w-full"
        />
      </div>
    );
  }

  // No APK, app-open/interstitial são tratados em fluxos próprios — aqui só
  // renderiza native ad inline para banner/in-feed.
  if (type !== "banner" && type !== "in-feed") return null;
  return <NativeAdHost />;
}

function NativeAdHost() {
  const ref = useRef<HTMLDivElement>(null);
  useNativeAd(ref);
  return (
    <div
      ref={ref}
      data-native-ad-slot
      style={{ minHeight: SLOT_MIN_HEIGHT }}
      className="w-full max-w-md rounded-xl border border-border bg-muted/40 flex items-center justify-center text-[11px] uppercase tracking-widest text-muted-foreground"
    >
      Anúncio
    </div>
  );
}
