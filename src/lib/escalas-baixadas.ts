// Gerenciamento das escalas baixadas (lista + cache de PDFs em IndexedDB).
import { get, set, del } from "idb-keyval";

export type EscalaSalva = {
  id: string;
  url: string;
  titulo?: string;
  dataSalva?: string;
  savedAt?: string;
  hasPdf?: boolean;
  pdfSize?: number;
  pdfMime?: string;
  /** Caminho relativo dentro de Directory.Data (apenas APK). */
  localPath?: string;
};

const STORAGE_KEY = "escalas_baixadas";
const PDF_PREFIX = "escala_pdf:";

export function lerLista(): EscalaSalva[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EscalaSalva[]) : [];
  } catch {
    return [];
  }
}

export function salvarLista(list: EscalaSalva[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function upsertEscala(item: EscalaSalva): EscalaSalva[] {
  const atual = lerLista();
  const semDup = atual.filter((x) => x.id !== item.id);
  const next = [item, ...semDup].slice(0, 100);
  salvarLista(next);
  return next;
}

export function marcarComPdf(id: string, size: number, mime: string) {
  const atual = lerLista();
  const next = atual.map((x) =>
    x.id === id ? { ...x, hasPdf: true, pdfSize: size, pdfMime: mime } : x,
  );
  salvarLista(next);
}

export async function salvarPdfBlob(id: string, blob: Blob) {
  await set(PDF_PREFIX + id, blob);
  marcarComPdf(id, blob.size, blob.type || "application/pdf");
}

export async function lerPdfBlob(id: string): Promise<Blob | undefined> {
  return (await get<Blob>(PDF_PREFIX + id)) ?? undefined;
}

export async function removerEscala(id: string) {
  const atual = lerLista();
  salvarLista(atual.filter((x) => x.id !== id));
  try {
    await del(PDF_PREFIX + id);
  } catch {
    /* ignore */
  }
}

/**
 * Baixa o PDF da intranet em segundo plano. Requer VPN ativa.
 * Em navegador, o servidor da PMESP geralmente não envia CORS — nesse caso
 * a Promise rejeita silenciosamente e a entrada permanece sem PDF anexado
 * (ainda assim aparece na lista, abrindo via intranet ao clicar).
 */
export async function baixarPdfEmBackground(id: string, url: string): Promise<boolean> {
  try {
    const resp = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (!resp.ok) return false;
    const blob = await resp.blob();
    if (!blob || blob.size === 0) return false;
    await salvarPdfBlob(id, blob);
    return true;
  } catch {
    return false;
  }
}
