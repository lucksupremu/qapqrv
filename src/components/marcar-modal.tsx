import { useEffect, useState } from "react";

import { toast } from "sonner";
import { z } from "zod";
import { Plus, X, Bell } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Marca, TipoMarca } from "@/lib/marcas";
import { TIPO_LABEL_SHORT } from "@/lib/marcas";
import {
  requestNotificationPermission,
  scheduleRemindersForMarca,
  getPermission,
} from "@/lib/notifications-adapter";
import { buildAutoReminders, isoToLocalInput } from "@/lib/auto-reminders";

const tipoOptions: { value: TipoMarca; label: string }[] = [
  { value: "dejem", label: "Dejem" },
  { value: "delegada", label: "Delegada" },
];

const formSchema = z.object({
  tipo: z.enum(["dejem", "delegada"], {
    message: "Selecione o tipo de escala",
  }),
  data: z.string().min(1, { message: "Informe a data e hora da escala" }),
});

const fieldClass =
  "w-full rounded-[12px] border-2 bg-[#ffffff] px-3 py-3 text-[15px] font-semibold outline-none transition focus:ring-2";
const fieldStyle = { borderColor: "#2e6b8a", color: "#0f2535" } as const;

function formatBRDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
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

export type MarcarModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (marca: Marca) => void;
  initialMarca?: Marca | null;
  initialDate?: string | null;
};

function defaultRemindersForDate(dataLocal: string): string[] {
  if (!dataLocal) return [];
  const d = new Date(dataLocal);
  if (Number.isNaN(d.getTime())) return [];
  return buildAutoReminders(d.toISOString()).map(isoToLocalInput);
}

