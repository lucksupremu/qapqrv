export type EscalaTurno = {
  trabalho: number; // horas trabalhadas
  folga: number; // horas de folga
  horaInicio: number; // 0..23
  minutoInicio?: number; // 0..59 (opcional, default 0)
};

export type EscalaRegra = {
  id: string;
  local: string;
  cor: string;
  trabalho: number;
  folga: number;
  horaInicio: number;
  minutoInicio?: number;
  dataInicial: string; // yyyy-mm-dd
  dataFinal: string; // yyyy-mm-dd
  alternada?: EscalaTurno;
};

const STORAGE_KEY = "qap-escalas-trabalho";

/** Cores fixas do sistema: dia e noite. */
export const COR_DIURNO = "#F59E0B"; // laranja âmbar
export const COR_NOTURNO = "#1E3A8A"; // azul-marinho

/** Compat: paleta legada exposta como [diurno, noturno]. */
export const ESCALA_CORES: { label: string; value: string }[] = [
  { label: "Diurno", value: COR_DIURNO },
  { label: "Noturno", value: COR_NOTURNO },
];

/**
 * Classifica um turno como diurno ou noturno pelo horário do MEIO do plantão.
 * Noturno se o midpoint cair entre 20:00 e 05:59.
 */
export function classificarPeriodo(
  horaInicio: number,
  minutoInicio: number | undefined,
  duracaoHoras: number,
): "dia" | "noite" {
  const startMin = horaInicio * 60 + (minutoInicio ?? 0);
  const midMin = startMin + Math.round((duracaoHoras * 60) / 2);
  const midH = Math.floor((midMin % (24 * 60)) / 60);
  const noturno = midH >= 20 || midH < 6;
  return noturno ? "noite" : "dia";
}

export function corDoTurno(
  horaInicio: number,
  minutoInicio: number | undefined,
  duracaoHoras: number,
): string {
  return classificarPeriodo(horaInicio, minutoInicio, duracaoHoras) === "noite"
    ? COR_NOTURNO
    : COR_DIURNO;
}

function migrarCor(r: EscalaRegra): EscalaRegra {
  const corPrincipal = corDoTurno(r.horaInicio, r.minutoInicio, r.trabalho);
  if (r.cor === corPrincipal) return r;
  return { ...r, cor: corPrincipal };
}

export function loadEscalas(): EscalaRegra[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list = (parsed as EscalaRegra[]).map(migrarCor);
    // persiste migração se algo mudou
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
    return list;
  } catch {
    return [];
  }
}

export function saveEscalas(list: EscalaRegra[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function removeEscala(id: string): EscalaRegra[] {
  const list = loadEscalas().filter((r) => r.id !== id);
  saveEscalas(list);
  return list;
}

function parseISODateAt(iso: string, hour: number, minute: number): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hour, minute, 0, 0);
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export type PlantaoEntry = {
  regra: EscalaRegra;
  tipo: "inicio" | "continuacao";
  inicio: Date;
  fim: Date;
};

export type DiaPlantao = {
  date: Date;
  plantoes: PlantaoEntry[];
};

/**
 * Gera os plantões dentro de um mês visível, marcando início e
 * continuação (dia(s) seguinte(s) quando o serviço atravessa a meia-noite).
 */
export function gerarPlantoesDoMes(
  regras: EscalaRegra[],
  year: number,
  month: number,
): Map<string, DiaPlantao> {
  const map = new Map<string, DiaPlantao>();
  const fimMes = new Date(year, month + 1, 1, 0, 0, 0, 0).getTime();
  const inicioMes = new Date(year, month, 1, 0, 0, 0, 0).getTime();

  const addEntry = (key: string, date: Date, entry: PlantaoEntry) => {
    const cur = map.get(key) ?? { date: new Date(date), plantoes: [] };
    cur.plantoes.push(entry);
    map.set(key, cur);
  };

  for (const regra of regras) {
    const minInicio = regra.minutoInicio ?? 0;
    const inicioRegra = parseISODateAt(regra.dataInicial, regra.horaInicio, minInicio);
    const finalRegra = parseISODateAt(regra.dataFinal, 23, 59);
    finalRegra.setSeconds(59, 999);

    const turnos: EscalaTurno[] = [
      {
        trabalho: regra.trabalho,
        folga: regra.folga,
        horaInicio: regra.horaInicio,
        minutoInicio: minInicio,
      },
    ];
    if (regra.alternada) {
      turnos.push({
        ...regra.alternada,
        minutoInicio: regra.alternada.minutoInicio ?? 0,
      });
    }

    let cursor = new Date(inicioRegra);
    let i = 0;
    const HARD_LIMIT = 5000;
    let count = 0;
    while (cursor.getTime() <= finalRegra.getTime() && count < HARD_LIMIT) {
      const t = turnos[i % turnos.length];
      const startOfShift = new Date(cursor);
      startOfShift.setHours(t.horaInicio, t.minutoInicio ?? 0, 0, 0);
      const endOfShift = new Date(startOfShift.getTime() + t.trabalho * 3600 * 1000);

      const ts = startOfShift.getTime();

      // Marca o dia de início se cair no mês
      if (ts >= inicioMes && ts < fimMes) {
        addEntry(dayKey(startOfShift), startOfShift, {
          regra,
          tipo: "inicio",
          inicio: new Date(startOfShift),
          fim: new Date(endOfShift),
        });
      }

      // Não geramos mais entries de "continuacao" para os dias seguintes.
      // O plantão aparece apenas no dia em que começa — um ícone de Sol/Lua
      // na célula deixa claro se é diurno ou noturno, sem dividir a célula
      // em metades (que confundia escalas como 12x24/12x48).

      // avança trabalho + folga horas
      cursor = new Date(startOfShift.getTime() + (t.trabalho + t.folga) * 3600 * 1000);
      i += 1;
      count += 1;

      if (ts > fimMes && i > turnos.length * 2) break;
    }
  }

  return map;
}

export function newEscalaId(): string {
  return `esc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatHoraMinuto(h: number, m?: number): string {
  return `${String(h).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}`;
}
