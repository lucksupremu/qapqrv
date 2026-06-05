import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, FolderOpen, FileDown, Smartphone } from "lucide-react";
import { useIsNative } from "@/hooks/use-is-native";
import { toast } from "sonner";
import { openInAppBrowser } from "@/lib/in-app-browser";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  type EscalaSalva,
  lerLista,
  salvarLista,
  removerEscala,
  lerPdfBlob,
} from "@/lib/escalas-baixadas";

export const Route = createFileRoute("/escalas-baixadas")({
  head: () => ({ meta: [{ title: "Escalas baixadas — QAP, QRV!" }] }),
  component: DownloadedReportsScreen,
});

function formatBR(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatBytes(n?: number) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function DownloadedReportsScreen() {
  const navigate = useNavigate();
  const native = useIsNative();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Inicia vazio para casar com o SSR; popula via useEffect após hidratar.
  const [escalas, setEscalas] = useState<EscalaSalva[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<EscalaSalva | null>(null);

  useEffect(() => {
    setEscalas(lerLista());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    salvarLista(escalas);
  }, [escalas, hydrated]);

  // Na web esse recurso não funciona (CORS da intranet impede salvar o PDF),
  // então mostramos uma tela orientando o uso do APK.
  if (mounted && !native) {
    return (
      <div className="min-h-screen pb-10" style={{ background: "var(--bg)" }}>
        <header className="flex items-center gap-2 px-3 py-3">
          <button
            aria-label="Voltar"
            onClick={() => navigate({ to: "/" })}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "#e8f0f8", color: "#2e6b8a" }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex-1 text-center text-[18px] font-bold" style={{ color: "#2e6b8a" }}>
            Escalas baixadas
          </h1>
          <span className="h-10 w-10" aria-hidden />
        </header>
        <div
          className="mx-4 mt-6 rounded-2xl border bg-white p-6 text-center"
          style={{ borderColor: "var(--border-soft)", boxShadow: "var(--shadow-card)" }}
        >
          <Smartphone size={56} className="mx-auto" style={{ color: "#2e6b8a" }} />
          <h2 className="mt-3 text-[18px] font-bold" style={{ color: "var(--text-dark)" }}>
            Disponível apenas no aplicativo
          </h2>
          <p className="mt-2 text-[14px]" style={{ color: "var(--muted-fg)" }}>
            Salvar escalas offline depende de acesso direto à intranet da PMESP, o que o navegador
            não permite (bloqueio de CORS). Use o app instalado (APK) para baixar e abrir os PDFs
            sem internet.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-5 rounded-xl px-5 py-3 font-bold text-white"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const handleAbrir = (e: EscalaSalva) => {
    // Tem PDF salvo (web ou APK): abre no visualizador offline embutido.
    if (e.hasPdf || e.localPath) {
      void navigate({ to: "/escala-viewer/$id", params: { id: e.id } });
      return;
    }
    // Sem PDF salvo: tenta a intranet (requer VPN).
    void openInAppBrowser(e.url, { titulo: e.titulo ?? `Escala ${e.id}` });
  };


  const handleDelete = async () => {
    if (!confirmDelete) return;
    await removerEscala(confirmDelete.id);
    setEscalas((prev) => prev.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
    toast.success("Escala removida.");
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--bg)" }}>
      <header className="flex items-center gap-2 px-3 py-3">
        <button
          aria-label="Voltar"
          onClick={() => navigate({ to: "/" })}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-center text-[18px] font-bold" style={{ color: "#2e6b8a" }}>
          Escalas baixadas
        </h1>
        <span className="h-10 w-10" aria-hidden />
      </header>

      {escalas.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <FolderOpen size={60} style={{ color: "#5b7a8f" }} />
          <p className="mt-3 text-[18px] font-bold" style={{ color: "#2e6b8a" }}>
            Nenhuma escala baixada
          </p>
          <p className="mt-1 text-[14px]" style={{ color: "#5b7a8f" }}>
            As escalas que você consultar aparecerão aqui
          </p>
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {escalas.map((e) => (
            <li
              key={e.id}
              className="mx-2 rounded-[16px] bg-[#ffffff] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[16px] font-bold" style={{ color: "#0f2535" }}>
                  ID {e.id}
                </span>
                {e.hasPdf ? (
                  <span
                    className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ background: "#dcfce7", color: "#166534" }}
                  >
                    <FileDown size={12} />
                    PDF {formatBytes(e.pdfSize)}
                  </span>
                ) : (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ background: "#e8f0f8", color: "#2e6b8a" }}
                  >
                    Intranet PMESP
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px]" style={{ color: "#5b7a8f" }}>
                Salvo em {formatBR(e.dataSalva ?? e.savedAt)}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleAbrir(e)}
                  className="rounded-[10px] px-5 py-2 text-[13px] font-bold text-white"
                  style={{ background: "#2e6b8a" }}
                >
                  Abrir
                </button>
                <button
                  onClick={() => setConfirmDelete(e)}
                  className="px-3 py-2 text-[13px] font-bold"
                  style={{ color: "#E74C3C" }}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "#2e6b8a" }}>Excluir escala baixada</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover a escala do ID {confirmDelete?.id}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} style={{ background: "#E74C3C" }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
