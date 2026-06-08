// Revalidação silenciosa das últimas escalas baixadas.
// Quando o app abre em modo nativo + VPN ativa, refaz o download das
// 5 escalas mais recentes e avisa se o PDF mudou de tamanho (provável retificação).
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { isVpnActive, isNativeVpnAvailable } from "@/lib/vpn-status";
import { lerLista, salvarLista, type EscalaSalva } from "@/lib/escalas-baixadas";

const MAX_REVALIDATE = 5;
const KEY_LAST_RUN = "escalas:last_revalidate";
const MIN_INTERVAL_MS = 30 * 60 * 1000; // 30 min

function shouldRun(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  if (!isNativeVpnAvailable()) return false;
  try {
    const raw = window.localStorage.getItem(KEY_LAST_RUN);
    if (!raw) return true;
    return Date.now() - Number(raw) >= MIN_INTERVAL_MS;
  } catch {
    return true;
  }
}

function markRun() {
  try {
    window.localStorage.setItem(KEY_LAST_RUN, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export async function revalidateRecentEscalas(): Promise<void> {
  if (!shouldRun()) return;
  const vpn = await isVpnActive();
  if (vpn !== true) return;

  markRun();

  const lista = lerLista();
  // Apenas escalas que já têm PDF baixado.
  const alvo = lista
    .filter((e) => e.hasPdf || e.localPath)
    .slice(0, MAX_REVALIDATE);
  if (alvo.length === 0) return;

  let { InAppWebView } = await import("@/lib/in-app-webview");
  const atualizadas: EscalaSalva[] = [];

  for (const e of alvo) {
    try {
      const r = await InAppWebView.downloadPdf({ id: e.id, url: e.url });
      if (e.pdfSize && r.size && Math.abs(r.size - e.pdfSize) > 32) {
        atualizadas.push({
          ...e,
          pdfSize: r.size,
          pdfMime: r.mime || "application/pdf",
          localPath: r.path,
          dataSalva: new Date().toISOString(),
        });
      } else {
        // Atualiza o path caso o storage tenha sido limpo.
        atualizadas.push({ ...e, localPath: r.path, pdfSize: r.size });
      }
    } catch {
      // Sem cookies/VPN: ignora silenciosamente.
    }
  }

  const mudaramSig = atualizadas.filter((u) => {
    const orig = lista.find((x) => x.id === u.id);
    return orig && orig.pdfSize !== u.pdfSize;
  });

  if (atualizadas.length > 0) {
    const merged = lista.map((x) => atualizadas.find((u) => u.id === x.id) ?? x);
    salvarLista(merged);
  }

  if (mudaramSig.length > 0) {
    const ids = mudaramSig.map((m) => `#${m.id}`).join(", ");
    toast.info(
      mudaramSig.length === 1
        ? `Escala ${ids} foi atualizada na intranet.`
        : `${mudaramSig.length} escalas foram atualizadas: ${ids}`,
      { duration: 8000 },
    );
  }
}
