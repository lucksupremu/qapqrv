export type TipoMarca = "dejem" | "delegada_capital" | "delegada_outras";

export type Marca = {
  id: string;
  tipo: TipoMarca;
  data: string; // ISO
  valor: number;
  delegadaArea: string;
  delegadaStartHour: string;
  delegadaBaseHourAmount: number;
  reminderAt: string | null;
  criado: string; // ISO
};

export const MARCAS_STORAGE_KEY = "marcas_atividade_d";

export function loadMarcas(): Marca[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MARCAS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Marca[]) : [];
  } catch {
    return [];
  }
}

export function saveMarcas(marcas: Marca[]) {
  try {
    window.localStorage.setItem(MARCAS_STORAGE_KEY, JSON.stringify(marcas));
  } catch {
    /* ignore */
  }
}
