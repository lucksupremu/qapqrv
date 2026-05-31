// Download em segundo plano da escala — totalmente isolado da navegação.
// Web: tenta fetch (geralmente falha por CORS, sem ruído).
// APK (Capacitor): usa CapacitorHttp (bypassa CORS) + Filesystem.
//
// Para ativar persistência no APK:
//   bun add @capacitor/filesystem
//   npx cap sync
import { toast } from "sonner";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import {
  upsertEscala,
  marcarComPdf,
  salvarPdfBlob,
  lerLista,
  salvarLista,
} from "./escalas-baixadas";

const emAndamento = new Set<string>();

function isNative() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function baixarNoNativo(id: string, url: string): Promise<boolean> {
  try {
    const resp = await CapacitorHttp.request({
      method: "GET",
      url,
      responseType: "blob",
    });
    if (resp.status < 200 || resp.status >= 300) return false;
    // CapacitorHttp retorna base64 quando responseType=blob
    const data: string = resp.data;
    if (!data || typeof data !== "string") return false;

    let Filesystem: any;
    let Directory: any;
    try {
      // @ts-ignore — plugin opcional, instalar com: bun add @capacitor/filesystem
      const mod = await import(/* @vite-ignore */ "@capacitor/filesystem");
      Filesystem = mod.Filesystem;
      Directory = mod.Directory;
    } catch {
      // Plugin não instalado — degrada silenciosamente.
      return false;
    }

    const path = `escalas/${id}.pdf`;
    await Filesystem.writeFile({
      path,
      data,
      directory: Directory.Data,
      recursive: true,
    });

    const sizeApprox = Math.floor((data.length * 3) / 4);
    const lista = lerLista();
    const next = lista.map((x) =>
      x.id === id
        ? { ...x, hasPdf: true, pdfSize: sizeApprox, pdfMime: "application/pdf", localPath: path }
        : x,
    );
    salvarLista(next);
    return true;
  } catch (e) {
    console.warn("[escala-download] nativo falhou", e);
    return false;
  }
}

async function baixarNoWeb(id: string, url: string): Promise<boolean> {
  try {
    const resp = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      mode: "cors",
    });
    if (!resp.ok) return false;
    const blob = await resp.blob();
    if (!blob || blob.size === 0) return false;
    await salvarPdfBlob(id, blob);
    marcarComPdf(id, blob.size, blob.type || "application/pdf");
    return true;
  } catch {
    // CORS / rede — silencioso. A escala continua na lista, abrindo via intranet.
    return false;
  }
}

/**
 * Salva o registro da escala e tenta baixar o PDF em segundo plano.
 * Nunca lança. Nunca interfere na aba aberta pelo usuário.
 */
export async function salvarEscalaEmBackground(id: string, url: string): Promise<void> {
  if (!id) return;
  if (emAndamento.has(id)) return;
  emAndamento.add(id);

  try {
    upsertEscala({
      id,
      url,
      titulo: `Escala ${id}`,
      dataSalva: new Date().toISOString(),
    });

    const ok = isNative()
      ? await baixarNoNativo(id, url)
      : await baixarNoWeb(id, url);

    if (ok) {
      toast.success(`PDF da escala ${id} salvo offline.`);
    }
  } catch (e) {
    console.warn("[escala-download] falhou", e);
  } finally {
    emAndamento.delete(id);
  }
}
