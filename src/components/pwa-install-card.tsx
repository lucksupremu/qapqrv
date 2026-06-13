// Card em Configurações para instalar o app como PWA.
// - Some no APK nativo ou se já estiver instalado.
// - Quando o navegador permite (Chrome/Edge/Brave/Samsung), o botão dispara
//   o diálogo nativo de instalação direto, com 1 toque, sem tutorial.
// - iOS Safari não expõe API, então mostra apenas a única instrução possível.
// - Demais navegadores sem API (Firefox) não renderizam nada — sem tutorial.

import { Download } from "lucide-react";
import { toast } from "sonner";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallCard() {
  const { isNative, isInstalled, canPrompt, promptInstall, isIOS } = usePwaInstall();

  if (isNative || isInstalled) return null;
  if (!canPrompt && !isIOS) return null;

  const handleInstall = async () => {
    if (!canPrompt) return;
    const result = await promptInstall();
    if (result === "accepted") toast.success("App instalado!");
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
      ) : (
        <p className="text-[12px]" style={{ color: "#5b7a8f" }}>
          No iPhone, toque em <strong>Compartilhar</strong> →{" "}
          <strong>Adicionar à Tela de Início</strong>.
        </p>
      )}
    </div>
  );
}
