import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useIsNative } from "@/hooks/use-is-native";

const KEY = "browser_warning_dismissed_v1";

export function BrowserWarningModal() {
  const native = useIsNative();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || native) return;
    try {
      if (!window.localStorage.getItem(KEY)) {
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [native]);

  if (!open) return null;

  const close = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <button
          aria-label="Fechar"
          onClick={close}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100"
        >
          <X size={18} />
        </button>
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "#fef3c7", color: "#b45309" }}
        >
          <AlertTriangle size={28} />
        </div>
        <h2 className="mt-4 text-center text-[18px] font-bold" style={{ color: "#2e6b8a" }}>
          Aviso de compatibilidade
        </h2>
        <p className="mt-2 text-center text-[14px] leading-relaxed" style={{ color: "#334155" }}>
          O navegador <strong>Chrome</strong> pode bloquear alguns acessos a recursos da intranet
          PMESP. Caso encontre erros, tente abrir em outro navegador (ex.: <strong>Firefox</strong>{" "}
          ou <strong>Edge</strong>).
        </p>
        <button
          onClick={close}
          className="mt-5 w-full rounded-xl py-3 font-bold text-white"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
