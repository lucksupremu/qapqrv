import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarRange } from "lucide-react";

import { EscalaConfigModal } from "@/components/escala-config-modal";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  type EscalaRegra,
  type PlantaoEntry,
  gerarPlantoesDoMes,
  loadEscalas,
  removeEscala,
  saveEscalas,
} from "@/lib/escala-trabalho";
import { loadMarcas, type Marca } from "@/lib/marcas";

const MARCA_COR: Record<string, string> = {
  dejem: "#3498DB",
  delegada: "#2ECC71",
  delegada_capital: "#2ECC71",
  delegada_outras: "#E67E22",
};
const MARCA_LABEL: Record<string, string> = {
  dejem: "Dejem",
  delegada: "Delegada",
  delegada_capital: "Delegada Cap.",
  delegada_outras: "Delegada",
};


const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildGrid(year: number, month: number) {
  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const startWeekday = first.getDay();
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startWeekday + i, 12, 0, 0, 0);
    cells.push({ date: d, inMonth: d.getMonth() === month });
  }
  return cells;
}

export function EscalaCalendarCard() {
  const today = useMemo(() => new Date(), []);
  const [regras, setRegras] = useState<EscalaRegra[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setRegras(loadEscalas());
    setMarcas(loadMarcas());
    if (typeof window === "undefined") return;
    const refresh = () => {
      setRegras(loadEscalas());
      setMarcas(loadMarcas());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === "marcas_atividade_d" || e.key === "qap-escalas-trabalho") {
        refresh();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const grid = useMemo(
    () => buildGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const plantoes = useMemo(
    () => gerarPlantoesDoMes(regras, cursor.getFullYear(), cursor.getMonth()),
    [regras, cursor],
  );

  const marcasPorDia = useMemo(() => {
    const map = new Map<string, Marca[]>();
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    for (const mk of marcas) {
      const d = new Date(mk.data);
      if (Number.isNaN(d.getTime())) continue;
      if (d.getFullYear() !== y || d.getMonth() !== m) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const cur = map.get(key) ?? [];
      cur.push(mk);
      map.set(key, cur);
    }
    return map;
  }, [marcas, cursor]);

  const goPrev = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const goNext = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));

  const handleSave = (r: EscalaRegra) => {
    setRegras((prev) => {
      const next = prev.some((x) => x.id === r.id)
        ? prev.map((x) => (x.id === r.id ? r : x))
        : [...prev, r];
      saveEscalas(next);
      return next;
    });
  };

  const handleRemove = (id: string) => {
    const next = removeEscala(id);
    setRegras(next);
  };

  const COR_PRIMARY = "#2e6b8a";
  const COR_BG_SOFT = "#e8f0f8";

  const cellRing = (cores: string[]) => {
    if (cores.length === 1) {
      return { background: "transparent", border: `3px solid ${cores[0]}` };
    }
    const step = 100 / cores.length;
    const stops = cores
      .map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`)
      .join(", ");
    return {
      background: `conic-gradient(${stops})`,
      WebkitMask:
        "radial-gradient(circle, transparent 55%, #000 56%)",
      mask: "radial-gradient(circle, transparent 55%, #000 56%)",
    } as React.CSSProperties;
  };

  // Meia-lua superior: indica que o policial ainda está de serviço na manhã
  // (plantão começou na noite anterior).
  const cellContinuacao = (cor: string): React.CSSProperties => ({
    background: "transparent",
    border: `3px solid ${cor}`,
    clipPath: "inset(0 0 50% 0)",
  });

  const fmtHM = (h: number, m?: number) =>
    `${String(h).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}`;


  return (
    <div
      className="mx-4 mt-6 rounded-2xl bg-card p-3"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
          >
            <CalendarRange size={16} />
          </span>
          <h2 className="text-[15px] font-bold text-foreground">Minha escala</h2>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold text-white active:scale-95 transition"
          style={{ background: COR_PRIMARY }}
        >
          <Plus size={14} /> Configurar
        </button>
      </div>

      {/* Navegação mês */}
      <div className="mt-2 flex items-center justify-between px-1">
        <button
          aria-label="Mês anterior"
          onClick={goPrev}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-[14px] font-bold text-foreground">
          {MESES[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          aria-label="Próximo mês"
          onClick={goNext}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="mt-2 grid grid-cols-7 gap-1">
        {DIAS.map((d, i) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold tracking-wider"
            style={{ color: i === 0 || i === 6 ? "#c44569" : "#5b7a8f" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((cell, i) => {
          const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
          const dia = plantoes.get(key);
          const inicios = dia
            ? dia.plantoes.filter((p) => p.tipo === "inicio")
            : [];
          const continuacoes = dia
            ? dia.plantoes.filter((p) => p.tipo === "continuacao")
            : [];
          const coresInicio = Array.from(
            new Set(inicios.map((p) => p.regra.cor)),
          );
          const coresContinuacao = Array.from(
            new Set(continuacoes.map((p) => p.regra.cor)),
          );
          const temAlgo = coresInicio.length + coresContinuacao.length > 0;
          const isToday = sameDay(cell.date, today);
          const marcasDia = cell.inMonth ? marcasPorDia.get(key) ?? [] : [];
          const temMarca = marcasDia.length > 0;
          const corMarca = temMarca ? MARCA_COR[marcasDia[0]!.tipo] ?? "#3498DB" : null;

          return (
            <div
              key={i}
              className="relative mx-auto flex h-10 w-10 items-center justify-center"
              aria-label={
                dia
                  ? `${cell.date.getDate()} — ${dia.plantoes.length} plantão(ões)`
                  : `${cell.date.getDate()}`
              }
            >
              {coresContinuacao.map((c, idx) => (
                <span
                  key={`cont-${idx}`}
                  className="absolute inset-0 rounded-full"
                  style={cellContinuacao(c)}
                />
              ))}
              {coresInicio.length > 0 && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={cellRing(coresInicio)}
                />
              )}
              {temMarca && (
                <>
                  <span
                    aria-hidden
                    className="absolute"
                    style={{
                      inset: "4px",
                      background: "#FFE066",
                      transform: "rotate(-4deg)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                      borderRadius: "2px",
                    }}
                  />
                  <span
                    aria-hidden
                    className="absolute"
                    style={{
                      right: 2,
                      top: 2,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: corMarca ?? "#3498DB",
                      boxShadow: "0 0 0 1.5px #fff",
                    }}
                  />
                </>
              )}
              {isToday && !temAlgo && !temMarca && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ background: COR_BG_SOFT }}
                />
              )}

              <span
                className="relative text-[13px]"
                style={{
                  color: !cell.inMonth
                    ? "#a8b5c2"
                    : temMarca
                      ? "#1a1a1a"
                      : isToday
                        ? COR_PRIMARY
                        : "var(--text-dark, #02080d)",
                  fontWeight: isToday || temAlgo || temMarca ? 800 : 500,
                }}
              >
                {cell.date.getDate()}
              </span>

            </div>
          );
        })}
      </div>


      {/* Legenda / Lista de regras */}
      {regras.length > 0 ? (
        <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: COR_BG_SOFT }}>
          {regras.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5"
              style={{ background: "var(--surface, #f4f8fc)" }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: r.cor }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-foreground">
                    {r.local}
                  </p>
                  {(() => {
                    const descTurno = (
                      trab: number,
                      hi: number,
                      mi: number | undefined,
                    ) => {
                      const ini = fmtHM(hi, mi);
                      const fimMin = (hi * 60 + (mi ?? 0) + trab * 60) % (24 * 60);
                      const fim = fmtHM(Math.floor(fimMin / 60), fimMin % 60);
                      const cruzaNoite = hi * 60 + (mi ?? 0) + trab * 60 >= 24 * 60;
                      return `${ini} → ${fim}${cruzaNoite ? " (dia seguinte)" : ""}`;
                    };
                    return (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {r.trabalho}×{r.folga} · {descTurno(r.trabalho, r.horaInicio, r.minutoInicio)}
                        {r.alternada
                          ? ` / ${r.alternada.trabalho}×${r.alternada.folga} · ${descTurno(r.alternada.trabalho, r.alternada.horaInicio, r.alternada.minutoInicio)}`
                          : ""}
                      </p>
                    );
                  })()}
                </div>

              </div>
              <button
                aria-label={`Remover escala ${r.local}`}
                onClick={() => handleRemove(r.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setModalOpen(true)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-[12px] font-bold transition active:scale-[0.98]"
            style={{ borderColor: COR_PRIMARY, color: COR_PRIMARY }}
          >
            <Plus size={14} /> Cadastrar outra escala
          </button>
        </div>
      ) : (
        <p className="mt-3 border-t pt-3 text-center text-[12px] text-muted-foreground" style={{ borderColor: COR_BG_SOFT }}>
          Nenhuma escala cadastrada. Toque em <strong>Configurar</strong> para começar.
        </p>
      )}


      <EscalaConfigModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
      />
    </div>
  );
}
