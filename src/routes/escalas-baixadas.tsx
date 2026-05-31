import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, FolderOpen, FileDown } from "lucide-react";
import { toast } from "sonner";

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
  head: () => ({ meta: [{ title: "Escalas baixadas — Atividade D" }] }),
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
  const [escalas, setEscalas] = useState<EscalaSalva[]>(() => lerLista());
  const [confirmDelete, setConfirmDelete] = useState<EscalaSalva | null>(null);

  useEffect(() => {
    salvarLista(escalas);
  }, [escalas]);

  const handleAbrir = async (e: EscalaSalva) => {
    if (e.hasPdf) {
      const blob = await lerPdfBlob(e.id);
      if (blob) {
        const objUrl = URL.createObjectURL(blob);
        window.open(objUrl, "_blank", "noopener,noreferrer");
        // Libera após algum tempo
        setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
        return;
      }
    }
    navigate({
      to: "/intranet",
      search: { url: e.url, titulo: e.titulo ?? `Escala ${e.id}` },
    });
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
        <h1
          className="flex-1 text-center text-[18px] font-bold"
          style={{ color: "#2e6b8a" }}
        >
          Escalas baixadas
        </h1>
        <span className="h-10 w-10" aria-hidden />
      </header>

      {escalas.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <FolderOpen size={60} style={{ color: "#5b7a8f" }} />
          <p
            className="mt-3 text-[18px] font-bold"
            style={{ color: "#2e6b8a" }}
          >
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
                <span
                  className="text-[16px] font-bold"
                  style={{ color: "#0f2535" }}
                >
                  ID {e.id}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: "#e8f0f8", color: "#2e6b8a" }}
                >
                  Intranet PMESP
                </span>
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

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "#2e6b8a" }}>
              Excluir escala baixada
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover a escala do ID {confirmDelete?.id}? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ background: "#E74C3C" }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
