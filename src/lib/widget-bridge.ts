// Bridge para o widget Android "Próxima Escala".
// No web é no-op; no APK chama o plugin nativo WidgetData.
import { registerPlugin, Capacitor } from "@capacitor/core";
import { loadMarcas, type Marca } from "@/lib/marcas";

interface WidgetDataPlugin {
  setProximaEscala(options: {
    tipo: string;
    data: string; // ISO
    valor: number;
  }): Promise<{ ok: boolean }>;
  clear(): Promise<{ ok: boolean }>;
}

const WidgetData = registerPlugin<WidgetDataPlugin>("WidgetData");

function rotuloTipo(t: Marca["tipo"]): string {
  if (t === "dejem") return "Dejem";
  if (t === "delegada" || t === "delegada_capital" || t === "delegada_outras") return "Delegada";
  return t;
}

/** Encontra a próxima marca futura (>= agora) e envia ao widget. */
export async function syncWidgetFromMarcas(marcas?: Marca[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const lista = marcas ?? loadMarcas();
    const agora = Date.now();
    const futuras = lista
      .filter((m) => new Date(m.data).getTime() >= agora)
      .sort((a, b) => +new Date(a.data) - +new Date(b.data));
    const prox = futuras[0];
    if (!prox) {
      await WidgetData.clear().catch(() => {});
      return;
    }
    await WidgetData.setProximaEscala({
      tipo: rotuloTipo(prox.tipo),
      data: prox.data,
      valor: prox.valor ?? 0,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
