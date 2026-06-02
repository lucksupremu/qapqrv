import { useEffect } from "react";
import { Globe, Smartphone, ExternalLink, X } from "lucide-react";
import type { AbrirOpts } from "@/lib/in-app-browser";

type Modo = NonNullable<AbrirOpts["modo"]>;

type Props = {
  open: boolean;
  url: string | null;
  titulo?: string;
  isNative: boolean;
  onClose: () => void;
  onPick: (modo: Modo) => void;
};

export function BrowserPickerModal({
  open,
  url,
  titulo,
  isNative,
  onClose,
  onPick,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !url) return null;

  const opcoes: Array<{
    modo: Modo;
    label: string;
    desc: string;
    icon: typeof Globe;
  }> = isNative
    ? [
        {
          modo: "webview",
          label: "Navegador interno do app",
          desc: "Abre dentro do QAP, QRV! (WebView).",
          icon: Smartphone,
        },
        {
          modo: "system",
          label: "Chrome (Custom Tabs)",
          desc: "Abre no Chrome do aparelho, mantendo sua sessão.",
          icon: Globe,
        },
        {
          modo: "external",
          label: "Escolher outro navegador",
          desc: "Abre fora do app — Android mostra o seletor de navegador.",
          icon: ExternalLink,
        },
      ]
    : [
        {
          modo: "system",
          label: "Abrir nesta janela",
          desc: "Abre em uma nova aba do navegador atual.",
          icon: Globe,
        },
        {
          modo: "external",
          label: "Abrir em outro navegador",
          desc: "Copia o link para você colar em outro navegador.",
          icon: ExternalLink,
        },
      ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Abrir {titulo ?? "link"}
            </h3>
            <p className="mt-1 break-all text-[11px] text-slate-500 dark:text-slate-400">
              {url}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
          Escolha como deseja abrir:
        </p>

        <div className="flex flex-col gap-2">
          {opcoes.map(({ modo, label, desc, icon: Icon }) => (
            <button
              key={modo}
              onClick={() => onPick(modo)}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500 dark:hover:bg-slate-700"
            >
              <div className="mt-0.5 rounded-lg bg-white p-2 shadow-sm dark:bg-slate-900">
                <Icon size={18} className="text-slate-700 dark:text-slate-200" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
