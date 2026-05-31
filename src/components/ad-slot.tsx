import { AdSenseBanner } from "./adsense-banner";

/**
 * AdSlot — seletor de anúncio conforme a plataforma.
 * - Web:      usa Google AdSense via AdSenseBanner
 * - Nativo:   placeholder para AdMob (integrar com Capacitor)
 */
type Props = { type?: "app-open" | "interstitial" | "banner" };

export function AdSlot({ type = "app-open" }: Props) {
  const isNative =
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.isNativePlatform?.() === true;

  if (!isNative) {
    return (
      <div className="w-full max-w-sm">
        {/* Substitua SUA_AD_SLOT_AQUI pelo seu data-ad-slot do AdSense */}
        <AdSenseBanner
          adSlot="SUA_AD_SLOT_AQUI"
          adFormat={type === "banner" ? "auto" : "rectangle"}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        Espaço para anúncio
      </p>
      <p className="mt-2 text-sm text-foreground/70">
        {type === "app-open" ? "Anúncio de abertura (AdMob)" : "Anúncio (AdMob)"}
      </p>
      <div className="mt-4 h-32 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs text-muted-foreground">
        Ad placeholder 320×250
      </div>
    </div>
  );
}
