import { useEffect, useRef } from "react";

/** Google AdSense client ID */
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT ?? "";

type Props = {
  adSlot: string;           // data-ad-slot
  adFormat?: string;        // ex: "auto", "rectangle", "fluid"
  style?: React.CSSProperties;
  className?: string;
};

/**
 * Componente para exibir anúncios do Google AdSense.
 * 
 * Uso:
 *   <AdSenseBanner adSlot="1234567890" adFormat="auto" />
 * 
 * Requer VITE_ADSENSE_CLIENT configurado (ca-pub-XXXXXXXXXXXXXXXX).
 */
export function AdSenseBanner({ adSlot, adFormat = "auto", style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || pushed.current) return;
    if (!ref.current) return;

    try {
      const adsbygoogle = (window as unknown as Record<string, unknown>)["adsbygoogle"];
      if (Array.isArray(adsbygoogle)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adsbygoogle as any).push({});
        pushed.current = true;
      }
    } catch {
      // ignora falhas de carregamento do AdSense
    }
  }, []);

  if (!ADSENSE_CLIENT) {
    // fallback visual quando não configurado
    return (
      <div
        className={`w-full rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center ${className ?? ""}`}
        style={style}
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Espaço para anúncio
        </p>
        <p className="mt-2 text-sm text-foreground/70">
          Configure VITE_ADSENSE_CLIENT para ativar
        </p>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}
