// Aviso pontual: mostra pop-up com imagem "Novos AISP – Operação Delegada".
// Exibe uma vez por dia (25/07 e 26/07/2026), com botão fixo no topo pra reabrir.
// Também abre via /?aviso=aisp-delegada (deep link do push).

import { useEffect, useState } from "react";
import { X, Download, Megaphone } from "lucide-react";

const IMAGE_URL = "/aisp-delegada-jul26.jpg";
const STORAGE_PREFIX = "aviso_aisp_delegada_v2_";
const AUTO_OPEN_DAYS = ["2026-07-25", "2026-07-26"];
const BUTTON_VISIBLE_UNTIL = "2026-07-31"; // botão no topo fica até o fim de 31/07

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function shouldAutoOpen() {
  return AUTO_OPEN_DAYS.includes(todayKey());
}
function isButtonVisible() {
  return todayKey() <= BUTTON_VISIBLE_UNTIL;
}

function wasDismissedToday() {
  try {
    return localStorage.getItem(STORAGE_PREFIX + todayKey()) === "1";
  } catch {
    return false;
  }
}

export function AvisoAispDelegadaModal() {
  const [open, setOpen] = useState(false);
  const [visibleButton, setVisibleButton] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isActiveToday()) return;
    setVisibleButton(true);

    const params = new URLSearchParams(window.location.search);
    const forced = params.get("aviso") === "aisp-delegada";
    if (forced) {
      params.delete("aviso");
      const q = params.toString();
      const url = window.location.pathname + (q ? `?${q}` : "") + window.location.hash;
      window.history.replaceState({}, "", url);
    }

    if (!forced && wasDismissedToday()) return;

    const t = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_PREFIX + todayKey(), "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(IMAGE_URL);
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
      window.open(IMAGE_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      {visibleButton && (
        <div className="px-5 pt-2">
          <button
            onClick={() => setOpen(true)}
            className="w-full flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left active:scale-[0.98] transition"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black">
              <Megaphone size={18} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">
                Aviso · Operação Delegada
              </p>
              <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
                Novos AISP — toque para ver
              </p>
            </div>
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Novos AISP da Operação Delegada"
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-card text-card-foreground shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              aria-label="Fechar"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur active:scale-95"
            >
              <X size={18} />
            </button>

            <div className="px-4 pt-4 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-500">
                Aviso · Operação Delegada
              </p>
              <h2 className="mt-1 text-base font-extrabold leading-tight">
                Novos AISP — confira os novos IDs e locais de revista
              </h2>
            </div>

            <div className="mt-3 bg-black overflow-auto flex-1">
              <img
                src={IMAGE_URL}
                alt="Lista de transmissão — Novos AISP da Operação Delegada, 4ª Cia do 7ºM"
                className="w-full h-auto"
                loading="eager"
              />
            </div>

            <div className="flex gap-2 p-4 shrink-0">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black active:scale-95"
              >
                <Download size={16} strokeWidth={2.5} />
                Baixar imagem
              </button>
              <button
                onClick={close}
                className="rounded-xl border border-border px-4 py-3 text-sm font-semibold active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
