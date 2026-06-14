// Gerenciador global do evento `beforeinstallprompt`.
// O evento dispara UMA vez por carregamento de página. Se cada componente
// criar seu próprio listener via hook, quem montar depois NÃO recebe nada.
// Aqui guardamos o evento em módulo singleton e notificamos todos os
// inscritos (Home, menu lateral, banner, Configurações).

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Listener = () => void;

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<Listener>();
let initialized = false;

function notify() {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Estado inicial: app já instalado?
  try {
    const mql = window.matchMedia?.("(display-mode: standalone)").matches;
    const iosStandalone = (window.navigator as unknown as { standalone?: boolean })
      .standalone === true;
    installed = !!mql || iosStandalone;
  } catch {
    /* ignore */
  }

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export function initPwaInstallManager() {
  init();
}

export function subscribePwaInstall(listener: Listener): () => void {
  init();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPwaInstallState() {
  return { canPrompt: !!deferred, installed };
}

export async function promptPwaInstall(): Promise<
  "accepted" | "dismissed" | "unavailable"
> {
  if (!deferred) return "unavailable";
  const evt = deferred;
  try {
    await evt.prompt();
    const choice = await evt.userChoice;
    // Spec: evento só pode ser usado uma vez
    deferred = null;
    if (choice.outcome === "accepted") installed = true;
    notify();
    return choice.outcome;
  } catch {
    deferred = null;
    notify();
    return "unavailable";
  }
}
