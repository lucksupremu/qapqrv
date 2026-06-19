import { useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ESCALA_CORES,
  type EscalaRegra,
  newEscalaId,
} from "@/lib/escala-trabalho";
import {
  ESCALA_PRESETS,
  detectarPreset,
} from "@/lib/escala-presets";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (regra: EscalaRegra) => void;
  initial?: EscalaRegra | null;
};

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fromISO(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toHHMM(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseHHMM(s: string): { h: number; m: number } {
  const [hh, mm] = s.split(":").map((x) => Number(x));
  return {
    h: Number.isFinite(hh) ? Math.min(23, Math.max(0, hh)) : 0,
    m: Number.isFinite(mm) ? Math.min(59, Math.max(0, mm)) : 0,
  };
}

export function EscalaConfigModal({ open, onOpenChange, onSave, initial }: Props) {
  const [preset, setPreset] = useState<string>("12x24-12x48");
  const [local, setLocal] = useState("");
  const [cor, setCor] = useState(ESCALA_CORES[0]!.value);
  const [trabalho, setTrabalho] = useState(12);
  const [folga, setFolga] = useState(24);
  const [horaInicio, setHoraInicio] = useState(7);
  const [minutoInicio, setMinutoInicio] = useState(0);
  const [alternada, setAlternada] = useState(true);
  const [trabalhoB, setTrabalhoB] = useState(12);
  const [folgaB, setFolgaB] = useState(48);
  const [horaInicioB, setHoraInicioB] = useState(19);
  const [minutoInicioB, setMinutoInicioB] = useState(0);
  const [dataInicial, setDataInicial] = useState<Date | undefined>(new Date());
  const [dataFinal, setDataFinal] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });

  const presetAtual = ESCALA_PRESETS.find((p) => p.id === preset);
  const presetForcaAlternada = !!presetAtual?.alternada;

  const aplicarPreset = (id: string) => {
    setPreset(id);
    const p = ESCALA_PRESETS.find((x) => x.id === id);
    if (!p || p.id === "custom") return;
    setTrabalho(p.turno.trabalho);
    setFolga(p.turno.folga);
    setHoraInicio(p.turno.horaInicio);
    setMinutoInicio(p.turno.minutoInicio);
    if (p.alternada) {
      setAlternada(true);
      setTrabalhoB(p.alternada.trabalho);
      setFolgaB(p.alternada.folga);
      setHoraInicioB(p.alternada.horaInicio);
      setMinutoInicioB(p.alternada.minutoInicio);
    } else {
      setAlternada(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setLocal(initial.local);
      setCor(initial.cor);
      setTrabalho(initial.trabalho);
      setFolga(initial.folga);
      setHoraInicio(initial.horaInicio);
      setMinutoInicio(initial.minutoInicio ?? 0);
      setAlternada(!!initial.alternada);
      setTrabalhoB(initial.alternada?.trabalho ?? 12);
      setFolgaB(initial.alternada?.folga ?? 48);
      setHoraInicioB(initial.alternada?.horaInicio ?? 19);
      setMinutoInicioB(initial.alternada?.minutoInicio ?? 0);
      setDataInicial(fromISO(initial.dataInicial));
      setDataFinal(fromISO(initial.dataFinal));
      setPreset(
        detectarPreset(
          initial.trabalho,
          initial.folga,
          initial.horaInicio,
          initial.minutoInicio ?? 0,
          initial.alternada
            ? {
                trabalho: initial.alternada.trabalho,
                folga: initial.alternada.folga,
                horaInicio: initial.alternada.horaInicio,
                minutoInicio: initial.alternada.minutoInicio ?? 0,
              }
            : null,
        ),
      );
    } else {
      setLocal("");
      setCor(ESCALA_CORES[0]!.value);
      setDataInicial(new Date());
      const f = new Date();
      f.setMonth(f.getMonth() + 6);
      setDataFinal(f);
      // aplica o preset padrão (12x24/12x48)
      aplicarPreset("12x24-12x48");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);


  const handleSubmit = () => {
    const localOk = local.trim();
    if (!localOk) {
      toast.error("Informe o local de trabalho.");
      return;
    }
    if (!dataInicial || !dataFinal) {
      toast.error("Informe as datas inicial e final.");
      return;
    }
    if (dataFinal < dataInicial) {
      toast.error("Data final precisa ser igual ou posterior à inicial.");
      return;
    }
    const validNum = (n: number) => Number.isFinite(n) && n >= 1 && n <= 168;
    if (!validNum(trabalho) || !validNum(folga)) {
      toast.error("Horas devem estar entre 1 e 168.");
      return;
    }
    if (alternada && (!validNum(trabalhoB) || !validNum(folgaB))) {
      toast.error("Horas do turno alternado devem estar entre 1 e 168.");
      return;
    }

    const regra: EscalaRegra = {
      id: initial?.id ?? newEscalaId(),
      local: localOk.slice(0, 60),
      cor,
      trabalho,
      folga,
      horaInicio,
      minutoInicio,
      dataInicial: toISO(dataInicial),
      dataFinal: toISO(dataFinal),
      alternada: alternada
        ? {
            trabalho: trabalhoB,
            folga: folgaB,
            horaInicio: horaInicioB,
            minutoInicio: minutoInicioB,
          }
        : undefined,
    };
    onSave(regra);
    onOpenChange(false);
    toast.success(initial ? "Escala atualizada." : "Escala cadastrada.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? "Editar escala"
              : initialBaseDate
                ? "Adicionar plantão único"
                : "Adicionar plantão"}
          </DialogTitle>
          <DialogDescription>
            {initialBaseDate
              ? "Cadastre um plantão único para este dia."
              : "Cadastre sua escala recorrente para visualizar no calendário."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Local */}
          <div className="space-y-1.5">
            <Label htmlFor="local">Local de trabalho</Label>
            <Input
              id="local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Polícia Militar"
              maxLength={60}
            />
          </div>

          {/* Cor */}
          <div className="space-y-1.5">
            <Label>Cor no calendário</Label>
            <div className="flex flex-wrap gap-2">
              {ESCALA_CORES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCor(c.value)}
                  aria-label={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition",
                    cor === c.value
                      ? "scale-110 border-foreground"
                      : "border-transparent opacity-80",
                  )}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Modelo de escala (preset) */}
          <div className="space-y-1.5">
            <Label>Modelo de escala</Label>
            <Select value={preset} onValueChange={aplicarPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESCALA_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {presetAtual && (
              <p className="text-[11px] text-muted-foreground">
                {presetAtual.descricao}
              </p>
            )}
          </div>

          {/* Turno 1 */}
          <div className="space-y-1.5">
            <Label>
              {presetForcaAlternada ? "Turno diurno" : "Trabalho × Folga · Início"}
            </Label>
            <div className="grid grid-cols-[1fr_auto_1fr_1.4fr] items-center gap-2">
              <Input
                type="number"
                min={1}
                max={168}
                value={trabalho}
                onChange={(e) => setTrabalho(Number(e.target.value))}
                aria-label="Horas trabalhadas"
              />
              <span className="text-center font-bold text-muted-foreground">
                X
              </span>
              <Input
                type="number"
                min={1}
                max={168}
                value={folga}
                onChange={(e) => setFolga(Number(e.target.value))}
                aria-label="Horas de folga"
              />
              <Input
                type="time"
                step={60}
                value={toHHMM(horaInicio, minutoInicio)}
                onChange={(e) => {
                  const { h, m } = parseHHMM(e.target.value);
                  setHoraInicio(h);
                  setMinutoInicio(m);
                }}
                aria-label="Hora de início"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Trabalho × Folga (horas) · Hora de início (HH:MM)
            </p>
          </div>

          {/* Alternada — apenas em escalas personalizadas */}
          {!presetForcaAlternada ? (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={alternada}
                onCheckedChange={(v) => setAlternada(v === true)}
                className="mt-0.5"
              />
              <span className="flex-1">
                Plantão alterna dia/noite no mesmo local
                <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                  Marque quando o mesmo serviço intercala um turno diurno e um noturno
                  (ex.: 12x24 / 12x48).
                </span>
              </span>
            </label>
          ) : (
            <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
              O modelo selecionado já alterna dia e noite automaticamente.
            </p>
          )}


          {alternada && (
            <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
              <Label>{presetForcaAlternada ? "Turno noturno" : "Turno alternado"}</Label>
              <div className="grid grid-cols-[1fr_auto_1fr_1.4fr] items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={trabalhoB}
                  onChange={(e) => setTrabalhoB(Number(e.target.value))}
                />
                <span className="text-center font-bold text-muted-foreground">
                  X
                </span>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={folgaB}
                  onChange={(e) => setFolgaB(Number(e.target.value))}
                />
                <Input
                  type="time"
                  step={60}
                  value={toHHMM(horaInicioB, minutoInicioB)}
                  onChange={(e) => {
                    const { h, m } = parseHHMM(e.target.value);
                    setHoraInicioB(h);
                    setMinutoInicioB(m);
                  }}
                  aria-label="Hora de início alternada"
                />
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicial && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicial
                      ? format(dataInicial, "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicial}
                    onSelect={setDataInicial}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Data final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFinal && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFinal
                      ? format(dataFinal, "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFinal}
                    onSelect={setDataFinal}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {initial ? "Salvar alterações" : "Salvar escala"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
