export type PresetTurno = {
  trabalho: number;
  folga: number;
  horaInicio: number;
  minutoInicio: number;
};

export type EscalaPreset = {
  id: string;
  label: string;
  descricao: string;
  turno: PresetTurno;
  alternada?: PresetTurno;
};

export const ESCALA_PRESETS: EscalaPreset[] = [
  {
    id: "12x24-12x48",
    label: "12x24 / 12x48 (dia + noite)",
    descricao: "Dia: 12h trabalho × 24h folga · Noite: 12h trabalho × 48h folga",
    turno: { trabalho: 12, folga: 24, horaInicio: 7, minutoInicio: 0 },
    alternada: { trabalho: 12, folga: 48, horaInicio: 19, minutoInicio: 0 },
  },
  {
    id: "12x36",
    label: "12x36",
    descricao: "12h de trabalho × 36h de folga",
    turno: { trabalho: 12, folga: 36, horaInicio: 7, minutoInicio: 0 },
  },
  {
    id: "24x72",
    label: "24x72",
    descricao: "24h de trabalho × 72h de folga",
    turno: { trabalho: 24, folga: 72, horaInicio: 7, minutoInicio: 0 },
  },
  {
    id: "24x48",
    label: "24x48",
    descricao: "24h de trabalho × 48h de folga",
    turno: { trabalho: 24, folga: 48, horaInicio: 7, minutoInicio: 0 },
  },
  {
    id: "custom",
    label: "Personalizada",
    descricao: "Defina seu próprio padrão de trabalho e folga",
    turno: { trabalho: 12, folga: 24, horaInicio: 7, minutoInicio: 0 },
  },
];

export function detectarPreset(
  trabalho: number,
  folga: number,
  horaInicio: number,
  minutoInicio: number,
  alternada?: {
    trabalho: number;
    folga: number;
    horaInicio: number;
    minutoInicio?: number;
  } | null,
): string {
  for (const p of ESCALA_PRESETS) {
    if (p.id === "custom") continue;
    const t = p.turno;
    if (
      t.trabalho === trabalho &&
      t.folga === folga &&
      t.horaInicio === horaInicio &&
      t.minutoInicio === minutoInicio
    ) {
      if (p.alternada && alternada) {
        const a = p.alternada;
        if (
          a.trabalho === alternada.trabalho &&
          a.folga === alternada.folga &&
          a.horaInicio === alternada.horaInicio &&
          a.minutoInicio === (alternada.minutoInicio ?? 0)
        ) {
          return p.id;
        }
      } else if (!p.alternada && !alternada) {
        return p.id;
      }
    }
  }
  return "custom";
}
