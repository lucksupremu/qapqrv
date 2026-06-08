export type TipoMarca = "dejem" | "delegada" | "delegada_capital" | "delegada_outras";

export type Marca = {
  id: string;
  tipo: TipoMarca;
  data: string; // ISO
  valor: number;
  reminders?: string[]; // ISO list
  // legacy/optional
  delegadaArea?: string;
  delegadaStartHour?: string;
  delegadaBaseHourAmount?: number;
  reminderAt?: string | null;
  criado: string; // ISO
};

export const MARCAS_STORAGE_KEY = "marcas_atividade_d";

function migrate(m: Marca): Marca {
  if (!m.reminders) {
    m.reminders = m.reminderAt ? [m.reminderAt] : [];
  }
  return m;
}

export function loadMarcas(): Marca[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MARCAS_STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as Marca[]) : [];
    return list.map(migrate);
  } catch {
    return [];
  }
}

export function saveMarcas(marcas: Marca[]) {
  try {
    window.localStorage.setItem(MARCAS_STORAGE_KEY, JSON.stringify(marcas));
    window.dispatchEvent(new CustomEvent("marcas-changed"));
    // Atualiza widget Android com a próxima escala (no-op no web).
    void import("@/lib/widget-bridge").then((m) => m.syncWidgetFromMarcas(marcas)).catch(() => {});

  } catch {
    /* ignore */
  }
}

export const TIPO_LABEL_SHORT: Record<string, string> = {
  dejem: "Dejem",
  delegada: "Delegada",
  delegada_capital: "Delegada Capital",
  delegada_outras: "Outras Delegadas",
};
