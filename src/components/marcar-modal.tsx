import { useEffect, useState } from "react";

import { toast } from "sonner";
import { z } from "zod";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Marca, TipoMarca } from "@/lib/marcas";

const tipoOptions: { value: TipoMarca; label: string }[] = [
  { value: "dejem", label: "Dejem" },
  { value: "delegada_capital", label: "Delegada Capital" },
  { value: "delegada_outras", label: "Outras Delegadas" },
];

const formSchema = z.object({
  tipo: z.enum(["dejem", "delegada_capital", "delegada_outras"], {
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
  initialDate?: string | null; // ISO; usado quando criando a partir do calendário
};

function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [delegadaArea, setDelegadaArea] = useState("");
  const [delegadaStartHour, setDelegadaStartHour] = useState("");
  const [delegadaBaseHourAmount, setDelegadaBaseHourAmount] = useState("");
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderAt, setReminderAt] = useState("");
  const [errors, setErrors] = useState<{ tipo?: string; data?: string }>({});

  // Reset / preenche ao abrir
  useEffect(() => {
    if (!open) return;
    if (initialMarca) {
      setTipo(initialMarca.tipo);
      setData(isoToLocalInput(initialMarca.data));
      setValor(initialMarca.valor ? String(initialMarca.valor) : "");
      setDelegadaArea(initialMarca.delegadaArea ?? "");
      setDelegadaStartHour(initialMarca.delegadaStartHour ?? "");
      setDelegadaBaseHourAmount(
        initialMarca.delegadaBaseHourAmount
          ? String(initialMarca.delegadaBaseHourAmount)
          : "",
      );
      setReminderOn(!!initialMarca.reminderAt);
      setReminderAt(
        initialMarca.reminderAt ? isoToLocalInput(initialMarca.reminderAt) : "",
      );
    } else {
      setTipo("");
      setData(initialDate ? isoToLocalInput(initialDate) : "");
      setValor("");
      setDelegadaArea("");
      setDelegadaStartHour("");
      setDelegadaBaseHourAmount("");
      setReminderOn(false);
      setReminderAt("");
    }
    setErrors({});
  }, [open, initialMarca, initialDate]);

  const showDelegadaFields =
    tipo === "delegada_capital" || tipo === "delegada_outras";

  const handleSave = () => {
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
    const baseHourNum =
      parseFloat(delegadaBaseHourAmount.replace(",", ".")) || 0;
    const isoData = new Date(data).toISOString();
    const isoReminder =
      reminderOn && reminderAt ? new Date(reminderAt).toISOString() : null;

    const marca: Marca = {
      id: initialMarca?.id ?? Date.now().toString(),
      tipo: parsed.data.tipo,
      data: isoData,
      valor: valorNum,
      delegadaArea: delegadaArea.trim().slice(0, 120),
      delegadaStartHour: delegadaStartHour.trim().slice(0, 10),
      delegadaBaseHourAmount: baseHourNum,
      reminderAt: isoReminder,
      criado: initialMarca?.criado ?? new Date().toISOString(),
    };

    onSave(marca);
    onOpenChange(false);

    toast.success(isEdit ? "Marca atualizada com sucesso!" : "Marca salva com sucesso!");
    if (isoReminder) {
      setTimeout(() => {
        toast.info(`Lembrete agendado para ${formatBRDate(isoReminder)}`);
      }, 350);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] gap-0 rounded-[20px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <DialogTitle
            className="text-[20px] font-bold"
            style={{ color: "#2e6b8a" }}
          >
            {isEdit ? "Editar marca" : "Nova marca"}
          </DialogTitle>
          <span className="h-9 w-9" aria-hidden />
        </div>


        {/* Form */}
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
              <p className="mt-1 text-[12px] font-semibold text-red-600">
                {errors.tipo}
              </p>
            )}
          </div>

          {/* Campos delegada (fade-in) */}
          {showDelegadaFields && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div>
                <label
                  className="mb-1 block text-[12px] font-bold uppercase tracking-wider"
                  style={{ color: "#2e6b8a" }}
                >
                  Área / Nome da delegada
                </label>
                <input
                  value={delegadaArea}
                  onChange={(e) => setDelegadaArea(e.target.value)}
                  maxLength={120}
                  className={fieldClass}
                  style={fieldStyle}
                  placeholder="Ex: 5º DP – Aclimação"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-[12px] font-bold uppercase tracking-wider"
                  style={{ color: "#2e6b8a" }}
                >
                  Horário de início (ex: 07:00)
                </label>
                <input
                  value={delegadaStartHour}
                  onChange={(e) => setDelegadaStartHour(e.target.value)}
                  maxLength={10}
                  className={fieldClass}
                  style={fieldStyle}
                  placeholder="07:00"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-[12px] font-bold uppercase tracking-wider"
                  style={{ color: "#2e6b8a" }}
                >
                  Valor base por hora (R$)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={delegadaBaseHourAmount}
                  onChange={(e) => setDelegadaBaseHourAmount(e.target.value)}
                  className={fieldClass}
                  style={fieldStyle}
                  placeholder="0,00"
                />
              </div>
            </div>
          )}

          {/* Data */}
          <div>
            <label
              className="mb-1 block text-[12px] font-bold uppercase tracking-wider"
              style={{ color: "#2e6b8a" }}
            >
              Data e hora da escala
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
              <p className="mt-1 text-[12px] font-semibold text-red-600">
                {errors.data}
              </p>
            )}
          </div>

          {/* Valor total */}
          <div>
            <label
              className="mb-1 block text-[12px] font-bold uppercase tracking-wider"
              style={{ color: "#2e6b8a" }}
            >
              Informe o valor
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

          {/* Lembrete */}
          <div
            className="flex items-center justify-between rounded-[12px] border-2 px-3 py-3"
            style={{ borderColor: "#2e6b8a" }}
          >
            <span
              className="text-[14px] font-bold"
              style={{ color: "#2e6b8a" }}
            >
              Agendar lembrete
            </span>
            <Switch checked={reminderOn} onCheckedChange={setReminderOn} />
          </div>
          {reminderOn && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label
                className="mb-1 block text-[12px] font-bold uppercase tracking-wider"
                style={{ color: "#2e6b8a" }}
              >
                Quando notificar?
              </label>
              <input
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
          )}
        </div>

        {/* Footer */}
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
            Salvar marca
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
