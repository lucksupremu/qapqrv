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

  toast.warning("VPN AnyConnect está desligada", {
    description: `Sem conexão com a intranet, ${label} não vai carregar. Conecte a VPN primeiro.`,
    duration: 10000,
    action: {
      label: "Abrir AnyConnect",
      onClick: () => openAnyConnect(),
    },
    cancel: {
      label: "Abrir mesmo assim",
      onClick: () => open(),
    },
  });
}
