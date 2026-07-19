import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CalendarCheck, CalendarClock, MapPin } from "lucide-react";
import { listarProximosEventos, textoDiasRestantes, type EventoProximo } from "@/lib/escala-proximos";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function fmtDataCurta(d: Date): string {
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function ProximosEventosList() {
  const navigate = useNavigate();
  const [itens, setItens] = useState<EventoProximo[]>([]);

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
          Nenhum lembrete ou escala avulsa nos próximos dias.
        </p>
        <button
          onClick={() => navigate({ to: "/calendario" })}
          className="mt-2 text-[12px] font-bold text-amber-600 dark:text-amber-500"
        >
          Abrir Agenda →
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-700 dark:text-slate-400">
          Próximos lembretes
        </h3>
        <span className="text-[10px] text-slate-500 dark:text-slate-500">
          lembretes e escalas avulsas
        </span>
      </div>

      <div className="space-y-2">
        {itens.map((item) => {
          const Icon = item.tipo === "plantão" ? CalendarCheck : CalendarClock;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/5 dark:bg-slate-900/40"
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
                  {fmtDataCurta(item.data)} · {item.hora}
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
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate({ to: "/calendario" })}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed py-2 text-[12px] font-bold transition active:scale-[0.98]"
        style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
      >
        Ver na Agenda <ArrowRight size={14} />
      </button>
    </div>
  );
}
