import { gerarPlantoesDoMes, loadEscalas, type PlantaoEntry } from "@/lib/escala-trabalho";
import { loadEventos, type EventoPersonalizado } from "@/lib/eventos-personalizados";

export type TipoEventoProximo = "plantão" | "compromisso";

export type EventoProximo = {
  id: string;
  titulo: string;
  data: Date;
  hora: string;
  tipo: TipoEventoProximo;
  cor: string;
  diasRestantes: number;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function diasRestantes(data: Date): number {
  const hoje = startOfDay(new Date());
  const alvo = startOfDay(data);
  const ms = alvo.getTime() - hoje.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function fmtHora(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function gerarMesesFuturos(quantidade: number): { year: number; month: number }[] {
  const hoje = new Date();
  const meses: { year: number; month: number }[] = [];
  for (let i = 0; i < quantidade; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    meses.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return meses;
}

/**
 * Retorna os próximos N plantões e compromissos futuros (a partir do início do dia atual),
 * ordenados por data/hora crescente.
 */
export function listarProximosEventos(limite = 5): EventoProximo[] {
  const regras = loadEscalas();
  const eventos = loadEventos();
  const inicioHoje = startOfDay(new Date()).getTime();

  const plantoes: EventoProximo[] = [];
  for (const { year, month } of gerarMesesFuturos(3)) {
    const dias = gerarPlantoesDoMes(regras, year, month);
    for (const dia of dias.values()) {
      for (const p of dia.plantoes) {
        // Só lista plantões avulsos (adicionados manualmente em um dia);
        // escalas recorrentes/ordinárias ficam apenas no calendário.
        if (!p.regra.avulso) continue;
        const ts = p.inicio.getTime();
        if (ts < inicioHoje) continue;
        plantoes.push({
          id: `${p.regra.id}_${ts}`,
          titulo: p.regra.local,
          data: p.inicio,
          hora: `${fmtHora(p.inicio)} → ${fmtHora(p.fim)}`,
          tipo: "plantão",
          cor: p.regra.cor,
          diasRestantes: diasRestantes(p.inicio),
        });
      }
    }
  }

  const compromissos: EventoProximo[] = eventos
    .filter((ev) => new Date(ev.data).getTime() >= inicioHoje)
    .map((ev) => {
      const d = new Date(ev.data);
      return {
        id: ev.id,
        titulo: ev.titulo,
        data: d,
        hora: fmtHora(d),
        tipo: "compromisso",
        cor: "#7C3AED",
        diasRestantes: diasRestantes(d),
      };
    });

  const todos = [...plantoes, ...compromissos].sort((a, b) => a.data.getTime() - b.data.getTime());

  return todos.slice(0, limite);
}

export function textoDiasRestantes(dias: number): string {
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `Faltam ${dias} dias`;
}
