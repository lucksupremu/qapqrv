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

  const fmtHM = (h: number, m?: number) =>
    `${String(h).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}`;

  const fmtHora = (d: Date) => fmtHM(d.getHours(), d.getMinutes());
  const fmtDataExtenso = (d: Date) => {
    const semana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()];
    const mes = MESES[d.getMonth()];
    return `${semana}, ${d.getDate()} de ${mes.toLowerCase()}`;
  };
  const fmtDiaCurto = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

  type BarSeg = { cor: string; lado: "cheia" | "esq" | "dir" };
  const barrasDoDia = (entries: PlantaoEntry[], date: Date): BarSeg[] => {
    const segs: BarSeg[] = [];
    for (const e of entries) {
      const inicioSameDay = sameDay(e.inicio, date);
      const fimSameDay = sameDay(e.fim, date);
      let lado: BarSeg["lado"];
      if (inicioSameDay && fimSameDay) lado = "cheia";
      else if (inicioSameDay && !fimSameDay) lado = "dir";
      else if (!inicioSameDay && fimSameDay) lado = "esq";
      else lado = "cheia";
      segs.push({ cor: e.regra.cor, lado });
    }
    // dedupe por cor+lado
    const seen = new Set<string>();
    return segs.filter((s) => {
      const k = `${s.cor}-${s.lado}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const [openKey, setOpenKey] = useState<string | null>(null);



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
          const entries: PlantaoEntry[] = dia?.plantoes ?? [];
          const barras = barrasDoDia(entries, cell.date);
          const barrasVisiveis = barras.slice(0, 2);
          const extras = barras.length - barrasVisiveis.length;
          const temAlgo = barras.length > 0;
          const isToday = sameDay(cell.date, today);
          const marcasDia = cell.inMonth ? marcasPorDia.get(key) ?? [] : [];
          const temMarca = marcasDia.length > 0;
          const corMarca = temMarca ? MARCA_COR[marcasDia[0]!.tipo] ?? "#3498DB" : null;
          const interativo = cell.inMonth && (temAlgo || temMarca);
          const cellKey = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}-${i}`;

          const cellInner = (
            <>
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

              {/* Faixas de plantão (estilo Google Agenda) */}
              {barrasVisiveis.length > 0 && (
                <>
                  {barrasVisiveis.map((b, idx) => {
                    const total = barrasVisiveis.length;
                    const cellH = 36; // 40 - 2*2 inset
                    const slotH = total === 1 ? cellH : cellH / total;
                    const top = 2 + idx * slotH;
                    const height = slotH - (total > 1 ? 1 : 0);
                    const bg = `color-mix(in srgb, ${b.cor} 28%, transparent)`;
                    let left = 2;
                    let right = 2;
                    let borderRadius = "6px";
                    let borderLeft = `3px solid ${b.cor}`;
                    if (b.lado === "dir") {
                      left = 20; // metade de 40
                      borderRadius = "0 6px 6px 0";
                    } else if (b.lado === "esq") {
                      right = 20;
                      borderRadius = "6px 0 0 6px";
                      borderLeft = `3px solid ${b.cor}`;
                    }
                    return (
                      <span
                        key={idx}
                        aria-hidden
                        className="pointer-events-none absolute"
                        style={{
                          left,
                          right,
                          top,
                          height,
                          background: bg,
                          borderLeft,
                          borderRadius,
                          zIndex: 0,
                        }}
                      />
                    );
                  })}
                  {extras > 0 && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute"
                      style={{
                        right: 3,
                        bottom: 1,
                        fontSize: 8,
                        fontWeight: 700,
                        color: "#5b7a8f",
                        lineHeight: 1,
                        zIndex: 2,
                      }}
                    >
                      +{extras}
                    </span>
                  )}
                </>
              )}

            </>
          );

          const baseClass = "relative mx-auto flex h-10 w-10 items-center justify-center";
          const ariaLabel = dia
            ? `${cell.date.getDate()} — ${dia.plantoes.length} plantão(ões)`
            : `${cell.date.getDate()}`;

          if (!interativo) {
            return (
              <div key={i} className={baseClass} aria-label={ariaLabel}>
                {cellInner}
              </div>
            );
          }

          return (
            <Popover
              key={i}
              open={openKey === cellKey}
              onOpenChange={(o) => setOpenKey(o ? cellKey : null)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`${baseClass} cursor-pointer rounded-full focus:outline-none focus-visible:ring-2`}
                  aria-label={ariaLabel}
                  aria-haspopup="dialog"
                >
                  {cellInner}
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-72 p-3">
                <p className="text-[13px] font-bold text-foreground">
                  {fmtDataExtenso(cell.date)}
                </p>
                {entries.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {entries.map((e, idx) => {
                      const cruza = !sameDay(e.inicio, e.fim);
                      const isInicio = sameDay(e.inicio, cell.date);
                      return (
                        <div key={idx} className="flex gap-2">
                          <span
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: e.regra.cor }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-bold text-foreground">
                              {e.regra.local}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {fmtHora(e.inicio)} → {fmtHora(e.fim)}
                              {cruza ? (isInicio ? " (termina no dia seguinte)" : "") : ""}
                            </p>
                            <p className="text-[10px]" style={{ color: "#5b7a8f" }}>
                              {isInicio
                                ? cruza
                                  ? "Início do plantão (noturno)"
                                  : "Plantão no dia"
                                : `Continuação (vem de ${fmtDiaCurto(e.inicio)})`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {marcasDia.length > 0 && (
                  <div className="mt-2 space-y-1 border-t pt-2" style={{ borderColor: COR_BG_SOFT }}>
                    {marcasDia.map((mk, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: MARCA_COR[mk.tipo] ?? "#3498DB" }}
                        />
                        <span className="text-[12px] text-foreground">
                          {MARCA_LABEL[mk.tipo] ?? mk.tipo}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      {/* Legenda das barras */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 text-[10px]" style={{ color: "#5b7a8f" }}>
        <span className="flex items-center gap-1">
          <span style={{ width: 14, height: 3, borderRadius: 2, background: COR_PRIMARY }} />
          Plantão no dia
        </span>
        <span className="flex items-center gap-1">
          <span style={{ position: "relative", width: 14, height: 3, borderRadius: 2, background: "rgba(0,0,0,0.08)" }}>
            <span style={{ position: "absolute", right: 0, top: 0, width: 7, height: 3, borderRadius: 2, background: COR_PRIMARY }} />
          </span>
          Início noturno
        </span>
        <span className="flex items-center gap-1">
          <span style={{ position: "relative", width: 14, height: 3, borderRadius: 2, background: "rgba(0,0,0,0.08)" }}>
            <span style={{ position: "absolute", left: 0, top: 0, width: 7, height: 3, borderRadius: 2, background: COR_PRIMARY }} />
          </span>
          Continuação
        </span>
      </div>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        Toque em um dia para ver detalhes.
      </p>




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
