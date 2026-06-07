export type EventoPersonalizado = {
  id: string;
  titulo: string;
  data: string; // ISO (data + hora)
  observacao?: string;
  lembreteMin: number | null; // minutos antes; null = sem lembrete
  criado: string; // ISO
};

export const EVENTOS_STORAGE_KEY = "eventos_personalizados_v1";

export function loadEventos(): EventoPersonalizado[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EVENTOS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EventoPersonalizado[]) : [];
  } catch {
    return [];
  }
}

export function saveEventos(list: EventoPersonalizado[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EVENTOS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("eventos-changed"));
  } catch {
    /* ignore */
  }
}

export function upsertEvento(e: EventoPersonalizado): EventoPersonalizado[] {
  const cur = loadEventos();
  const exists = cur.some((x) => x.id === e.id);
  const next = exists ? cur.map((x) => (x.id === e.id ? e : x)) : [...cur, e];
  saveEventos(next);
  return next;
}

export function removeEvento(id: string): EventoPersonalizado[] {
  const next = loadEventos().filter((x) => x.id !== id);
  saveEventos(next);
  return next;
}

export const LEMBRETE_OPCOES: { value: number | null; label: string }[] = [
  { value: null, label: "Sem lembrete" },
  { value: 0, label: "No horário" },
  { value: 30, label: "30 min antes" },
  { value: 60, label: "1 hora antes" },
  { value: 120, label: "2 horas antes" },
  { value: 1440, label: "1 dia antes" },
];
