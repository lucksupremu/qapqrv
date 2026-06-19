import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarRange, BookmarkPlus, Sun, Moon } from "lucide-react";

import { EscalaConfigModal } from "@/components/escala-config-modal";
import { EventoLivreModal } from "@/components/evento-livre-modal";
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
import { loadEventos, type EventoPersonalizado } from "@/lib/eventos-personalizados";

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
  const [eventos, setEventos] = useState<EventoPersonalizado[]>([]);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoModalOpen, setEventoModalOpen] = useState(false);
  const [eventoEditing, setEventoEditing] = useState<EventoPersonalizado | null>(null);
  const [eventoBaseDate, setEventoBaseDate] = useState<Date | null>(null);

  useEffect(() => {
    setRegras(loadEscalas());
    setMarcas(loadMarcas());
    setEventos(loadEventos());
    if (typeof window === "undefined") return;
    const refresh = () => {
      setRegras(loadEscalas());
      setMarcas(loadMarcas());
      setEventos(loadEventos());
    };
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === null ||
        e.key === "marcas_atividade_d" ||
        e.key === "qap-escalas-trabalho" ||
        e.key === "eventos_personalizados_v1"
      ) {
        refresh();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    window.addEventListener("marcas-changed", refresh);
    window.addEventListener("eventos-changed", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("marcas-changed", refresh);
      window.removeEventListener("eventos-changed", refresh);
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

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, EventoPersonalizado[]>();
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    for (const ev of eventos) {
      const d = new Date(ev.data);
      if (Number.isNaN(d.getTime())) continue;
      if (d.getFullYear() !== y || d.getMonth() !== m) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const cur = map.get(key) ?? [];
      cur.push(ev);
      map.set(key, cur);
    }
    for (const list of map.values()) {
      list.sort((a, b) => +new Date(a.data) - +new Date(b.data));
    }
    return map;
  }, [eventos, cursor]);

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

  type Slot = {
    kind: "plantao" | "marca";
    cor: string;
    lado: "cheia" | "top" | "bottom";
    /** Apenas para `kind === "plantao"`. Define o ícone Sol/Lua. */
    periodo?: "dia" | "noite";
    /** Hora de entrada do plantão em formato decimal (0..24). */
    horaInicio?: number;
    /** Horas trabalhadas que cabem no mesmo dia (entre horaInicio e 24h). */
    duracaoNoDia?: number;
    marcaTipo?: string;
  };
  type Coluna = { slots: Slot[] };

  /** Noturno se começa às 18h+ ou antes das 6h. */
  const isNoturno = (horaInicio: number) => horaInicio >= 18 || horaInicio < 6;

  const colunasDoDia = (entries: PlantaoEntry[], marcasDay: Marca[], date: Date): Coluna[] => {
    // Plantões → uma coluna por plantão, sempre "cheia" (o dia inicial é o
    // único onde a entry existe). Dedupe por cor+periodo para evitar duas
    // colunas idênticas quando há regras sobrepostas.
    void date;
    const colunas: Coluna[] = [];
    const seen = new Set<string>();
    for (const e of entries) {
      const horaInicio = e.inicio.getHours() + e.inicio.getMinutes() / 60;
      const periodo: "dia" | "noite" = isNoturno(e.inicio.getHours()) ? "noite" : "dia";
      const k = `${e.regra.cor}-${periodo}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const duracaoNoDia = Math.min(e.regra.trabalho, 24 - horaInicio);
      colunas.push({
        slots: [{ kind: "plantao", cor: e.regra.cor, lado: "cheia", periodo, horaInicio, duracaoNoDia }],
      });
    }


    // Marcas → uma coluna própria (não há mais "metade livre" para encaixar).
    for (const mk of marcasDay) {
      const cor = MARCA_COR[mk.tipo] ?? "#3498DB";
      colunas.push({
        slots: [{ kind: "marca", cor, lado: "cheia", marcaTipo: mk.tipo }],
      });
    }

    return colunas;
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
          const marcasDia = cell.inMonth ? marcasPorDia.get(key) ?? [] : [];
          const eventosDia = cell.inMonth ? eventosPorDia.get(key) ?? [] : [];
          const colunas = cell.inMonth ? colunasDoDia(entries, marcasDia, cell.date) : [];
          const MAX_COL = 3;
          const colunasVisiveis = colunas.slice(0, MAX_COL);
          const slotsVisiveis = colunasVisiveis.reduce((acc, c) => acc + c.slots.length, 0);
          const slotsTotais = colunas.reduce((acc, c) => acc + c.slots.length, 0);
          const extras = slotsTotais - slotsVisiveis;
          const temPlantao = entries.length > 0;
          const temMarca = marcasDia.length > 0;
          const temEvento = eventosDia.length > 0;
          const temAlgo = temPlantao || temMarca || temEvento;
          const isToday = sameDay(cell.date, today);
          const corMarca = temMarca ? MARCA_COR[marcasDia[marcasDia.length - 1]!.tipo] ?? "#3498DB" : null;
          const interativo = cell.inMonth;
          const cellKey = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}-${i}`;
          const totalCol = colunasVisiveis.length;
          const cellW = 36; // 40 - 2*2 inset
          const slotW = totalCol === 0 ? 0 : totalCol === 1 ? cellW : cellW / totalCol;

          const cellInner = (
            <>
              {isToday && !temAlgo && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ background: COR_BG_SOFT }}
                />
              )}

              <span
                className="relative text-[13px]"
                style={{
                  zIndex: 2,
                  color: !cell.inMonth
                    ? "#a8b5c2"
                    : temAlgo
                      ? "#1a1a1a"
                      : isToday
                        ? COR_PRIMARY
                        : "var(--text-dark, #02080d)",
                  fontWeight: isToday || temAlgo ? 800 : 500,
                }}
              >
                {cell.date.getDate()}
              </span>

              {/* Slots verticais (plantões + marcas) — estilo Google Agenda */}
              {colunasVisiveis.map((col, ci) => {
                const left = 2 + ci * slotW;
                const width = slotW - (totalCol > 1 ? 1 : 0);
                return col.slots.map((s, si) => {
                  let top = 2;
                  let bottom = 2;
                  let borderRadius = "6px";
                  if (s.lado === "bottom") {
                    top = 20;
                    borderRadius = s.kind === "marca" ? "0 0 4px 4px" : "0 0 6px 6px";
                  } else if (s.lado === "top") {
                    bottom = 20;
                    borderRadius = s.kind === "marca" ? "4px 4px 0 0" : "6px 6px 0 0";
                  }
                  if (s.kind === "marca") {
                    return (
                      <span
                        key={`${ci}-${si}`}
                        aria-hidden
                        className="pointer-events-none absolute"
                        style={{
                          left,
                          width,
                          top,
                          bottom,
                          background: "#FFE066",
                          borderTop: `3px solid ${s.cor}`,
                          borderRadius,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                          transform: "rotate(-3deg)",
                          zIndex: 1,
                        }}
                      />
                    );
                  }
                  const isNoite = s.periodo === "noite";
                  const bg = `color-mix(in srgb, ${s.cor} 28%, transparent)`;
                  const emoji = isNoite ? "🌙" : "🌞";
                  const emojiSize = totalCol === 1 ? 11 : totalCol === 2 ? 9 : 0;

                  // Barra proporcional ao horário: posição = hora de entrada,
                  // altura = horas trabalhadas dentro do mesmo dia.
                  const AREA_TOP = 18;
                  const AREA_BOTTOM = 2;
                  const AREA_H = 40 - AREA_TOP - AREA_BOTTOM; // 20px
                  const hi = s.horaInicio ?? 0;
                  const dn = s.duracaoNoDia ?? 24;
                  const barTop = AREA_TOP + (hi / 24) * AREA_H;
                  const barHeight = Math.max(6, (dn / 24) * AREA_H);
                  const borderRadiusBar = "4px";

                  return (
                    <span
                      key={`${ci}-${si}`}
                      aria-hidden
                      className="pointer-events-none absolute"
                      style={{
                        left,
                        width,
                        top: barTop,
                        height: barHeight,
                        background: bg,
                        borderTop: `3px solid ${s.cor}`,
                        borderRadius: borderRadiusBar,
                        zIndex: 0,
                      }}
                    >
                      {emojiSize > 0 && s.lado === "cheia" && (
                        <span
                          role="img"
                          aria-label={isNoite ? "Plantão noturno" : "Plantão diurno"}
                          style={{
                            position: "absolute",
                            right: -1,
                            bottom: -2,
                            fontSize: emojiSize,
                            lineHeight: 1,
                            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.45))",
                            zIndex: 4,
                          }}
                        >
                          {emoji}
                        </span>
                      )}
                    </span>
                  );
                });
              })}

              {temMarca && (
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
                    zIndex: 3,
                  }}
                />
              )}

              {temEvento && (
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    left: 2,
                    bottom: 2,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#7C3AED",
                    boxShadow: "0 0 0 1.5px #fff",
                    zIndex: 3,
                  }}
                />
              )}

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
                    zIndex: 3,
                  }}
                >
                  +{extras}
                </span>
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
                    {marcasDia.map((mk, idx) => {
                      const dMk = new Date(mk.data);
                      const horaOk = !Number.isNaN(dMk.getTime());
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: MARCA_COR[mk.tipo] ?? "#3498DB" }}
                          />
                          <span className="text-[12px] text-foreground">
                            {MARCA_LABEL[mk.tipo] ?? mk.tipo}
                            {horaOk && (
                              <span className="ml-1 text-[11px] text-muted-foreground">
                                · {fmtHora(dMk)}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {eventosDia.length > 0 && (
                  <div className="mt-2 space-y-1 border-t pt-2" style={{ borderColor: COR_BG_SOFT }}>
                    {eventosDia.map((ev) => {
                      const dEv = new Date(ev.data);
                      return (
                        <button
                          key={ev.id}
                          onClick={() => {
                            setOpenKey(null);
                            setEventoEditing(ev);
                            setEventoBaseDate(cell.date);
                            setEventoModalOpen(true);
                          }}
                          className="flex w-full items-start gap-2 rounded-md px-1 py-1 text-left hover:bg-muted/40"
                        >
                          <span
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: "#7C3AED" }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-bold text-foreground">
                              {ev.titulo}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {fmtHora(dEv)}
                              {ev.observacao ? ` · ${ev.observacao}` : ""}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={() => {
                    setOpenKey(null);
                    setEventoEditing(null);
                    setEventoBaseDate(cell.date);
                    setEventoModalOpen(true);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-1.5 text-[12px] font-bold transition active:scale-[0.98]"
                  style={{ borderColor: "#7C3AED", color: "#7C3AED" }}
                >
                  <BookmarkPlus size={13} /> Adicionar evento
                </button>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      {/* Legenda das faixas */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 text-[10px]" style={{ color: "#5b7a8f" }}>
        <span className="flex items-center gap-1">
          <span style={{ position: "relative", width: 16, height: 16, borderRadius: 3, borderTop: `3px solid ${COR_PRIMARY}`, background: `color-mix(in srgb, ${COR_PRIMARY} 28%, transparent)`, overflow: "hidden" }}>
            <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#FBBF24" }} />
            <span style={{ position: "absolute", right: 1, bottom: -1, fontSize: 10, lineHeight: 1 }}>🌞</span>
          </span>
          Plantão diurno
        </span>
        <span className="flex items-center gap-1">
          <span style={{ position: "relative", width: 16, height: 16, borderRadius: 3, borderTop: `3px solid ${COR_PRIMARY}`, background: `color-mix(in srgb, ${COR_PRIMARY} 55%, #0B1437)`, overflow: "hidden" }}>
            <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#1E1B4B" }} />
            <span style={{ position: "absolute", right: 1, bottom: -1, fontSize: 10, lineHeight: 1 }}>🌙</span>
          </span>
          Plantão noturno
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 8, height: 16, borderRadius: 3, background: "#FFE066", borderTop: "3px solid #3498DB", boxShadow: "0 1px 2px rgba(0,0,0,0.2)", transform: "rotate(-3deg)" }} />
          Dejem/Delegada
        </span>
      </div>

      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        Fundo escuro e faixa lateral índigo indicam plantão noturno; fundo claro e faixa amarela indicam diurno. Toque em um dia para detalhes.
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

      <EventoLivreModal
        open={eventoModalOpen}
        onOpenChange={setEventoModalOpen}
        baseDate={eventoBaseDate}
        editing={eventoEditing}
        onChanged={() => setEventos(loadEventos())}
      />
    </div>
  );
}