export function MarcarModal({
  open,
  onOpenChange,
  onSave,
  initialMarca,
  initialDate,
}: MarcarModalProps) {
  const isEdit = !!initialMarca;
  const [tipo, setTipo] = useState<TipoMarca | "">("");
  const [data, setData] = useState("");
  const [valor, setValor] = useState("");
  const [reminders, setReminders] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ tipo?: string; data?: string }>({});
  const [perm, setPerm] = useState<NotificationPermission>("default");
  

  useEffect(() => {
    if (!open) return;
    setPerm(getPermission());
    if (initialMarca) {
      const t =
        initialMarca.tipo === "delegada_capital" ||
        initialMarca.tipo === "delegada_outras"
          ? "delegada"
          : initialMarca.tipo;
      setTipo(t);
      setData(isoToLocalInput(initialMarca.data));
      setValor(initialMarca.valor ? String(initialMarca.valor) : "");
      const r =
        initialMarca.reminders && initialMarca.reminders.length > 0
          ? initialMarca.reminders.map(isoToLocalInput)
          : initialMarca.reminderAt
            ? [isoToLocalInput(initialMarca.reminderAt)]
            : [];
      setReminders(r);
    } else {
      setTipo("");
      const startLocal = initialDate ? isoToLocalInput(initialDate) : "";
      setData(startLocal);
      setValor("");
      setReminders(startLocal ? defaultRemindersForDate(startLocal) : []);
    }
    setErrors({});
  }, [open, initialMarca, initialDate]);

  // Mantém os lembretes automáticos em sincronia ao trocar a data (apenas em criação).
  useEffect(() => {
    if (isEdit) return;
    if (!data) return;
    setReminders(defaultRemindersForDate(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleAddReminder = () => {
    setReminders((prev) => [...prev, ""]);
  };

  const handleRemoveReminder = (idx: number) => {
    setReminders((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateReminder = (idx: number, v: string) => {
    setReminders((prev) => prev.map((r, i) => (i === idx ? v : r)));
  };

  const handleEnableNotifications = async () => {
    const p = await requestNotificationPermission();
    setPerm(p);
    if (p === "granted") toast.success("Notificações ativadas!");
    else if (p === "denied") toast.error("Permissão negada. Ative nas configurações do navegador.");
  };

  const handleSave = async () => {
    const parsed = formSchema.safeParse({ tipo, data });
    if (!parsed.success) {
      const errs: { tipo?: string; data?: string } = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as "tipo" | "data";
        errs[path] = issue.message;
      }
      setErrors(errs);
      return;
    }

    const valorNum = parseFloat(valor.replace(",", ".")) || 0;
    const isoData = new Date(data).toISOString();
    const isoReminders = reminders
      .filter((r) => !!r)
      .map((r) => new Date(r).toISOString());

    const marca: Marca = {
      id: initialMarca?.id ?? Date.now().toString(),
      tipo: parsed.data.tipo,
      data: isoData,
      valor: valorNum,
      reminders: isoReminders,
      reminderAt: isoReminders[0] ?? null,
      criado: initialMarca?.criado ?? new Date().toISOString(),
    };

    onSave(marca);

    const tipoLabel = TIPO_LABEL_SHORT[marca.tipo] ?? "Escala";
    const buildBody = (whenISO: string) =>
      `Escala em ${formatBRDate(marca.data)}${
        marca.valor > 0
          ? ` · ${marca.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
          : ""
      }\n(Aviso de ${formatBRDate(whenISO)})`;

    // Agendar local (web + nativo). Pede permissão silenciosamente se ainda não decidida.
    if (isoReminders.length > 0) {
      if (getPermission() === "default") {
        await requestNotificationPermission();
      }
      scheduleRemindersForMarca(marca.id, isoReminders, (whenISO) => ({
        title: `Lembrete — ${tipoLabel}`,
        body: buildBody(whenISO),
      }));
    } else {
      scheduleRemindersForMarca(marca.id, [], () => ({ title: "", body: "" }));
    }

    // Espelhar no servidor (push remoto programado — redundância para quem ativou web push).
    try {
      await schedulePushesForMarca({
        deviceId: getDeviceId(),
        marcaId: marca.id,
        reminders: isoReminders.map((sendAt) => ({
          title: `Lembrete — ${tipoLabel}`,
          body: buildBody(sendAt),
          sendAt,
        })),
      });
    } catch (e) {
      // Falha silenciosa: notificação local segue funcionando
      console.warn("[marcar] push remoto não agendado", e);
    }

    onOpenChange(false);
    toast.success(isEdit ? "Marca atualizada!" : "Marca salva!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] gap-0 rounded-[20px] p-0">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <DialogTitle className="text-[20px] font-bold" style={{ color: "#2e6b8a" }}>
            {isEdit ? "Editar marca" : "Nova marca"}
          </DialogTitle>
          <span className="h-9 w-9" aria-hidden />
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {/* Tipo */}
          <div>
            <label
              className="mb-1 block text-[12px] font-bold uppercase tracking-wider"
              style={{ color: "#2e6b8a" }}
            >
              Tipo de escala
            </label>
            <Select
              value={tipo}
              onValueChange={(v) => {
                setTipo(v as TipoMarca);
                setErrors((e) => ({ ...e, tipo: undefined }));
              }}
            >
              <SelectTrigger
                className="h-[52px] w-full rounded-[12px] border-2 bg-[#ffffff] px-3 text-[15px] font-semibold"
                style={fieldStyle}
              >
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo && (
              <p className="mt-1 text-[12px] font-semibold text-red-600">{errors.tipo}</p>
            )}
          </div>

          {/* Data */}
          <div>
            <label
              className="mb-1 block text-[12px] font-bold uppercase tracking-wider"
              style={{ color: "#2e6b8a" }}
            >
              Dia e hora
            </label>
            <input
              type="datetime-local"
              value={data}
              onChange={(e) => {
                setData(e.target.value);
                setErrors((er) => ({ ...er, data: undefined }));
              }}
              className={fieldClass}
              style={fieldStyle}
            />
            {errors.data && (
              <p className="mt-1 text-[12px] font-semibold text-red-600">{errors.data}</p>
            )}
          </div>

          {/* Valor */}
          <div>
            <label
              className="mb-1 block text-[12px] font-bold uppercase tracking-wider"
              style={{ color: "#2e6b8a" }}
            >
              Valor (R$)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className={fieldClass}
              style={fieldStyle}
            />
          </div>

          {/* Lembretes */}
          <div className="rounded-[12px] border-2 p-3" style={{ borderColor: "#2e6b8a" }}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} style={{ color: "#2e6b8a" }} />
                <span className="text-[13px] font-bold" style={{ color: "#2e6b8a" }}>
                  Lembretes
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddReminder}
                className="flex items-center gap-1 rounded-[8px] px-2 py-1 text-[12px] font-bold"
                style={{ background: "#e8f0f8", color: "#2e6b8a" }}
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>

            {reminders.length === 0 && (
              <p className="text-[12px]" style={{ color: "#5b7a8f" }}>
                Nenhum lembrete. O padrão é 1 dia antes às 09:00.
              </p>
            )}

            <div className="space-y-2">
              {reminders.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={r}
                    onChange={(e) => handleUpdateReminder(idx, e.target.value)}
                    className="flex-1 rounded-[10px] border-2 bg-white px-2 py-2 text-[13px] font-semibold"
                    style={fieldStyle}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveReminder(idx)}
                    className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                    style={{ background: "#fee2e2", color: "#c81d1d" }}
                    aria-label="Remover lembrete"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {perm !== "granted" && reminders.length > 0 && (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="mt-3 w-full rounded-[10px] px-3 py-2 text-[12px] font-bold text-white"
                style={{ background: "#2e6b8a" }}
              >
                {perm === "denied"
                  ? "Notificações bloqueadas — ativar no navegador"
                  : "Ativar notificações push"}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t border-[#e8f0f8] px-5 py-4">
          <button
            onClick={() => onOpenChange(false)}
            className="h-[48px] flex-1 rounded-[14px] border-2 bg-[#ffffff] font-bold active:scale-[0.99]"
            style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="h-[48px] flex-1 rounded-[14px] font-bold text-white active:scale-[0.99]"
            style={{ background: "#2e6b8a" }}
          >
            Salvar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
