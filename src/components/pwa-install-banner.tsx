import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallBanner() {
  const { shouldShowBanner, promptInstall, dismiss } = usePwaInstall();

  if (!shouldShowBanner) {
    return null;
  }

  return (
    <div className="mx-5 mt-3 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 p-3 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black">
        <Download size={20} strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-slate-900 dark:text-white">
          Instalar QAP, QRV!
        </p>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          Acesso rápido na tela inicial.
        </p>
      </div>
      <button
        onClick={() => void promptInstall()}
        className="rounded-xl bg-slate-900 px-3 py-2 text-[12px] font-bold text-white dark:bg-white dark:text-slate-900 active:scale-95"
      >
        Instalar
      </button>
      <button
        aria-label="Dispensar"
        onClick={dismiss}
        className="rounded-full p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
      >
        <X size={16} />
      </button>
    </div>
  );
}
