// Modal de confirmação de instalação do PWA.
// Aparece UMA vez por sessão quando `beforeinstallprompt` está disponível,
// o usuário não está em APK, não instalou e não dispensou ainda.
// Aumenta o índice de aceitação vs. botão estático.

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const SESSION_KEY = "pwa_install_confirm_shown";
const DISMISS_KEY = "pwa_install_confirm_dismissed_at";
const DISMISS_DAYS = 14;

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Date.now() - ts < DISMISS_DAYS * 86400_000;
  } catch {
    return false;
  }
}

export function InstallConfirmModal() {
  const { isNative, isInstalled, canPrompt, promptInstall } = usePwaInstall();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isNative || isInstalled || !canPrompt) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    if (recentlyDismissed()) return;
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setOpen(true);
    }, 6000);
    return () => window.clearTimeout(t);
  }, [isNative, isInstalled, canPrompt]);

  if (!open) return null;

  const close = () => setOpen(false);
  const remindLater = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    close();
  };
  const install = async () => {
    const res = await promptInstall();
    if (res === "accepted") toast.success("App instalado!");
    close();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-confirm-title"
      onClick={close}
    >
      <div
        className="w-full max-w-[420px] rounded-[20px] bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "var(--gradient-primary, #2e6b8a)" }}
          >
            <Download size={24} color="white" />
          </div>
          <div className="flex-1">
            <h2
              id="install-confirm-title"
              className="text-[17px] font-bold"
              style={{ color: "#0c2340" }}
            >
              Instalar o MIKE TOOLS?
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: "#5b7a8f" }}>
              Acesso rápido pela tela inicial, tela cheia e funciona mesmo sem
              internet. Sem app store, sem cadastro.
            </p>
          </div>
          <button
            aria-label="Fechar"
            onClick={close}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={remindLater}
            className="flex-1 rounded-[12px] border-2 bg-white py-3 text-[13px] font-bold"
            style={{ borderColor: "#e8f0f8", color: "#5b7a8f" }}
          >
            Agora não
          </button>
          <button
            onClick={install}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-3 text-[13px] font-bold text-white"
            style={{ background: "#2e6b8a" }}
          >
            <Download size={16} /> Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
