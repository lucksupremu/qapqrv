import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarRange, Pencil, Download, Home } from "lucide-react";

import { EscalaConfigModal } from "@/components/escala-config-modal";
import { EscalaDiaModal } from "@/components/escala-dia-modal";
import { EventoLivreModal } from "@/components/evento-livre-modal";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  COR_DIURNO,
  COR_NOTURNO,
  classificarPeriodo,
  corDoTurno,
  type EscalaRegra,
  type PlantaoEntry,
  gerarPlantoesDoMes,
  loadEscalas,
  removeEscala,
  saveEscalas,
} from "@/lib/escala-trabalho";
import { gerarIcs, baixarIcs } from "@/lib/escala-ics";
import { loadMarcas, type Marca } from "@/lib/marcas";
import { loadEventos, type EventoPersonalizado } from "@/lib/eventos-personalizados";
import { toast } from "sonner";

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
  const [editingRegra, setEditingRegra] = useState<EscalaRegra | null>(null);
  const [escalaDiaOpen, setEscalaDiaOpen] = useState(false);
  const [escalaBaseDate, setEscalaBaseDate] = useState<Date | null>(null);
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

  /** Periodo calculado pelo meio do plantão (mais preciso que só o início). */
  const periodoDaEntry = (e: PlantaoEntry): "dia" | "noite" => {
    const durH = (e.fim.getTime() - e.inicio.getTime()) / 3600000;
    return classificarPeriodo(e.inicio.getHours(), e.inicio.getMinutes(), durH);
  };

  // Contador de horas / plantões do mês visível
  const resumoMes = useMemo(() => {
    let horas = 0;
    let qtd = 0;
    for (const dia of plantoes.values()) {
      for (const e of dia.plantoes) {
        horas += (e.fim.getTime() - e.inicio.getTime()) / 3600000;
        qtd += 1;
      }
    }
    return { horas: Math.round(horas), qtd };
  }, [plantoes]);

  const exportarIcs = () => {
    const todas: PlantaoEntry[] = [];
    for (const dia of plantoes.values()) todas.push(...dia.plantoes);
    if (todas.length === 0) {
      toast.info("Nenhum plantão no mês para exportar.");
      return;
    }
    const nome = `Escala ${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    const ics = gerarIcs(todas, nome);
    baixarIcs(ics, `escala-${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}.ics`);
    toast.success("Arquivo .ics baixado. Importe no Google/Apple Calendar.");
  };

  const irParaHoje = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  const noMesAtual = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();




  const [openKey, setOpenKey] = useState<string | null>(null);



  return (
    <div
      className="escala-light-scope mx-4 mt-6 rounded-2xl bg-card p-3"
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={exportarIcs}
            aria-label="Exportar mês para calendário"
            title="Exportar .ics (Google/Apple Calendar)"
            className="flex h-8 w-8 items-center justify-center rounded-full active:scale-95 transition"
            style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => { setEditingRegra(null); setEscalaBaseDate(null); setModalOpen(true); }}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold text-white active:scale-95 transition"
            style={{ background: COR_PRIMARY }}
          >
            <Plus size={14} /> Configurar
          </button>
        </div>
      </div>

      {/* Navegação mês */}
      <div className="mt-2 flex items-center justify-between gap-2 px-1">
        <button
          aria-label="Mês anterior"
          onClick={goPrev}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <span className="text-[14px] font-bold text-foreground">
            {MESES[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          {!noMesAtual && (
            <button
              onClick={irParaHoje}
              aria-label="Ir para hoje"
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold active:scale-95 transition"
              style={{ borderColor: COR_PRIMARY, color: COR_PRIMARY }}
            >
              <Home size={10} /> Hoje
            </button>
          )}
        </div>
        <button
          aria-label="Próximo mês"
          onClick={goNext}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Resumo do mês */}
      {resumoMes.qtd > 0 && (
        <div className="mt-1.5 text-center text-[11px]" style={{ color: "#5b7a8f" }}>
          <span className="font-bold" style={{ color: COR_PRIMARY }}>{resumoMes.horas}h</span>
          {" · "}
          <span>{resumoMes.qtd} plantão{resumoMes.qtd === 1 ? "" : "es"} no mês</span>
        </div>
      )}

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
          const temPlantao = entries.length > 0;
          const temMarca = marcasDia.length > 0;
          const temEvento = eventosDia.length > 0;
          const temAlgo = temPlantao || temMarca || temEvento;
          const isToday = sameDay(cell.date, today);
          const corMarca = temMarca
            ? MARCA_COR[marcasDia[marcasDia.length - 1]!.tipo] ?? "#3498DB"
            : null;
          const interativo = cell.inMonth;
          const cellKey = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}-${i}`;

          // Detecta períodos presentes no dia — separando escala recorrente
          // (contorno quadrado) de plantão avulso (post-it).
          let temDia = false;
          let temNoite = false;
          let avulsoDia = false;
          let avulsoNoite = false;
          for (const e of entries) {
            const p = periodoDaEntry(e);
            if (e.regra.avulso) {
              if (p === "dia") avulsoDia = true;
              else avulsoNoite = true;
            } else {
              if (p === "dia") temDia = true;
              else temNoite = true;
            }
          }
          const temAvulso = avulsoDia || avulsoNoite;

          // Estilo do contorno: quadrado; se tem os dois períodos, split
          // horizontal (metade laranja em cima, azul embaixo).
          const borderStyle: React.CSSProperties = {};
          if (temDia && temNoite) {
            borderStyle.border = "5px solid transparent";
            borderStyle.background = `linear-gradient(hsl(var(--card)), hsl(var(--card))) padding-box, linear-gradient(180deg, ${COR_DIURNO} 50%, ${COR_NOTURNO} 50%) border-box`;
          } else if (temDia) {
            borderStyle.border = `5px solid ${COR_DIURNO}`;
          } else if (temNoite) {
            borderStyle.border = `5px solid ${COR_NOTURNO}`;
          }

          // Post-it do plantão avulso — formato diferente do contorno da escala.
          const postItAccent = avulsoDia && avulsoNoite
            ? `linear-gradient(90deg, ${COR_DIURNO} 50%, ${COR_NOTURNO} 50%)`
            : avulsoNoite
              ? COR_NOTURNO
              : COR_DIURNO;


          const cellInner = (
            <>
              <span
                className="relative flex h-9 w-9 items-center justify-center rounded-md"
                style={{ ...borderStyle }}
              >
                {temAvulso && (
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ zIndex: 1 }}
                  >
                    {/* Post-it grande cobrindo o dia */}
                    <span
                      className="relative block"
                      style={{
                        width: 34,
                        height: 34,
                        background: "#FFE066",
                        backgroundImage:
                          "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 45%), linear-gradient(180deg, #FFE97A 0%, #F7CE3E 100%)",
                        borderRadius: 3,
                        boxShadow:
                          "0 2px 3px rgba(0,0,0,0.28), 0 1px 0 rgba(0,0,0,0.10) inset, 0 -3px 6px rgba(180,130,0,0.18) inset",
                        transform: "rotate(-3deg)",
                      }}
                    >
                      {/* Faixa inferior do período (dia/noite) */}
                      <span
                        aria-hidden
                        className="absolute bottom-0 left-0 h-[4px] w-full"
                        style={{
                          background: postItAccent,
                          borderBottomLeftRadius: 3,
                          borderBottomRightRadius: 3,
                        }}
                      />
                      {/* Cantinho dobrado */}
                      <span
                        aria-hidden
                        className="absolute right-0 top-0"
                        style={{
                          width: 0,
                          height: 0,
                          borderTop: "7px solid hsl(var(--card))",
                          borderLeft: "7px solid rgba(150, 110, 0, 0.35)",
                        }}
                      />
                    </span>
                    {/* Alfinete vermelho */}
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
                        boxShadow:
                          "0 1px 2px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(0,0,0,0.25)",
                        zIndex: 2,
                      }}
                    />
                  </span>
                )}
                <span
                  className={`relative text-[13px] ${
                    !cell.inMonth
                      ? "text-muted-foreground/60"
                      : temAvulso
                        ? "text-[#3a2a00]"
                        : "text-foreground"
                  }`}
                  style={{
                    fontWeight: isToday || temPlantao || temAvulso ? 800 : 500,
                    zIndex: 2,
                  }}
                >
                  {cell.date.getDate()}
                  {isToday && (
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full"
                      style={{ background: COR_PRIMARY }}
                    />
                  )}
                </span>

              </span>

              {temMarca && marcasDia.length === 1 && !temEvento && (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 overflow-hidden"
                  style={{
                    width: 34,
                    height: 34,
                    background: "#FFE066",
                    backgroundImage:
                      "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 45%), linear-gradient(180deg, #FFE97A 0%, #F7CE3E 100%)",
                    borderRadius: 3,
                    boxShadow:
                      "0 2px 3px rgba(0,0,0,0.28), 0 1px 0 rgba(0,0,0,0.10) inset, 0 -3px 6px rgba(180,130,0,0.18) inset",
                    transform: "rotate(-3deg)",
                    zIndex: 0,
                  }}
                >
                  {/* Faixa inferior com a cor da marca */}
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-[4px] w-full"
                    style={{
                      background: corMarca ?? "#3498DB",
                      borderBottomLeftRadius: 3,
                      borderBottomRightRadius: 3,
                    }}
                  />
                  {/* Cantinho dobrado */}
                  <span
                    aria-hidden
                    className="absolute right-0 top-0"
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: "7px solid hsl(var(--card))",
                      borderLeft: "7px solid rgba(150, 110, 0, 0.35)",
                    }}
                  />
                </span>
              )}
              {temMarca && marcasDia.length === 1 && !temEvento && (
                <span
                  className="absolute left-0 right-0 text-center font-bold text-[#3a2a00] pointer-events-none"
                  style={{
                    bottom: 3,
                    fontSize: 6,
                    lineHeight: 1,
                    zIndex: 3,
                    transform: "rotate(-3deg)",
                  }}
                >
                  {(MARCA_LABEL[marcasDia[0]!.tipo] ?? "Marca").slice(0, 8)}
                </span>
              )}
              {temMarca && (marcasDia.length > 1 || temEvento) && (
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    right: 0,
                    top: 0,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: corMarca ?? "#3498DB",
                    boxShadow: "0 0 0 1.5px hsl(var(--card))",
                    zIndex: 6,
                  }}
                />
              )}

              {temEvento && (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 overflow-hidden"
                  style={{
                    width: 34,
                    height: 34,
                    background: "#FFE066",
                    backgroundImage:
                      "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 45%), linear-gradient(180deg, #FFE97A 0%, #F7CE3E 100%)",
                    borderRadius: 3,
                    boxShadow:
                      "0 2px 3px rgba(0,0,0,0.28), 0 1px 0 rgba(0,0,0,0.10) inset, 0 -3px 6px rgba(180,130,0,0.18) inset",
                    transform: "rotate(-3deg)",
                    zIndex: 0,
                  }}
                >
                  {/* Cantinho dobrado */}
                  <span
                    aria-hidden
                    className="absolute right-0 top-0"
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: "7px solid hsl(var(--card))",
                      borderLeft: "7px solid rgba(150, 110, 0, 0.35)",
                    }}
                  />
                </span>
              )}
              {temEvento && (
                <span
                  className="absolute left-0 right-0 text-center font-bold text-[#3a2a00] pointer-events-none"
                  style={{
                    bottom: 3,
                    fontSize: 6,
                    lineHeight: 1,
                    zIndex: 3,
                    transform: "rotate(-3deg)",
                  }}
                >
                  {eventosDia[0]?.titulo.trim().slice(0, 8)}
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
                              {e.regra.avulso && (
                                <span
                                  className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-[1px] align-middle text-[9px] font-bold uppercase tracking-wide text-white"
                                  style={{ background: e.regra.cor }}
                                >
                                  Avulso
                                </span>
                              )}
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
                <div className="mt-3 space-y-1.5">
                  <button
                    onClick={() => {
                      setOpenKey(null);
                      setEscalaBaseDate(cell.date);
                      setEscalaDiaOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-1.5 text-[12px] font-bold transition active:scale-[0.98]"
                    style={{ borderColor: COR_PRIMARY, color: COR_PRIMARY }}
                  >
                    <Plus size={13} /> Adicionar plantão neste dia
                  </button>
                  <button
                    onClick={() => {
                      setOpenKey(null);
                      setEventoEditing(null);
                      setEventoBaseDate(cell.date);
                      setEventoModalOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-1.5 text-[12px] font-bold transition active:scale-[0.98]"
                    style={{ borderColor: "#7C3AED", color: "#7C3AED" }}
                  >
                    <Plus size={13} /> Adicionar compromisso
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      {/* Legenda das faixas */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 text-[10px]" style={{ color: "#5b7a8f" }}>
        <span className="flex items-center gap-1">
          <span style={{ width: 14, height: 14, borderRadius: 3, border: `5px solid ${COR_DIURNO}` }} />
          Diurno
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 14, height: 14, borderRadius: 3, border: `5px solid ${COR_NOTURNO}` }} />
          Noturno
        </span>
        <span className="flex items-center gap-1">
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              border: "5px solid transparent",
              background: `linear-gradient(hsl(var(--card)),hsl(var(--card))) padding-box, linear-gradient(180deg, ${COR_DIURNO} 50%, ${COR_NOTURNO} 50%) border-box`,
            }}
          />
          Dia + Noite
        </span>
        <span className="flex items-center gap-1">
          <span
            className="relative inline-block"
            style={{
              width: 16,
              height: 14,
              borderRadius: 2,
              background: "#FFE066",
              backgroundImage:
                "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 45%), linear-gradient(180deg, #FFE97A 0%, #F7CE3E 100%)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.22)",
              transform: "rotate(-3deg)",
            }}
          >
            <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-b-[2px]" style={{ background: COR_DIURNO }} />
            <span
              aria-hidden
              className="absolute"
              style={{
                top: -3,
                left: "50%",
                transform: "translateX(-50%)",
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, #ff6b6b 0%, #d63031 60%, #a51d1d 100%)",
                boxShadow: "0 1px 1px rgba(0,0,0,0.35)",
              }}
            />
          </span>
          Plantão avulso
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3498DB" }} />
          Dejem/Delegada
        </span>
      </div>

      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        Contorno = escala recorrente · Post-it = plantão avulso. Toque em um dia para detalhes.
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
              <div className="flex shrink-0 items-center">
                <button
                  aria-label={`Editar escala ${r.local}`}
                  onClick={() => {
                    setEditingRegra(r);
                    setEscalaBaseDate(null);
                    setModalOpen(true);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Pencil size={14} />
                </button>
                <button
                  aria-label={`Remover escala ${r.local}`}
                  onClick={() => handleRemove(r.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              setEditingRegra(null);
              setEscalaBaseDate(null);
              setModalOpen(true);
            }}
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
        onOpenChange={(v) => {
          setModalOpen(v);
          if (!v) setEditingRegra(null);
        }}
        onSave={handleSave}
        initial={editingRegra}
      />

      <EscalaDiaModal
        open={escalaDiaOpen}
        onOpenChange={(v) => {
          setEscalaDiaOpen(v);
          if (!v) setEscalaBaseDate(null);
        }}
        baseDate={escalaBaseDate}
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
