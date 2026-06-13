// Card em Configurações para instalar o app como PWA.
// - Some no APK nativo ou se já estiver instalado.
// - Quando o navegador permite, dispara o prompt nativo de instalação direto.
// - Quando o navegador não expõe API de instalação, apenas avisa de forma curta
//   (sem tutorial passo a passo).

import { Download } from "lucide-react";
import { toast } from "sonner";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallCard() {
  const { isNative, isInstalled, canPrompt, promptInstall } = usePwaInstall();

  if (isNative || isInstalled) return null;

  const handleInstall = async () => {
    if (!canPrompt) {
      toast.error("Seu navegador não permite instalação automática. Tente o Edge ou Firefox.");
      return;
    }
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
        Adicione o QAP, QRV! à tela inicial para abrir como um aplicativo, com
        acesso rápido e em tela cheia.
      </p>

      <button
        onClick={handleInstall}
        disabled={!canPrompt}
        className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-[12px] font-bold text-white disabled:opacity-60"
        style={{ background: "#2e6b8a" }}
      >
        <Download size={14} />
        Instalar agora
      </button>
    </div>
  );
}
