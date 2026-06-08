// Classificação central de erros de rede usada pelas telas
// que dependem da intranet PMESP ou de chamadas externas.

export type NetworkErrorKind = "offline" | "vpn-off" | "server-down" | "unknown";

export type NetworkErrorInfo = {
  kind: NetworkErrorKind;
  title: string;
  message: string;
};

const INFO: Record<NetworkErrorKind, { title: string; message: string }> = {
  offline: {
    title: "Sem conexão",
    message: "Você está sem internet. Verifique o Wi-Fi ou os dados móveis e tente novamente.",
  },
  "vpn-off": {
    title: "VPN desligada",
    message: "Este sistema só abre com o AnyConnect ativo. Ligue a VPN e tente novamente.",
  },
  "server-down": {
    title: "Servidor PMESP fora do ar",
    message:
      "A intranet não respondeu. Pode ser instabilidade temporária — tente novamente em alguns minutos.",
  },
  unknown: {
    title: "Erro ao carregar",
    message: "Não foi possível abrir o conteúdo agora.",
  },
};

/**
 * Heurística para classificar uma falha. Em casos sem detalhe, retorna `unknown`.
 * Use `kind` direto quando a tela souber o que aconteceu (ex: timeout do iframe ⇒ vpn-off).
 */
export function classifyNetworkError(err: unknown): NetworkErrorKind {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  if (msg.includes("network") || msg.includes("failed to fetch")) return "offline";
  if (msg.includes("timeout") || msg.includes("aborted")) return "vpn-off";
  if (msg.includes("5") && msg.includes("status")) return "server-down";
  return "unknown";
}

export function describeNetworkError(kind: NetworkErrorKind): NetworkErrorInfo {
  return { kind, ...INFO[kind] };
}
