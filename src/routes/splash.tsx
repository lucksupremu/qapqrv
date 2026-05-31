import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdSlot } from "@/components/ad-slot";

export const Route = createFileRoute("/splash")({
  head: () => ({
    meta: [{ title: "QAP, QRV!" }],
  }),
  component: SplashScreen,
});

const COUNTDOWN_SECONDS = 5;

function SplashScreen() {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const finish = () => {
    try {
      sessionStorage.setItem("splash_shown", "1");
    } catch {
      // ignore
    }
    navigate({ to: "/", replace: true });
  };

  // TODO nativo: quando integrar Capacitor + AdMob, chamar aqui:
  //   if (Capacitor.isNativePlatform()) { AdMob.showAppOpenAd(...).then(finish) }

  const canSkip = remaining <= 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex items-center justify-between px-5 pt-6">
        <div className="text-sm font-semibold tracking-wide text-foreground/80">
          QAP, QRV!
        </div>
        <button
          type="button"
          onClick={finish}
          disabled={!canSkip}
          className="rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur transition disabled:opacity-60"
        >
          {canSkip ? "Pular" : `Pular em ${remaining}s`}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5">
        <div className="w-full max-w-sm">
          <AdSlot type="app-open" />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Anúncio de abertura
        </p>
      </div>
    </div>
  );
}
