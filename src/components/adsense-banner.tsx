import { useEffect, useRef, useState } from "react";

/** Google AdSense client ID */
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT ?? "ca-pub-4966192764194561";

type Props = {
  adSlot: string;           // data-ad-slot
  adFormat?: string;        // ex: "auto", "rectangle", "fluid"
  style?: React.CSSProperties;
  className?: string;
  /** Altura mínima reservada (evita CLS / layout quebrado). Padrão: 100px. */
  minHeight?: number;
};

/**
 * Componente para exibir anúncios do Google AdSense.
 *
 * - Reserva espaço fixo para evitar Cumulative Layout Shift.
 * - Mostra placeholder discreto enquanto carrega ou se o anúncio falhar
 *   (sem rede, AdBlock, slot vazio, script bloqueado etc.).
 */
export function AdSenseBanner({
  adSlot,
  adFormat = "auto",
  style,
  className,
  minHeight = 100,
}: Props) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [status, setStatus] = useState<"loading" | "filled" | "empty">("loading");

  useEffect(() => {
    if (!ADSENSE_CLIENT || pushed.current) return;
    const el = ref.current;
    if (!el) return;

    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      setStatus("empty");
      return;
    }

    // Verifica após alguns segundos se o AdSense preencheu o slot.
    const check = window.setTimeout(() => {
      const filled =
        el.getAttribute("data-ad-status") === "filled" ||
        (el.firstElementChild?.clientHeight ?? 0) > 0;
      setStatus(filled ? "filled" : "empty");
    }, 2500);

    return () => window.clearTimeout(check);
  }, []);

  const showPlaceholder = status !== "filled";

  return (
    <div
      className={`relative w-full ${className ?? ""}`}
      style={{ minHeight, ...style }}
    >
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", minHeight, width: "100%" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
      {showPlaceholder && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/40"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {status === "loading" ? "Carregando anúncio…" : "Espaço publicitário"}
          </p>
        </div>
      )}
    </div>
  );
}
