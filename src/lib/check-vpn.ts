// Verifica se a intranet PMESP está acessível — proxy para "VPN AnyConnect conectada".
// Faz um fetch no-cors com timeout curto: se resolver, há rota até a intranet;
// se falhar (TypeError de rede), provavelmente a VPN está desligada.

const PROBE_URL =
  "https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/";

export async function isIntranetReachable(timeoutMs = 3500): Promise<boolean> {
  if (typeof fetch === "undefined") return false;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    await fetch(PROBE_URL, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: ctrl.signal,
      // evita cache do SW
      credentials: "omit",
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}
