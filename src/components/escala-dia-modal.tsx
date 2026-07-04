// Modal simplificado para adicionar um plantão único num dia específico.
// Inspirado no antigo modal de evento — só os campos essenciais.

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
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
  COR_DIURNO,
  COR_NOTURNO,
  classificarPeriodo,
  corDoTurno,
  type EscalaRegra,
  newEscalaId,
} from "@/lib/escala-trabalho";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  baseDate: Date | null;
  onSave: (regra: EscalaRegra) => void;
};

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

export function EscalaDiaModal({ open, onOpenChange, baseDate, onSave }: Props) {
  const [local, setLocal] = useState("");
  const [horaInicio, setHoraInicio] = useState(7);
  const [minutoInicio, setMinutoInicio] = useState(0);
  const [duracao, setDuracao] = useState(12);

  useEffect(() => {
    if (!open) return;
    setLocal("");
    setHoraInicio(7);
    setMinutoInicio(0);
    setDuracao(12);
  }, [open]);

  const handleSubmit = () => {
    const localOk = local.trim();
    if (!localOk) {
      toast.error("Informe o local do plantão.");
      return;
    }
    if (!baseDate) {
      toast.error("Dia inválido.");
      return;
    }
    if (!Number.isFinite(duracao) || duracao < 1 || duracao > 24) {
      toast.error("Duração deve estar entre 1 e 24 horas.");
      return;
    }
    const iso = toISO(baseDate);
    const regra: EscalaRegra = {
      id: newEscalaId(),
      local: localOk.slice(0, 60),
      cor: corDoTurno(horaInicio, minutoInicio, duracao),
      trabalho: duracao,
      folga: Math.max(1, 24 - duracao),
      horaInicio,
      minutoInicio,
      dataInicial: iso,
      dataFinal: iso,
      avulso: true,
    };
    onSave(regra);
    onOpenChange(false);
    toast.success("Plantão avulso adicionado.");
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Adicionar plantão neste dia</DialogTitle>
          <DialogDescription>
            {baseDate
              ? format(baseDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="local-dia">Local</Label>
            <Input
              id="local-dia"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Polícia Militar, Dejem, Delegada"
              maxLength={60}
              autoFocus
            />
          </div>

          {(() => {
            const p = classificarPeriodo(horaInicio, minutoInicio, duracao);
            const c = p === "noite" ? COR_NOTURNO : COR_DIURNO;
            return (
              <div className="space-y-1.5">
                <Label>Como aparece no calendário</Label>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="relative inline-flex h-[34px] w-[34px] items-center justify-center"
                    style={{
                      borderRadius: 3,
                      background: "#FFE066",
                      backgroundImage:
                        "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 45%), linear-gradient(180deg, #FFE97A 0%, #F7CE3E 100%)",
                      boxShadow:
                        "0 2px 3px rgba(0,0,0,0.28), 0 1px 0 rgba(0,0,0,0.10) inset",
                      transform: "rotate(-3deg)",
                      marginTop: 4,
                    }}
                  >
                    <span
                      className="text-[13px] font-extrabold"
                      style={{ color: "#3a2a00" }}
                    >
                      {baseDate ? baseDate.getDate() : 15}
                    </span>
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-0 h-[4px] w-full"
                      style={{
                        background: c,
                        borderBottomLeftRadius: 3,
                        borderBottomRightRadius: 3,
                      }}
                    />
                    <span
                      aria-hidden
                      className="absolute right-0 top-0 h-0 w-0"
                      style={{
                        borderTop: "7px solid hsl(var(--card))",
                        borderLeft: "7px solid rgba(150, 110, 0, 0.35)",
                      }}
                    />
                    <span
                      aria-hidden
                      className="absolute"
                      style={{
                        top: -3,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle at 30% 30%, #ff6b6b 0%, #d63031 55%, #a51d1d 100%)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.45)",
                      }}
                    />
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Post-it com alfinete cobrindo o dia — destaca visualmente o plantão avulso sem se misturar ao contorno da escala.
                  </span>
                </div>
              </div>
            );

          })()}


          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hora-dia">Horário de início</Label>
              <Input
                id="hora-dia"
                type="time"
                step={60}
                value={toHHMM(horaInicio, minutoInicio)}
                onChange={(e) => {
                  const { h, m } = parseHHMM(e.target.value);
                  setHoraInicio(h);
                  setMinutoInicio(m);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dur-dia">Duração (horas)</Label>
              <Input
                id="dur-dia"
                type="number"
                min={1}
                max={24}
                value={duracao}
                onChange={(e) => setDuracao(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar plantão</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
