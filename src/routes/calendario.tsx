import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarX,
  Plus,
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
  type Marca,
  type TipoMarca,
  loadMarcas,
  saveMarcas,
} from "@/lib/marcas";
import { cancelForMarca } from "@/lib/notifications-adapter";

export const Route = createFileRoute("/calendario")({
  head: () => ({ meta: [{ title: "Calendário — QAP, QRV!" }] }),
  component: CalendarScreen,
});

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

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

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatBR(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type CellDay = { date: Date; inMonth: boolean };

function buildGrid(year: number, month: number): CellDay[] {
  // Usa 12:00 (meio-dia) como âncora para evitar pulos de dia causados por
  // mudanças de fuso/horário de verão — qualquer ajuste de até ~12h ainda
  // cai no mesmo dia civil.
  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const startWeekday = first.getDay(); // 0 = Sun
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
  const [selected, setSelected] = useState<Date | null>(null);
  const [marcas, setMarcas] = useState<Marca[]>(() => loadMarcas());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Marca | null>(null);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Marca | null>(null);

  useEffect(() => {
    saveMarcas(marcas);
  }, [marcas]);

  const grid = useMemo(
    () => buildGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const marcasPorDia = useMemo(() => {
    const map = new Map<string, Marca[]>();
    for (const m of marcas) {
      const d = new Date(m.data);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(k) ?? [];
      list.push(m);
      map.set(k, list);
    }
    return map;
  }, [marcas]);

  const getMarcasDoDia = (d: Date) =>
    marcasPorDia.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];

  const selectedMarcas = selected ? getMarcasDoDia(selected) : [];

  const goPrev = () =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const goNext = () =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));

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

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: "var(--bg)" }}
    >
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3">
        <button
          aria-label="Voltar"
          onClick={() => navigate({ to: "/" })}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="flex-1 text-center text-[18px] font-bold"
          style={{ color: "#2e6b8a" }}
        >
          Calendário
        </h1>
        <span className="h-10 w-10" aria-hidden />
      </header>

      {/* Navegação de mês */}
      <div className="flex items-center justify-center gap-6 py-2">
        <button
          aria-label="Mês anterior"
          onClick={goPrev}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ChevronLeft size={20} />
        </button>
        <span
          className="min-w-[160px] text-center text-[18px] font-bold"
          style={{ color: "#2e6b8a" }}
        >
          {MESES[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          aria-label="Próximo mês"
          onClick={goNext}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Grid */}
      <div className="mx-3 mt-2 rounded-[20px] bg-[#ffffff] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-7 gap-1 pb-2">
          {DIAS.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "#5b7a8f" }}
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
            const tipos = Array.from(new Set(items.map((m) => m.tipo)));
            return (
              <button
                key={i}
                onClick={() => handleDayClick(cell)}
                className="relative mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-[14px] font-semibold transition"
                style={{
                  background: isSelected ? "#2e6b8a" : "transparent",
                  color: isSelected
                    ? "#fff"
                    : cell.inMonth
                      ? "#0f2535"
                      : "#C0C8D5",
                  border:
                    isToday && !isSelected ? "2px solid #2e6b8a" : "2px solid transparent",
                }}
              >
                <span className="leading-none">{cell.date.getDate()}</span>
                {tipos.length > 0 && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {tipos.map((t) => (
                      <span
                        key={t}
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{ background: TIPO_COR[t] }}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de marcas do dia */}
      <section className="mx-3 mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
        {selected && selectedMarcas.length > 0 ? (
          <ul className="space-y-2">
            {selectedMarcas.map((m) => (
              <li
                key={m.id}
                className="flex overflow-hidden rounded-[14px] bg-[#ffffff] shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
              >
                <div
                  className="w-1.5 shrink-0"
                  style={{ background: TIPO_COR[m.tipo] }}
                />
                <div className="flex-1 p-3">
                  <div
                    className="text-[15px] font-bold"
                    style={{ color: "#2e6b8a" }}
                  >
                    {TIPO_LABEL[m.tipo]}
                    {m.delegadaArea ? ` · ${m.delegadaArea}` : ""}
                  </div>
                  <div className="text-[12px]" style={{ color: "#5b7a8f" }}>
                    {formatBR(m.data)}
                  </div>
                  {m.valor > 0 && (
                    <div
                      className="mt-0.5 text-[13px] font-bold"
                      style={{ color: "#0f2535" }}
                    >
                      {formatBRL(m.valor)}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openEdit(m)}
                      className="rounded-[10px] border-2 bg-[#ffffff] px-3 py-1 text-[12px] font-bold"
                      style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
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
            <p
              className="mt-2 text-[14px] font-semibold"
              style={{ color: "#5b7a8f" }}
            >
              Nenhuma marca neste dia
            </p>
          </div>
        )}
      </section>

      {/* FAB */}
      <button
        aria-label="Nova marca"
        onClick={openNew}
        className="fixed right-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(79,70,229,0.5)] active:scale-95"
        style={{ background: "#2e6b8a", bottom: 80 }}
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
            <AlertDialogTitle style={{ color: "#2e6b8a" }}>
              Excluir escala
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir a escala do ID {confirmDelete?.id}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ background: "#E74C3C" }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
