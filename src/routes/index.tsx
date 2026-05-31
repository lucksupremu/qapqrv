import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdSlot } from "@/components/ad-slot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QAP, QRV! — Ferramentas operacionais para PMs" },
      {
        name: "description",
        content:
          "Hub de ferramentas operacionais úteis para o policial militar em um só lugar.",
      },
      { property: "og:title", content: "QAP, QRV!" },
      {
        property: "og:description",
        content: "Ferramentas operacionais em um só lugar.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Pular splash se já viu nesta sessão
    if (window.sessionStorage.getItem("qapqrv:ad-seen-session")) {
      navigate({ to: "/inicio", replace: true });
      return;
    }
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [navigate]);

  const handleContinue = () => {
    try {
      window.sessionStorage.setItem("qapqrv:ad-seen-session", "1");
    } catch {
      /* ignore */
    }
    navigate({ to: "/inicio", replace: true });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-brand-navy-foreground"
      style={{ background: "var(--gradient-header)" }}
    >
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black tracking-tight">
          QAP, <span className="text-brand-blue">QRV!</span>
        </h1>
        <p className="mt-2 text-white/75">Ferramentas operacionais em um só lugar</p>
      </div>

      <div className="w-full max-w-sm">
        <AdSlot type="app-open" />
      </div>

      <button
        onClick={handleContinue}
        disabled={seconds > 0}
        className="mt-6 w-full max-w-sm rounded-xl bg-brand-blue px-6 py-3.5 font-bold text-brand-blue-foreground transition disabled:opacity-50 active:scale-[0.98]"
      >
        {seconds > 0 ? `Aguarde ${seconds}s…` : "Continuar para o app"}
      </button>
    </div>
  );
}
