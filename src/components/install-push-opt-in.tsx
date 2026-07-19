// Opt-in suave que aparece 1x quando o usuário atingiu o 2º dia distinto de acesso,
// não instalou o app e o navegador permite instalação. Pede ativar notificações
// para enviar 1 lembrete de instalação pelo servidor.

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";

import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useIsNative } from "@/hooks/use-is-native";
import {
  getAccessDays,
  isFirstSession,
  markInstallOptInShown,
  subscribeToPush,
  wasInstallOptInShown,
} from "@/lib/push-client";

const MIN_DAYS = 2;
const DELAY_MS = 4000;

export function InstallPushOptIn() {
  const { isInstalled, canPrompt } = usePwaInstall();
  const native = useIsNative();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (native || isInstalled || !canPrompt) return;
    if (isFirstSession()) return; // não incomodar no primeiro boot
    if (wasInstallOptInShown()) return;
    if (getAccessDays() < MIN_DAYS) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    const t = window.setTimeout(() => setShow(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, [native, isInstalled, canPrompt]);

  if (!show) return null;

  const handleAccept = async () => {
    setBusy(true);
    try {
      const ok = await subscribeToPush({ wantsInstallPush: true });
      if (ok) {
        toast.success("Pronto! Vamos te lembrar de instalar.");
        markInstallOptInShown();
        setShow(false);
      } else {
        toast.error("Não foi possível ativar. Verifique a permissão de notificações.");
        markInstallOptInShown();
        setShow(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    markInstallOptInShown();
    setShow(false);
  };

  return (
    <div className="mx-5 mt-3 rounded-2xl border border-amber-500/30 bg-amber-50 p-3 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black">
          <Download size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-slate-900 dark:text-white">
            Quer um lembrete para instalar?
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-slate-700 dark:text-slate-300">
            Ative notificações e te avisamos como deixar o QAP, QRV! na tela
            inicial — só 1 lembrete, sem spam.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={handleAccept}
              disabled={busy}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-[12px] font-bold text-white dark:bg-white dark:text-slate-900 active:scale-95 disabled:opacity-60"
            >
              {busy ? "Aguarde…" : "Quero o lembrete"}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 active:scale-95"
            >
              Agora não
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
