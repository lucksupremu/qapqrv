import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, FolderOpen } from "lucide-react";
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

type EscalaSalva = {
  id: string;
  url: string;
  titulo?: string;
  dataSalva?: string;
  savedAt?: string; // compat com /intranet legado
};

export const Route = createFileRoute("/escalas-baixadas")({
  head: () => ({ meta: [{ title: "Escalas baixadas — Atividade D" }] }),
  component: DownloadedReportsScreen,
});

const STORAGE_KEY = "escalas_baixadas";

function loadEscalas(): EscalaSalva[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EscalaSalva[]) : [];
  } catch {
    return [];
  }
}

function saveEscalas(list: EscalaSalva[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

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

function DownloadedReportsScreen() {
  const navigate = useNavigate();
  const [escalas, setEscalas] = useState<EscalaSalva[]>(() => loadEscalas());
  const [confirmDelete, setConfirmDelete] = useState<EscalaSalva | null>(null);

  useEffect(() => {
    saveEscalas(escalas);
  }, [escalas]);

  const handleAbrir = (e: EscalaSalva) => {
    navigate({
      to: "/intranet",
      search: { url: e.url, titulo: e.titulo ?? `Escala ${e.id}` },
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
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
          style={{ background: "#1e1e3a", color: "#4f46e5" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="flex-1 text-center text-[18px] font-bold"
          style={{ color: "#4f46e5" }}
        >
          Escalas baixadas
        </h1>
        <span className="h-10 w-10" aria-hidden />
      </header>

      {escalas.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <FolderOpen size={60} style={{ color: "#8b8db5" }} />
          <p
            className="mt-3 text-[18px] font-bold"
            style={{ color: "#4f46e5" }}
          >
            Nenhuma escala baixada
          </p>
          <p className="mt-1 text-[14px]" style={{ color: "#8b8db5" }}>
            As escalas que você consultar aparecerão aqui
          </p>
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {escalas.map((e) => (
            <li
              key={e.id}
              className="mx-2 rounded-[16px] bg-[#141432] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[16px] font-bold"
                  style={{ color: "#e8eaf6" }}
                >
                  ID {e.id}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: "#1e1e3a", color: "#4f46e5" }}
                >
                  Intranet PMESP
                </span>
              </div>
              <p className="mt-1 text-[13px]" style={{ color: "#8b8db5" }}>
                Salvo em {formatBR(e.dataSalva ?? e.savedAt)}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleAbrir(e)}
                  className="rounded-[10px] px-5 py-2 text-[13px] font-bold text-white"
                  style={{ background: "#4f46e5" }}
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
            <AlertDialogTitle style={{ color: "#4f46e5" }}>
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
