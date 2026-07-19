import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarX,
  Plus,
  CalendarDays,
  List,
  Share2,
  CalendarCheck2,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

import { MarcarModal } from "@/components/marcar-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type Marca,
  type TipoMarca,
  loadMarcas,
  saveMarcas,
} from "@/lib/marcas";
import { cancelForMarca } from "@/lib/notifications-adapter";


export const Route = createFileRoute("/calendario")({
  head: () => ({ meta: [{ title: "Agenda — QAP, QRV!" }] }),
  component: CalendarScreen,
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TIPO_LABEL: Record<TipoMarca, string> = {
  dejem: "Dejem",
  delegada: "Delegada",
  delegada_capital: "Delegada Capital",
  delegada_outras: "Outras Delegadas",
};

const TIPO_COR: Record<TipoMarca, string> = {
  dejem: "#3498DB",
  delegada: "#2ECC71",
  delegada_capital: "#2ECC71",
  delegada_outras: "#E67E22",
};

const TIPOS: TipoMarca[] = ["dejem", "delegada", "delegada_capital", "delegada_outras"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatBR(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type CellDay = { date: Date; inMonth: boolean };

function buildGrid(year: number, month: number): CellDay[] {
  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const startWeekday = first.getDay();
  const cells: CellDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startWeekday + i, 12, 0, 0, 0);
    cells.push({ date: d, inMonth: d.getMonth() === month });
  }
  return cells;
}

function CalendarScreen() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selected, setSelected] = useState<Date | null>(today);
  const [marcas, setMarcas] = useState<Marca[]>(() => loadMarcas());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Marca | null>(null);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Marca | null>(null);
  const [filtros, setFiltros] = useState<Set<TipoMarca>>(new Set(TIPOS));
  const [view, setView] = useState<"grid" | "agenda">("grid");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(cursor.getFullYear());
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);

  useEffect(() => { saveMarcas(marcas); }, [marcas]);

  // Deep link / atalho rápido: /calendario?action=nova-marca abre o modal direto.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "nova-marca") {
      setEditing(null);
      setNewDate(new Date().toISOString().slice(0, 10));
      setModalOpen(true);
      // Remove o parâmetro para não reabrir ao voltar.
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);


  const grid = useMemo(
    () => buildGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const marcasFiltradas = useMemo(
    () => marcas.filter((m) => filtros.has(m.tipo)),
    [marcas, filtros],
  );

  const marcasPorDia = useMemo(() => {
    const map = new Map<string, Marca[]>();
    for (const m of marcasFiltradas) {
      const d = new Date(m.data);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(k) ?? [];
      list.push(m);
      map.set(k, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => +new Date(a.data) - +new Date(b.data));
    }
    return map;
  }, [marcasFiltradas]);

  const getMarcasDoDia = (d: Date) =>
    marcasPorDia.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];

  const selectedMarcas = selected ? getMarcasDoDia(selected) : [];

  // Resumo do mês
  const resumoMes = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const noMes = marcasFiltradas.filter((x) => {
      const d = new Date(x.data);
      return d.getFullYear() === y && d.getMonth() === m;
    });
    const total = noMes.reduce((s, x) => s + (x.valor || 0), 0);
    const porTipo: Record<TipoMarca, number> = {
      dejem: 0, delegada: 0, delegada_capital: 0, delegada_outras: 0,
    };
    for (const x of noMes) porTipo[x.tipo] = (porTipo[x.tipo] || 0) + 1;
    return { count: noMes.length, total, porTipo, lista: noMes };
  }, [marcasFiltradas, cursor]);

  // Agenda infinita: TODAS as marcas (passadas + futuras), ordenadas cronologicamente
  // e agrupadas por mês. Pula filtro do mês atual — é uma agenda contínua.
  const agendaInfinita = useMemo(() => {
    const ordenadas = [...marcasFiltradas].sort(
      (a, b) => +new Date(a.data) - +new Date(b.data),
    );
    const grupos: { mesLabel: string; mesKey: string; itens: Marca[] }[] = [];
    for (const m of ordenadas) {
      const d = new Date(m.data);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
      let g = grupos.find((x) => x.mesKey === key);
      if (!g) {
        g = { mesKey: key, mesLabel: label, itens: [] };
        grupos.push(g);
      }
      g.itens.push(m);
    }
    return grupos;
  }, [marcasFiltradas]);

  const agendaItems = useMemo(() => {
    return [...resumoMes.lista].sort((a, b) => +new Date(a.data) - +new Date(b.data));
  }, [resumoMes.lista]);


  const goPrev = () => {
    setSlideDir("right");
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  };
  const goNext = () => {
    setSlideDir("left");
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  };
  const goToday = () => {
    setSlideDir(null);
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(today);
  };

  const handleDayClick = (cell: CellDay) => {
    setSelected(cell.date);
    if (!cell.inMonth) {
      setCursor(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
    }
  };

  const openNew = () => {
    const base = selected ?? today;
    const d = new Date(base);
    d.setHours(7, 0, 0, 0);
    setEditing(null);
    setNewDate(d.toISOString());
    setModalOpen(true);
  };

  const openEdit = (m: Marca) => {
    setEditing(m);
    setNewDate(null);
    setModalOpen(true);
  };

  const handleSave = (m: Marca) => {
    setMarcas((prev) => {
      const exists = prev.some((x) => x.id === m.id);
      return exists ? prev.map((x) => (x.id === m.id ? m : x)) : [m, ...prev];
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    cancelForMarca(confirmDelete.id);
    setMarcas((prev) => prev.filter((m) => m.id !== confirmDelete.id));
    setConfirmDelete(null);
    toast.success("Escala excluída com sucesso.");
  };

  const toggleFiltro = (t: TipoMarca) => {
    setFiltros((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t); else n.add(t);
      if (n.size === 0) return new Set(TIPOS);
      return n;
    });
  };

  // Swipe
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) goNext(); else goPrev();
  };

  const handleShare = async () => {
    const titulo = `Escalas — ${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    const linhas = agendaItems.length === 0
      ? ["Nenhuma escala marcada."]
      : agendaItems.map((m) => {
          const d = new Date(m.data);
          const dia = String(d.getDate()).padStart(2, "0");
          const hora = formatHora(m.data);
          const valor = m.valor > 0 ? ` — ${formatBRL(m.valor)}` : "";
          return `• ${dia} ${hora} — ${TIPO_LABEL[m.tipo]}${valor}`;
        });
    const totalLn = resumoMes.total > 0 ? `\nTotal: ${formatBRL(resumoMes.total)}` : "";
    const text = `${titulo}\n\n${linhas.join("\n")}${totalLn}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Escalas copiadas para a área de transferência.");
      }
    } catch {
      /* user cancelled */
    }
  };

  const COR_PRIMARY = "#2e6b8a";
  const COR_BG_SOFT = "#e8f0f8";

  return (
    <div className="escala-light-scope min-h-screen pb-32" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3">
        <button
          aria-label="Voltar"
          onClick={() => navigate({ to: "/" })}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <h1 className="flex items-center gap-1.5 text-[18px] font-bold" style={{ color: COR_PRIMARY }}>
            <Bell size={14} style={{ color: COR_PRIMARY }} />
            Agenda
          </h1>
          <p className="text-[10.5px] leading-tight text-center" style={{ color: "#5b7a8f" }}>
            Marque Dejem/Delegada e receba lembretes
          </p>
        </div>
        <button
          aria-label="Compartilhar mês"
          onClick={handleShare}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
        >
          <Share2 size={18} />
        </button>
      </header>

      {/* Navegação de mês */}
      <div className="flex items-center justify-center gap-3 py-2">
        <button
          aria-label="Mês anterior"
          onClick={goPrev}
          className="flex h-9 w-9 items-center justify-center rounded-full active:scale-95 transition"
          style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
        >
          <ChevronLeft size={20} />
        </button>

        <Popover open={pickerOpen} onOpenChange={(o) => { setPickerOpen(o); if (o) setPickerYear(cursor.getFullYear()); }}>
          <PopoverTrigger asChild>
            <button
              className="min-w-[170px] text-center text-[18px] font-bold rounded-lg px-3 py-1 active:scale-95 transition"
              style={{ color: COR_PRIMARY }}
            >
              {MESES[cursor.getMonth()]} {cursor.getFullYear()}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-3 pointer-events-auto" align="center">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setPickerYear((y) => y - 1)}
                className="h-8 w-8 flex items-center justify-center rounded-full"
                style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold" style={{ color: COR_PRIMARY }}>{pickerYear}</span>
              <button
                onClick={() => setPickerYear((y) => y + 1)}
                className="h-8 w-8 flex items-center justify-center rounded-full"
                style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MESES_CURTOS.map((m, i) => {
                const isCur = i === cursor.getMonth() && pickerYear === cursor.getFullYear();
                return (
                  <button
                    key={m}
                    onClick={() => {
                      setSlideDir(null);
                      setCursor(new Date(pickerYear, i, 1));
                      setPickerOpen(false);
                    }}
                    className="py-2 rounded-lg text-[13px] font-semibold"
                    style={{
                      background: isCur ? COR_PRIMARY : COR_BG_SOFT,
                      color: isCur ? "#fff" : COR_PRIMARY,
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <button
          aria-label="Próximo mês"
          onClick={goNext}
          className="flex h-9 w-9 items-center justify-center rounded-full active:scale-95 transition"
          style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Toolbar: Hoje + view toggle */}
      <div className="mx-3 mt-1 flex items-center justify-between gap-2">
        <button
          onClick={goToday}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold active:scale-95 transition"
          style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
        >
          <CalendarCheck2 size={14} /> Hoje
        </button>
        <div className="flex rounded-full p-0.5" style={{ background: COR_BG_SOFT }}>
          <button
            onClick={() => setView("grid")}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold transition"
            style={{
              background: view === "grid" ? COR_PRIMARY : "transparent",
              color: view === "grid" ? "#fff" : COR_PRIMARY,
            }}
          >
            <CalendarDays size={13} /> Grade
          </button>
          <button
            onClick={() => setView("agenda")}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold transition"
            style={{
              background: view === "agenda" ? COR_PRIMARY : "transparent",
              color: view === "agenda" ? "#fff" : COR_PRIMARY,
            }}
          >
            <List size={13} /> Agenda
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mx-3 mt-3 flex flex-wrap gap-1.5">
        {TIPOS.map((t) => {
          const ativo = filtros.has(t);
          return (
            <button
              key={t}
              onClick={() => toggleFiltro(t)}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition"
              style={{
                background: ativo ? "var(--surface)" : "transparent",
                color: ativo ? "var(--text-dark)" : "#5b7a8f",
                border: `1.5px solid ${ativo ? TIPO_COR[t] : "#C0C8D5"}`,
                opacity: ativo ? 1 : 0.6,
              }}
            >
              <span className="block h-2 w-2 rounded-full" style={{ background: TIPO_COR[t] }} />
              {TIPO_LABEL[t]}
              <span className="opacity-70">({resumoMes.porTipo[t]})</span>
            </button>
          );
        })}
      </div>

      {/* Resumo do mês */}
      {resumoMes.count > 0 && (
        <div className="mx-3 mt-3 rounded-[14px] p-3 flex items-center justify-between bg-[var(--surface)] shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#5b7a8f" }}>
              Resumo do mês
            </div>
            <div className="text-[13px] font-semibold" style={{ color: "var(--text-dark)" }}>
              {resumoMes.count} {resumoMes.count === 1 ? "marca" : "marcas"}
            </div>
          </div>
          {resumoMes.total > 0 && (
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#5b7a8f" }}>
                Total estimado
              </div>
              <div className="text-[16px] font-extrabold" style={{ color: COR_PRIMARY }}>
                {formatBRL(resumoMes.total)}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "grid" ? (
        <>
          {/* Grid */}
          <div
            key={`${cursor.getFullYear()}-${cursor.getMonth()}`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className={`mx-3 mt-3 rounded-[20px] bg-[var(--surface)] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.4)] ${
              slideDir === "left"
                ? "animate-in slide-in-from-right-4 fade-in duration-200"
                : slideDir === "right"
                  ? "animate-in slide-in-from-left-4 fade-in duration-200"
                  : ""
            }`}
          >
            <div className="grid grid-cols-7 gap-1 pb-2">
              {DIAS.map((d, i) => (
                <div
                  key={d}
                  className="text-center text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: i === 0 || i === 6 ? "#c44569" : "#5b7a8f" }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((cell, i) => {
                const items = getMarcasDoDia(cell.date);
                const isToday = sameDay(cell.date, today);
                const isSelected = selected && sameDay(cell.date, selected);
                const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
                const tipos = Array.from(new Set(items.map((m) => m.tipo)));
                return (
                  <button
                    key={i}
                    onClick={() => handleDayClick(cell)}
                    className="relative mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-[14px] font-semibold transition active:scale-90"
                    style={{
                      background: isSelected
                        ? COR_PRIMARY
                        : isToday
                          ? COR_BG_SOFT
                          : isWeekend && cell.inMonth
                            ? "rgba(196,69,105,0.05)"
                            : "transparent",
                      color: isSelected
                        ? "#fff"
                        : !cell.inMonth
                          ? "var(--muted-fg)"
                          : isWeekend
                            ? "#c44569"
                            : "var(--text-dark)",
                      opacity: !cell.inMonth && !isSelected ? 0.7 : 1,
                      border: isToday && !isSelected
                        ? `2px solid ${COR_PRIMARY}`
                        : "2px solid transparent",
                    }}
                  >
                    <span className="leading-none">{cell.date.getDate()}</span>
                    {tipos.length > 0 && (
                      <span className="absolute bottom-1 flex gap-0.5">
                        {items.length > 3 ? (
                          <span
                            className="text-[8px] font-extrabold leading-none rounded-full px-1 py-0.5"
                            style={{
                              background: isSelected ? "#fff" : COR_PRIMARY,
                              color: isSelected ? COR_PRIMARY : "#fff",
                            }}
                          >
                            {items.length}
                          </span>
                        ) : (
                          tipos.map((t) => (
                            <span
                              key={t}
                              className="block h-1.5 w-1.5 rounded-full"
                              style={{ background: isSelected ? "#fff" : TIPO_COR[t] }}
                            />
                          ))
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de marcas do dia */}
          <section className="mx-3 mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
            {selected && (
              <div className="mb-2 text-[12px] font-semibold" style={{ color: "#5b7a8f" }}>
                {selected.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </div>
            )}
            {selected && selectedMarcas.length > 0 ? (
              <ul className="space-y-2">
                {selectedMarcas.map((m) => (
                  <li
                    key={m.id}
                    className="flex overflow-hidden rounded-[14px] bg-[var(--surface)] shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
                  >
                    <div className="w-1.5 shrink-0" style={{ background: TIPO_COR[m.tipo] }} />
                    <div className="flex-1 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[15px] font-bold" style={{ color: COR_PRIMARY }}>
                          {TIPO_LABEL[m.tipo]}
                          {m.delegadaArea ? ` · ${m.delegadaArea}` : ""}
                        </div>
                        <div className="text-[12px] font-bold" style={{ color: "var(--text-dark)" }}>
                          {formatHora(m.data)}
                        </div>
                      </div>
                      {m.valor > 0 && (
                        <div className="mt-0.5 text-[13px] font-bold" style={{ color: "var(--text-dark)" }}>
                          {formatBRL(m.valor)}
                        </div>
                      )}
                      {m.observacao && (
                        <p
                          className="mt-1 text-[12px] italic leading-snug"
                          style={{ color: "#5b7a8f" }}
                        >
                          {m.observacao}
                        </p>
                      )}

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="rounded-[10px] border-2 bg-[var(--surface)] px-3 py-1 text-[12px] font-bold"
                          style={{ borderColor: COR_PRIMARY, color: COR_PRIMARY }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(m)}
                          className="rounded-[10px] px-3 py-1 text-[12px] font-bold"
                          style={{ color: "#E74C3C" }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarX size={40} style={{ color: "#5b7a8f" }} />
                <p className="mt-2 text-[14px] font-semibold" style={{ color: "#5b7a8f" }}>
                  Nenhuma marca neste dia
                </p>
                <button
                  onClick={openNew}
                  className="mt-3 rounded-full px-4 py-1.5 text-[12px] font-bold text-white"
                  style={{ background: COR_PRIMARY }}
                >
                  + Adicionar marca
                </button>
              </div>
            )}
          </section>
        </>
      ) : (
        // Agenda infinita — todas as marcas, agrupadas por mês com header pegajoso.
        <section className="mx-3 mt-3">
          {agendaInfinita.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarX size={40} style={{ color: "#5b7a8f" }} />
              <p className="mt-2 text-[14px] font-semibold" style={{ color: "#5b7a8f" }}>
                Nenhuma marca registrada
              </p>
              <button
                onClick={openNew}
                className="mt-3 rounded-full px-4 py-1.5 text-[12px] font-bold text-white"
                style={{ background: COR_PRIMARY }}
              >
                + Adicionar primeira marca
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {agendaInfinita.map((grupo) => (
                <div key={grupo.mesKey}>
                  <div
                    className="sticky top-0 z-10 -mx-3 mb-2 px-3 py-1 text-[12px] font-bold uppercase tracking-wider backdrop-blur"
                    style={{
                      color: COR_PRIMARY,
                      background: "color-mix(in oklab, var(--bg) 88%, transparent)",
                    }}
                  >
                    {grupo.mesLabel}{" "}
                    <span className="font-normal" style={{ color: "#5b7a8f" }}>
                      · {grupo.itens.length}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {grupo.itens.map((m) => {
                      const d = new Date(m.data);
                      const isPast = d.getTime() < Date.now();
                      return (
                        <li
                          key={m.id}
                          onClick={() => openEdit(m)}
                          className="flex overflow-hidden rounded-[14px] bg-[var(--surface)] shadow-[0_2px_12px_rgba(0,0,0,0.12)] active:scale-[0.99] transition cursor-pointer"
                          style={{ opacity: isPast ? 0.7 : 1 }}
                        >
                          <div
                            className="w-1.5 shrink-0"
                            style={{ background: TIPO_COR[m.tipo] }}
                          />
                          <div
                            className="flex w-14 flex-col items-center justify-center py-2"
                            style={{ background: COR_BG_SOFT, color: COR_PRIMARY }}
                          >
                            <div className="text-[10px] font-bold uppercase">
                              {DIAS[d.getDay()]}
                            </div>
                            <div className="text-[20px] font-extrabold leading-none">
                              {String(d.getDate()).padStart(2, "0")}
                            </div>
                          </div>
                          <div className="flex-1 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div
                                className="text-[14px] font-bold"
                                style={{ color: COR_PRIMARY }}
                              >
                                {TIPO_LABEL[m.tipo]}
                              </div>
                              <div
                                className="text-[12px] font-bold"
                                style={{ color: "var(--text-dark)" }}
                              >
                                {formatHora(m.data)}
                              </div>
                            </div>
                            {m.valor > 0 && (
                              <div
                                className="text-[12px] font-bold"
                                style={{ color: "var(--text-dark)" }}
                              >
                                {formatBRL(m.valor)}
                              </div>
                            )}
                            {m.observacao && (
                              <p
                                className="mt-1 text-[12px] italic leading-snug"
                                style={{ color: "#5b7a8f" }}
                              >
                                {m.observacao}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}


      {/* FAB */}
      <button
        aria-label="Nova marca"
        onClick={openNew}
        className="fixed right-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(46,107,138,0.5)] active:scale-95 transition"
        style={{ background: COR_PRIMARY, bottom: 80 }}
      >
        <Plus size={26} />
      </button>

      <MarcarModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        initialMarca={editing}
        initialDate={newDate}
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: COR_PRIMARY }}>
              Excluir escala
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir esta escala? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} style={{ background: "#E74C3C" }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
