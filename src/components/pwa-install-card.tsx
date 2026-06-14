// Card em Configurações para instalar o app como PWA.
// - Some no APK nativo ou se já estiver instalado.
// - Chrome/Edge/Brave/Samsung: botão dispara o diálogo nativo (1 toque).
// - iOS Safari: mostra apenas a única instrução possível (Apple não expõe API).
// - Aguarda o Service Worker estar pronto antes de aparecer (sinal de PWA OK).

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallCard() {
  const { isNative, isInstalled, canPrompt, promptInstall, isIOS } = usePwaInstall();
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      setSwReady(true); // sem SW, não bloqueia o card
      return;
    }
    navigator.serviceWorker.ready.then(() => setSwReady(true)).catch(() => setSwReady(true));
    // fallback: após 4s mostra de qualquer forma para não esconder no iOS
    const t = window.setTimeout(() => setSwReady(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  if (isNative || isInstalled) return null;
  if (!swReady) return null;

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result === "accepted") toast.success("App instalado!");
    else if (result === "unavailable")
      toast.info("Este navegador não permite instalar com 1 toque.");
  };

  return (
    <div
      className="rounded-[16px] border-2 bg-white p-4"
      style={{ borderColor: "#2e6b8a" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Download size={18} style={{ color: "#0c2340" }} />
        <h3 className="text-[15px] font-bold" style={{ color: "#0c2340" }}>
          Instalar app
        </h3>
      </div>

      <p className="mb-3 text-[12px]" style={{ color: "#5b7a8f" }}>
        Adicione o QAP, QRV! à tela inicial para abrir como aplicativo, com
        acesso rápido e em tela cheia.
      </p>

      {canPrompt ? (
        <button
          onClick={handleInstall}
          className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-[12px] font-bold text-white"
          style={{ background: "#2e6b8a" }}
        >
          <Download size={14} />
          Instalar agora
        </button>
      ) : isIOS ? (
        <p className="text-[12px]" style={{ color: "#5b7a8f" }}>
          No iPhone, toque em <strong>Compartilhar</strong> →{" "}
          <strong>Adicionar à Tela de Início</strong>.
        </p>
      ) : (
        <p className="text-[12px]" style={{ color: "#5b7a8f" }}>
          Este navegador não permite instalar com 1 toque. Abra o app no
          Chrome, Edge, Brave ou Samsung Internet para instalar.
        </p>
      )}
    </div>
  );
}
