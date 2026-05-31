import { toast } from "sonner";
import { isIntranetReachable } from "./check-vpn";
import { openAnyConnect } from "./open-anyconnect";

/**
 * Verifica se a intranet PMESP está acessível antes de abrir um link.
 * - Se acessível: executa `open()` imediatamente.
 * - Se não: mostra um toast COM LAYOUT EMPILHADO (sem espremer texto) com
 *   ações "Abrir AnyConnect" e "Abrir mesmo assim".
 */
export async function guardIntranet(open: () => void, label = "este link") {
  const ok = await isIntranetReachable(2500);
  if (ok) {
    open();
    return;
  }

  toast.custom(
    (id) => (
      <div className="w-full rounded-xl border-2 border-amber-500/60 bg-amber-50 p-3 shadow-lg dark:bg-amber-950/90">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700 dark:text-amber-300"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-tight text-amber-900 dark:text-amber-100">
              VPN AnyConnect desligada
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-amber-800/90 dark:text-amber-200/90">
              Sem conexão com a intranet, {label} pode não carregar. Conecte a VPN primeiro.
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              openAnyConnect();
              toast.dismiss(id);
            }}
            className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-[12px] font-bold text-white shadow-sm active:scale-[0.97] hover:bg-amber-700"
          >
            Abrir AnyConnect
          </button>
          <button
            onClick={() => {
              open();
              toast.dismiss(id);
            }}
            className="flex-1 rounded-lg border border-amber-600/40 bg-white px-3 py-2 text-[12px] font-semibold text-amber-900 active:scale-[0.97] hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-100"
          >
            Abrir mesmo assim
          </button>
        </div>
      </div>
    ),
    { duration: 10000 }
  );
}
