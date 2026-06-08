import { useRef } from "react";
import { AdSenseBanner } from "./adsense-banner";
import { useNativeAd } from "@/lib/native-ad";

/**
 * AdSlot — seletor de anúncio conforme a plataforma.
 * - Web:    Google AdSense (banner responsivo).
 * - APK:    Native Ad do AdMob desenhado sobre o slot por NativeAdPlugin.
 *           O elemento DOM funciona como "placeholder" — reserva o espaço,
 *           e o plugin Kotlin posiciona a NativeAdView por cima dele.
 */
type Props = { type?: "app-open" | "interstitial" | "banner" };

export function AdSlot({ type = "banner" }: Props) {
  const isNative =
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.isNativePlatform?.() === true;

  if (!isNative) {
    return (
      <div className="w-full max-w-sm">
        <AdSenseBanner adSlot="7036302359" adFormat="auto" className="w-full" />
      </div>
    );
  }

  // No APK, app-open/interstitial são tratados em fluxos próprios — aqui só renderiza native.
  if (type !== "banner") {
    return null;
  }

  return <NativeAdHost />;
}

function NativeAdHost() {
  const ref = useRef<HTMLDivElement>(null);
  useNativeAd(ref);
  // O conteúdo "placeholder" só aparece enquanto o ad não carregou; depois é coberto.
  return (
    <div
      ref={ref}
      data-native-ad-slot
      className="w-full max-w-md h-[88px] rounded-xl border border-border bg-muted/40 flex items-center justify-center text-[11px] uppercase tracking-widest text-muted-foreground"
    >
      Anúncio
    </div>
  );
}
