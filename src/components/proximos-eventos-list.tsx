import { useEffect, useState } from "react";
import { CalendarCheck, CalendarClock, MapPin, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { listarProximosEventos, textoDiasRestantes, type EventoProximo } from "@/lib/escala-proximos";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_SEMANA_LONG = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];
const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
const MESES_LONG = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function fmtDataCurta(d: Date): string {
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

function fmtDataLonga(d: Date): string {
  return `${DIAS_SEMANA_LONG[d.getDay()]}, ${d.getDate()} de ${MESES_LONG[d.getMonth()]} de ${d.getFullYear()}`;
}

const TIPO_LABEL: Record<EventoProximo["tipo"], string> = {
  "plantão": "Escala avulsa",
  compromisso: "Lembrete pessoal",
  marca: "Marcação de atividade",
};

export function ProximosEventosList() {
  const [itens, setItens] = useState<EventoProximo[]>([]);
  const [selecionado, setSelecionado] = useState<EventoProximo | null>(null);

  useEffect(() => {
    setItens(listarProximosEventos(5));
    if (typeof window === "undefined") return;

    const recalcular = () => setItens(listarProximosEventos(5));
    window.addEventListener("focus", recalcular);
    window.addEventListener("storage", recalcular);
    window.addEventListener("marcas-changed", recalcular);
    window.addEventListener("eventos-changed", recalcular);
    return () => {
      window.removeEventListener("focus", recalcular);
      window.removeEventListener("storage", recalcular);
      window.removeEventListener("marcas-changed", recalcular);
      window.removeEventListener("eventos-changed", recalcular);
    };
  }, []);

  if (itens.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-center dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-[12px] text-slate-500 dark:text-slate-400">
          Nenhum lembrete, escala avulsa ou marcação Dejem/Delegada nos próximos dias.
        </p>
      </div>
    );
  }

  const IconFor = (tipo: EventoProximo["tipo"]) =>
    tipo === "plantão" ? CalendarCheck : tipo === "marca" ? MapPin : CalendarClock;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-700 dark:text-slate-400">
          Próximos lembretes
        </h3>
        <span className="text-[10px] text-slate-500 dark:text-slate-500">
          lembretes, avulsas e Dejem/Delegada
        </span>
      </div>

      <div className="space-y-2">
        {itens.map((item) => {
          const Icon = IconFor(item.tipo);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelecionado(item)}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.99] dark:border-white/5 dark:bg-slate-900/40 dark:hover:border-white/10"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${item.cor}20`, color: item.cor }}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-slate-900 dark:text-slate-200">
                  {item.titulo}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {fmtDataCurta(item.data)}
                  {item.hora ? ` · ${item.hora}` : ""}
                </p>
              </div>
              <div
                className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                style={{
                  background:
                    item.diasRestantes === 0
                      ? "#dcfce7"
                      : item.diasRestantes === 1
                        ? "#fef9c3"
                        : "#e8f0f8",
                  color:
                    item.diasRestantes === 0
                      ? "#166534"
                      : item.diasRestantes === 1
                        ? "#854d0e"
                        : "#2e6b8a",
                }}
              >
                {textoDiasRestantes(item.diasRestantes)}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!selecionado} onOpenChange={(v) => !v && setSelecionado(null)}>
        <DialogContent className="max-w-[420px] gap-0 overflow-hidden rounded-[20px] border border-border bg-background p-0 text-foreground shadow-2xl">
          {selecionado && (() => {
            const Icon = IconFor(selecionado.tipo);
            return (
              <>
                <div className="relative border-b border-border px-5 pb-5 pt-6">
                  <div
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{ background: selecionado.cor }}
                  />
                  <button
                    type="button"
                    onClick={() => setSelecionado(null)}
                    className="absolute right-3 top-3 rounded-full bg-muted p-1.5 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                    aria-label="Fechar"
                  >
                    <X size={16} />
                  </button>

                  <div className="flex items-center gap-3 pl-2">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                      style={{ background: selecionado.cor, color: "white" }}
                    >
                      <Icon size={26} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: selecionado.cor }}
                        />
                        {TIPO_LABEL[selecionado.tipo]}
                      </p>
                      <DialogTitle asChild>
                        <h2 className="truncate text-[20px] font-extrabold text-foreground">
                          {selecionado.titulo}
                        </h2>
                      </DialogTitle>
                    </div>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[12px] font-bold text-foreground">
                    {textoDiasRestantes(selecionado.diasRestantes)}
                  </div>
                </div>

                <div className="space-y-3 bg-muted/30 p-5">
                  <DetalheLinha
                    label="Data"
                    value={fmtDataLonga(selecionado.data)}
                  />
                  {selecionado.hora ? (
                    <DetalheLinha label="Horário" value={selecionado.hora} />
                  ) : null}
                  <DetalheLinha
                    label="Contagem"
                    value={
                      selecionado.diasRestantes === 0
                        ? "É hoje"
                        : selecionado.diasRestantes === 1
                          ? "É amanhã"
                          : `Faltam ${selecionado.diasRestantes} dias`
                    }
                  />

                  <p className="pt-2 text-[12px] leading-relaxed text-muted-foreground">
                    Para editar ou excluir, abra o item diretamente no calendário
                    da tela inicial ou na Agenda.
                  </p>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetalheLinha({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-right text-[13px] font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}
