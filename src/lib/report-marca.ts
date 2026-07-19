// Envia sinal anônimo ao backend quando o usuário marca uma escala.
// Usado para detectar picos e disparar aviso "outros estão se inscrevendo".

import { supabase } from "@/integrations/supabase/client";
import type { TipoMarca } from "@/lib/marcas";

const DEVICE_ID_KEY = "qapqrv_device_id";

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2);
  }
}

function normalizeTipo(tipo: TipoMarca): "dejem" | "delegada" {
  return tipo === "dejem" ? "dejem" : "delegada";
}

/** Fire-and-forget. Nunca lança nem bloqueia UX. */
export function reportMarcaEvent(tipo: TipoMarca, dataISO?: string): void {
  if (typeof window === "undefined") return;
  try {
    const data_alvo = dataISO ? dataISO.slice(0, 10) : null;
    void supabase.functions
      .invoke("report-marca", {
        method: "POST",
        body: {
          device_id: getDeviceId(),
          tipo: normalizeTipo(tipo),
          data_alvo,
        },
      })
      .catch(() => {
        /* silencioso */
      });
  } catch {
    /* silencioso */
  }
}
