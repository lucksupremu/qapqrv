import { get, set } from "idb-keyval";
import type { Escala } from "./escala";

export type EscalaHistoricoItem = {
  escala: Escala;
  consultadoEm: number; // epoch ms
  favorito?: boolean;
};

const HISTORICO_KEY = "qapqrv:escala:historico";
const MAX = 50;

export async function lerHistorico(): Promise<EscalaHistoricoItem[]> {
  try {
    const v = (await get<EscalaHistoricoItem[]>(HISTORICO_KEY)) ?? [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function salvarHistorico(list: EscalaHistoricoItem[]): Promise<void> {
  await set(HISTORICO_KEY, list.slice(0, MAX));
}

export async function adicionarConsulta(escala: Escala): Promise<EscalaHistoricoItem[]> {
  const atual = await lerHistorico();
  const semDuplicado = atual.filter((it) => it.escala.id !== escala.id);
  const novo: EscalaHistoricoItem = {
    escala,
    consultadoEm: Date.now(),
    favorito: atual.find((it) => it.escala.id === escala.id)?.favorito,
  };
  const next = [novo, ...semDuplicado].slice(0, MAX);
  await salvarHistorico(next);
  return next;
}

export async function alternarFavorito(id: string): Promise<EscalaHistoricoItem[]> {
  const atual = await lerHistorico();
  const next = atual.map((it) =>
    it.escala.id === id ? { ...it, favorito: !it.favorito } : it,
  );
  await salvarHistorico(next);
  return next;
}

export async function removerConsulta(id: string): Promise<EscalaHistoricoItem[]> {
  const atual = await lerHistorico();
  const next = atual.filter((it) => it.escala.id !== id);
  await salvarHistorico(next);
  return next;
}
