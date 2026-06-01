export type EscalaTurno = {
  trabalho: number; // horas trabalhadas
  folga: number; // horas de folga
  horaInicio: number; // 0..23
};

export type EscalaRegra = {
  id: string;
  local: string;
  cor: string;
  trabalho: number;
  folga: number;
  horaInicio: number;
  dataInicial: string; // yyyy-mm-dd
  dataFinal: string; // yyyy-mm-dd
  alternada?: EscalaTurno;
};

const STORAGE_KEY = "qap-escalas-trabalho";

export const ESCALA_CORES: { label: string; value: string }[] = [
  { label: "Vermelho", value: "#e53935" },
  { label: "Azul", value: "#1e88e5" },
  { label: "Verde", value: "#2ECC71" },
  { label: "Magenta", value: "#d81b60" },
  { label: "Laranja", value: "#fb8c00" },
  { label: "Ciano", value: "#26c6da" },
  { label: "Roxo", value: "#8e24aa" },
  { label: "Amarelo", value: "#fbc02d" },
];

export function loadEscalas(): EscalaRegra[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EscalaRegra[]) : [];
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

function parseISODateAtHour(iso: string, hour: number): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hour, 0, 0, 0);
}

export type DiaPlantao = {
  date: Date;
  plantoes: Array<{ regra: EscalaRegra; horaInicio: number }>;
};

/**
 * Gera os inícios de plantão dentro de um mês visível.
 * Para cada regra, parte de (dataInicial, horaInicio) e soma (trabalho+folga)
 * em horas até passar de dataFinal. Se a regra tiver `alternada`, intercala
 * turno A e turno B na mesma cadência.
 */
export function gerarPlantoesDoMes(
  regras: EscalaRegra[],
  year: number,
  month: number,
): Map<string, DiaPlantao> {
  const map = new Map<string, DiaPlantao>();
  const fimMes = new Date(year, month + 1, 1, 0, 0, 0, 0).getTime();
  const inicioMes = new Date(year, month, 1, 0, 0, 0, 0).getTime();

  for (const regra of regras) {
    const inicioRegra = parseISODateAtHour(regra.dataInicial, regra.horaInicio);
    const finalRegra = parseISODateAtHour(regra.dataFinal, 23);
    finalRegra.setMinutes(59, 59, 999);

    const turnos: EscalaTurno[] = [
      { trabalho: regra.trabalho, folga: regra.folga, horaInicio: regra.horaInicio },
    ];
    if (regra.alternada) turnos.push(regra.alternada);

    let cursor = new Date(inicioRegra);
    let i = 0;
    const HARD_LIMIT = 5000; // safety
    let count = 0;
    while (cursor.getTime() <= finalRegra.getTime() && count < HARD_LIMIT) {
      const t = turnos[i % turnos.length];
      // Aplica horaInicio do turno atual à data corrente (mantendo o dia)
      const startOfShift = new Date(cursor);
      startOfShift.setHours(t.horaInicio, 0, 0, 0);

      const ts = startOfShift.getTime();
      if (ts >= inicioMes && ts < fimMes) {
        const key = `${startOfShift.getFullYear()}-${startOfShift.getMonth()}-${startOfShift.getDate()}`;
        const entry = map.get(key) ?? { date: new Date(startOfShift), plantoes: [] };
        entry.plantoes.push({ regra, horaInicio: t.horaInicio });
        map.set(key, entry);
      }

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
