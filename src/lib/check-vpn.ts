// Verifica se a intranet PMESP está acessível — proxy para "VPN AnyConnect conectada".
// Usa duas estratégias em paralelo (a primeira a responder vence):
// 1) fetch no-cors → resolve com resposta opaca se há rota até o host.
// 2) <img> probe → resolve no onload/onerror SOMENTE quando o servidor responde
//    (DNS+TCP+TLS OK). Se a VPN está desligada, nenhum dos dois resolve a tempo.

const PROBE_HOST = "https://sistemasadmin.intranet.policiamilitar.sp.gov.br";
const PROBE_URL = `${PROBE_HOST}/Escala/`;
// favicon costuma existir e é leve; bom alvo p/ <img> probe
const PROBE_IMG = `${PROBE_HOST}/favicon.ico`;

function fetchProbe(timeoutMs: number): Promise<boolean> {
  if (typeof fetch === "undefined") return Promise.resolve(false);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(`${PROBE_URL}?_=${Date.now()}`, {
    method: "GET",
    mode: "no-cors",
    cache: "no-store",
    signal: ctrl.signal,
    credentials: "omit",
  })
    .then(() => true)
    .catch(() => false)
    .finally(() => clearTimeout(t));
}

function imgProbe(timeoutMs: number): Promise<boolean> {
  if (typeof Image === "undefined") return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      img.src = ""; // cancela
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      finish(true);
    };
    // onerror dispara mesmo p/ 404 — significa que o servidor RESPONDEU,
    // logo a rota até a intranet existe (VPN ligada).
    img.onerror = () => {
      clearTimeout(timer);
      finish(true);
    };
    // referrerPolicy reduz chance de bloqueio
    try {
      (img as HTMLImageElement).referrerPolicy = "no-referrer";
    } catch {
      /* noop */
    }
    img.src = `${PROBE_IMG}?_=${Date.now()}`;
  });
}

export async function isIntranetReachable(timeoutMs = 3500): Promise<boolean> {
  // Quem responder true primeiro vence; senão aguarda ambos e usa OR.
  const results = await Promise.allSettled([
    fetchProbe(timeoutMs),
    imgProbe(timeoutMs),
  ]);
  return results.some((r) => r.status === "fulfilled" && r.value === true);
}
