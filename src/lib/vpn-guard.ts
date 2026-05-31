import { toast } from "sonner";
import { isIntranetReachable } from "./check-vpn";
import { openAnyConnect } from "./open-anyconnect";

/**
 * Verifica se a intranet PMESP está acessível antes de abrir um link.
 * - Se acessível: executa `open()` imediatamente.
 * - Se não: mostra um toast com ação "Abrir AnyConnect" e permite
 *   "Abrir mesmo assim". Não dispara erro nem bloqueia o app.
 */
export async function guardIntranet(open: () => void, label = "link da intranet") {
  // Otimismo: dispara a verificação, mas com timeout curto.
  const ok = await isIntranetReachable(2500);
  if (ok) {
    open();
    return;
  }

  toast.warning("VPN AnyConnect parece desconectada", {
    description: `Não conseguimos acessar a intranet para abrir ${label}.`,
    duration: 8000,
    action: {
      label: "Abrir AnyConnect",
      onClick: () => openAnyConnect(),
    },
    cancel: {
      label: "Tentar mesmo assim",
      onClick: () => open(),
    },
  });
}
