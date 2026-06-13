// Card em Configurações para instalar o app como PWA.
// - Some no APK nativo, em Chrome (que bloqueamos por política) ou já instalado.
// - Se houver prompt nativo (Edge/Brave/Samsung/Opera), aciona direto.
// - Caso contrário (Firefox/Safari), mostra instrução curta para usar o menu do navegador.

import { Download } from "lucide-react";
import { toast } from "sonner";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallCard() {
  const { isNative, isInstalled, isChromeFamily, canPrompt, promptInstall, isIOS } =
    usePwaInstall();

  if (isNative || isInstalled || isChromeFamily) return null;

  const handleInstall = async () => {
    if (canPrompt) {
      const result = await promptInstall();
      if (result === "accepted") toast.success("App instalado!");
      return;
    }
    toast.info(
      isIOS
        ? "No Safari, toque em Compartilhar → Adicionar à Tela de Início."
        : "Abra o menu do navegador (⋮) e toque em Instalar app / Adicionar à tela inicial.",
      { duration: 6000 },
    );
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
        Adicione o QAP, QRV! à tela inicial para abrir como um aplicativo, com
        acesso rápido e em tela cheia.
      </p>

      <button
        onClick={handleInstall}
        className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-[12px] font-bold text-white"
        style={{ background: "#2e6b8a" }}
      >
        <Download size={14} />
        {canPrompt ? "Instalar agora" : "Como instalar"}
      </button>

      {!canPrompt && (
        <p className="mt-3 text-[11px]" style={{ color: "#5b7a8f" }}>
          {isIOS
            ? "Safari: toque em Compartilhar → Adicionar à Tela de Início."
            : "Firefox/Edge: abra o menu (⋮) e toque em Instalar app / Adicionar à tela inicial."}
        </p>
      )}
    </div>
  );
}
