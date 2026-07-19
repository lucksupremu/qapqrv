import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, BookmarkPlus } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type EventoPersonalizado,
  LEMBRETE_OPCOES,
  removeEvento,
  upsertEvento,
} from "@/lib/eventos-personalizados";
import {
  cancelForMarca,
  requestNotificationPermission,
  scheduleRemindersForMarca,
  getPermission,
} from "@/lib/notifications-adapter";
import { scheduleServerReminders, cancelServerReminders } from "@/lib/server-reminders";

const fieldClass =
  "w-full rounded-[12px] border-2 bg-[#ffffff] px-3 py-3 text-[15px] font-semibold outline-none transition focus:ring-2";
const fieldStyle = { borderColor: "#7C3AED", color: "#0f2535" } as const;

export type EventoLivreModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseDate?: Date | null;
  editing?: EventoPersonalizado | null;
  onChanged?: () => void;
};

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventoLivreModal({
  open,
  onOpenChange,
  baseDate,
  editing,
  onChanged,
}: EventoLivreModalProps) {
  const isEdit = !!editing;
  const [titulo, setTitulo] = useState("");
  const [dataLocal, setDataLocal] = useState("");
  const [observacao, setObservacao] = useState("");
  const [lembreteMin, setLembreteMin] = useState<number | null>(60);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitulo(editing.titulo);
      setDataLocal(toLocalInput(new Date(editing.data)));
      setObservacao(editing.observacao ?? "");
      setLembreteMin(editing.lembreteMin);
    } else {
      const d = baseDate ? new Date(baseDate) : new Date();
      d.setHours(8, 0, 0, 0);
      setTitulo("");
      setDataLocal(toLocalInput(d));
      setObservacao("");
      setLembreteMin(60);
    }
  }, [open, editing, baseDate]);

  const handleSave = async () => {
    const t = titulo.trim();
    if (!t) {
      toast.error("Informe um título para o evento.");
      return;
    }
    const d = new Date(dataLocal);
    if (Number.isNaN(d.getTime())) {
      toast.error("Data/hora inválida.");
      return;
    }

    const evt: EventoPersonalizado = {
      id: editing?.id ?? crypto.randomUUID(),
      titulo: t,
      data: d.toISOString(),
      observacao: observacao.trim() || undefined,
      lembreteMin,
      criado: editing?.criado ?? new Date().toISOString(),
    };

    upsertEvento(evt);

    // Agenda lembrete
    const marcaKey = `evento:${evt.id}`;
    if (lembreteMin === null) {
      cancelForMarca(marcaKey);
      void cancelServerReminders(marcaKey);
    } else {
      if (getPermission() !== "granted") {
        await requestNotificationPermission();
      }
      const when = new Date(d.getTime() - lembreteMin * 60 * 1000);
      const title = `Lembrete: ${evt.titulo}`;
      const body =
        (lembreteMin === 0
          ? "Agora"
          : lembreteMin < 60
            ? `Em ${lembreteMin} min`
            : lembreteMin < 1440
              ? `Em ${Math.round(lembreteMin / 60)} h`
              : "Amanhã") +
        ` — ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` +
        (evt.observacao ? ` · ${evt.observacao}` : "");
      scheduleRemindersForMarca(marcaKey, [when.toISOString()], () => ({ title, body }));
      void scheduleServerReminders(marcaKey, [
        { when_at: when.toISOString(), title, body, url: "/calendario", tag: marcaKey },
      ]);
    }

    toast.success(isEdit ? "Evento atualizado." : "Evento criado.");
    onChanged?.();
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!editing) return;
    cancelForMarca(`evento:${editing.id}`);
    removeEvento(editing.id);
    toast.success("Evento excluído.");
    onChanged?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[420px] gap-3 rounded-[20px] p-5"
        style={{ background: "var(--surface, #f4f8fc)" }}
      >
        <DialogTitle asChild>
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "#EDE9FE", color: "#7C3AED" }}
            >
              <BookmarkPlus size={18} />
            </span>
            <h2 className="text-[18px] font-bold" style={{ color: "#0f2535" }}>
              {isEdit ? "Editar evento" : "Novo evento"}
            </h2>
          </div>
        </DialogTitle>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] font-bold" style={{ color: "#5b7a8f" }}>
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Curso, Médico, Audiência"
              className={fieldClass}
              style={fieldStyle}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-bold" style={{ color: "#5b7a8f" }}>
              Data e hora
            </label>
            <input
              type="datetime-local"
              value={dataLocal}
              onChange={(e) => setDataLocal(e.target.value)}
              className={fieldClass}
              style={fieldStyle}
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-bold" style={{ color: "#5b7a8f" }}>
              Observação (opcional)
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              className={fieldClass}
              style={fieldStyle}
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-bold" style={{ color: "#5b7a8f" }}>
              Lembrete
            </label>
            <Select
              value={lembreteMin === null ? "null" : String(lembreteMin)}
              onValueChange={(v) => setLembreteMin(v === "null" ? null : Number(v))}
            >
              <SelectTrigger className={fieldClass} style={fieldStyle}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEMBRETE_OPCOES.map((opt) => (
                  <SelectItem
                    key={String(opt.value)}
                    value={opt.value === null ? "null" : String(opt.value)}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          {isEdit ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={14} /> Excluir
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full px-4 py-2 text-[13px] font-bold"
              style={{ background: "#e8f0f8", color: "#2e6b8a" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="rounded-full px-4 py-2 text-[13px] font-bold text-white"
              style={{ background: "#7C3AED" }}
            >
              Salvar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
