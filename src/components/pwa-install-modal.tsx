import { X, Share, Plus, MoreVertical, Download } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  platform: "ios" | "android" | "desktop";
};

export function PwaInstallModal({ open, onClose, platform }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Instalar o app
          </h3>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {platform === "ios" ? (
          <ol className="space-y-3 text-[14px] text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
                1
              </span>
              <span>
                Toque no botão <Share size={16} className="inline align-text-bottom" />{" "}
                <strong>Compartilhar</strong> na barra do Safari.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
                2
              </span>
              <span>
                Role e toque em <strong>Adicionar à Tela de Início</strong>{" "}
                <Plus size={16} className="inline align-text-bottom" />.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
                3
              </span>
              <span>
                Confirme em <strong>Adicionar</strong>. O ícone aparece na sua tela inicial.
              </span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-3 text-[14px] text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
                1
              </span>
              <span>
                Abra o menu do navegador{" "}
                <MoreVertical size={16} className="inline align-text-bottom" /> (três pontos).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
                2
              </span>
              <span>
                Toque em <strong>Instalar app</strong> ou{" "}
                <strong>Adicionar à tela inicial</strong>{" "}
                <Download size={16} className="inline align-text-bottom" />.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
                3
              </span>
              <span>Confirme. O QAP, QRV! será instalado como um app.</span>
            </li>
          </ol>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
