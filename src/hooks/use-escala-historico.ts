import { useCallback, useEffect, useState } from "react";
import {
  adicionarConsulta,
  alternarFavorito,
  lerHistorico,
  removerConsulta,
  type EscalaHistoricoItem,
} from "@/lib/escala-storage";
import type { Escala } from "@/lib/escala";

export function useEscalaHistorico() {
  const [items, setItems] = useState<EscalaHistoricoItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    lerHistorico().then((v) => {
      setItems(v);
      setLoaded(true);
    });
  }, []);

  const adicionar = useCallback(async (escala: Escala) => {
    const next = await adicionarConsulta(escala);
    setItems(next);
  }, []);

  const favoritar = useCallback(async (id: string) => {
    const next = await alternarFavorito(id);
    setItems(next);
  }, []);

  const remover = useCallback(async (id: string) => {
    const next = await removerConsulta(id);
    setItems(next);
  }, []);

  return { items, loaded, adicionar, favoritar, remover };
}
