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

const HORAS = Array.from({ length: 24 }, (_, i) => i);

export function EscalaConfigModal({ open, onOpenChange, onSave, initial }: Props) {
  const [local, setLocal] = useState("");
  const [cor, setCor] = useState(ESCALA_CORES[0]!.value);
  const [trabalho, setTrabalho] = useState(12);
  const [folga, setFolga] = useState(24);
  const [horaInicio, setHoraInicio] = useState(7);
  const [alternada, setAlternada] = useState(false);
  const [trabalhoB, setTrabalhoB] = useState(12);
  const [folgaB, setFolgaB] = useState(48);
  const [horaInicioB, setHoraInicioB] = useState(19);
  const [dataInicial, setDataInicial] = useState<Date | undefined>(new Date());
  const [dataFinal, setDataFinal] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setLocal(initial.local);
      setCor(initial.cor);
      setTrabalho(initial.trabalho);
      setFolga(initial.folga);
      setHoraInicio(initial.horaInicio);
      setAlternada(!!initial.alternada);
      setTrabalhoB(initial.alternada?.trabalho ?? 12);
      setFolgaB(initial.alternada?.folga ?? 48);
      setHoraInicioB(initial.alternada?.horaInicio ?? 19);
      setDataInicial(fromISO(initial.dataInicial));
      setDataFinal(fromISO(initial.dataFinal));
    } else {
      setLocal("");
      setCor(ESCALA_CORES[0]!.value);
      setTrabalho(12);
      setFolga(24);
      setHoraInicio(7);
      setAlternada(false);
      setTrabalhoB(12);
      setFolgaB(48);
      setHoraInicioB(19);
      setDataInicial(new Date());
      const f = new Date();
      f.setMonth(f.getMonth() + 6);
      setDataFinal(f);
    }
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
      dataInicial: toISO(dataInicial),
      dataFinal: toISO(dataFinal),
      alternada: alternada
        ? { trabalho: trabalhoB, folga: folgaB, horaInicio: horaInicioB }
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
            {initial ? "Editar escala" : "Adicionar plantão"}
          </DialogTitle>
          <DialogDescription>
            Cadastre sua escala recorrente para visualizar no calendário.
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

          {/* Turno 1 */}
          <div className="space-y-1.5">
            <Label>Escala</Label>
            <div className="grid grid-cols-[1fr_auto_1fr_1.2fr] items-center gap-2">
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
              <Select
                value={String(horaInicio)}
                onValueChange={(v) => setHoraInicio(Number(v))}
              >
                <SelectTrigger aria-label="Hora de início">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HORAS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {String(h).padStart(2, "0")}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Trabalho × Folga (horas) · Hora de início
            </p>
          </div>

          {/* Alternada */}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={alternada}
              onCheckedChange={(v) => setAlternada(v === true)}
            />
            Escala alternada (segundo turno)
          </label>

          {alternada && (
            <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
              <Label>Turno alternado</Label>
              <div className="grid grid-cols-[1fr_auto_1fr_1.2fr] items-center gap-2">
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
                <Select
                  value={String(horaInicioB)}
                  onValueChange={(v) => setHoraInicioB(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HORAS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {String(h).padStart(2, "0")}h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
