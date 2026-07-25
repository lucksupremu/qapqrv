// Aviso pontual: mostra pop-up com imagem "Novos AISP – Operação Delegada".
// Exibe uma única vez por dispositivo, apenas hoje (25/07) e amanhã (26/07/2026).
// Abre automaticamente e também via /?aviso=aisp-delegada (deep link do push).

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import aispAsset from "@/assets/aisp-delegada-jul26.jpg.asset.json";

const STORAGE_KEY = "aviso_aisp_delegada_v1";
// Válido até o fim do dia 26/07/2026 (horário local).
const EXPIRES_AT = new Date(2026, 6, 26, 23, 59, 59).getTime();

export function AvisoAispDelegadaModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("aviso") === "aisp-delegada";
    if (forced) {
      params.delete("aviso");
      const q = params.toString();
      const url = window.location.pathname + (q ? `?${q}` : "") + window.location.hash;
      window.history.replaceState({}, "", url);
    }

    if (Date.now() > EXPIRES_AT) return;

    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed && !forced) return;
    } catch {
      /* ignore */
    }

    // Pequeno delay pra não competir com hidratação/banners.
    const t = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(aispAsset.url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = "novos-aisp-delegada.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
    } catch {
      // Fallback: abre em nova aba pra usuário salvar manualmente.
      window.open(aispAsset.url, "_blank", "noopener,noreferrer");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Novos AISP da Operação Delegada"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-card text-card-foreground shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur active:scale-95"
        >
          <X size={18} />
        </button>

        <div className="px-4 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-500">
            Aviso · Operação Delegada
          </p>
          <h2 className="mt-1 text-base font-extrabold leading-tight">
            Novos AISP — confira os novos IDs e locais de revista
          </h2>
        </div>

        <div className="mt-3 bg-black">
          <img
            src={aispAsset.url}
            alt="Lista de transmissão — Novos AISP da Operação Delegada, 4ª Cia do 7ºM"
            className="w-full h-auto"
          />
        </div>

        <div className="flex gap-2 p-4">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black active:scale-95"
          >
            <Download size={16} strokeWidth={2.5} />
            Baixar imagem
          </button>
          <button
            onClick={dismiss}
            className="rounded-xl border border-border px-4 py-3 text-sm font-semibold active:scale-95"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
