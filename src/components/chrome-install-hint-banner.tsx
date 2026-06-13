import { useEffect, useState } from "react";
import { Info, X, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useIsNative } from "@/hooks/use-is-native";

const DISMISS_KEY = "chrome_install_hint_dismissed_at";
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function ChromeInstallHintBanner() {
  const { isChromeFamily, isInstalled, isAndroid } = usePwaInstall();
  const native = useIsNative();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isDismissed());
  }, []);

  if (native || isInstalled || !isChromeFamily || dismissed) return null;

  const url = typeof window !== "undefined" ? window.location.origin : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado! Cole no Firefox ou Edge para instalar.");
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente: " + url);
    }
  };

  const handleOpenFirefox = () => {
    if (isAndroid) {
      // Intent que abre direto no Firefox no Android
      const host = url.replace(/^https?:\/\//, "");
      window.location.href = `intent://${host}#Intent;scheme=https;package=org.mozilla.firefox;end`;
    } else {
      handleCopy();
      toast.info("Abra o Firefox ou Edge e cole o link para instalar.");
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="mx-5 mt-3 rounded-2xl border border-amber-500/30 bg-amber-50 p-3 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black">
          <Info size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-slate-900 dark:text-white">
            Instalar como app
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-slate-700 dark:text-slate-300">
            O Chrome bloqueia a instalação do QAP, QRV!. Para instalar como app, abra
            este endereço no <strong>Firefox</strong> ou <strong>Edge</strong>.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={handleOpenFirefox}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-[12px] font-bold text-white dark:bg-white dark:text-slate-900 active:scale-95"
            >
              <ExternalLink size={13} />
              {isAndroid ? "Abrir no Firefox" : "Como abrir"}
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 active:scale-95"
            >
              <Copy size={13} />
              Copiar link
            </button>
          </div>
        </div>
        <button
          aria-label="Dispensar"
          onClick={handleDismiss}
          className="rounded-full p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
