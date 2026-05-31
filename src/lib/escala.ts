export type Escala = {
  id: string;
  tipo: string;
  data: string; // ISO yyyy-mm-dd
  horarioInicial: string; // HH:mm
  horarioFinal: string; // HH:mm
  quantidadeHoras: number;
  unidade: string;
  valorHora: number;
  valorTotal: number;
};

/**
 * Stub de consulta. Substitua pela chamada à API oficial quando disponível.
 * Mantém a mesma assinatura: `(id: string) => Promise<Escala | null>`.
 */
export async function consultarEscala(id: string): Promise<Escala | null> {
  await new Promise((r) => setTimeout(r, 600));
  if (!/^\d+$/.test(id)) return null;

  // Mock determinístico baseado no ID, apenas para demonstração visual.
  const seed = Number(id) || 1;
  const horas = 6 + (seed % 7); // 6..12
  const valorHora = 35 + (seed % 25); // 35..59
  const tipos = ["DEJEM", "Delegada"];
  const unidades = ["1º BPM", "5º BPM", "8º BPM", "CPA/M-1", "BPRv"];
  const tipo = tipos[seed % tipos.length];
  const unidade = unidades[seed % unidades.length];
  const hi = 7 + (seed % 12);
  const horarioInicial = `${String(hi).padStart(2, "0")}:00`;
  const horarioFinal = `${String((hi + horas) % 24).padStart(2, "0")}:00`;
  const data = new Date();
  data.setDate(data.getDate() + (seed % 14));

  return {
    id,
    tipo,
    data: data.toISOString().slice(0, 10),
    horarioInicial,
    horarioFinal,
    quantidadeHoras: horas,
    unidade,
    valorHora,
    valorTotal: +(horas * valorHora).toFixed(2),
  };
}

export function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
