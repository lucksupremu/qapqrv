// Sistema de avaliação inteligente.
// Pede review na Play Store apenas quando:
//  - o app foi instalado há ≥ 5 dias
//  - usuário salvou ≥ 3 marcas
//  - nunca pediu antes (ou usuário escolheu "depois" há ≥ 30 dias)
//  - não houve erro recente (últimos 2 min)
import { Capacitor } from "@capacitor/core";
import { loadMarcas } from "@/lib/marcas";
import { toast } from "sonner";

const KEY_INSTALL = "review:install_date";
const KEY_LAST_ASK = "review:last_ask";
const KEY_DONE = "review:done";
const KEY_LAST_ERROR = "review:last_error";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=br.com.qapqrv.app";

const MIN_DAYS_INSTALLED = 5;
const MIN_MARCAS = 3;
const MIN_DAYS_BETWEEN_ASKS = 30;
const ERROR_COOLDOWN_MS = 2 * 60 * 1000;

function getOrInitInstallDate(): number {
  try {
    const raw = window.localStorage.getItem(KEY_INSTALL);
    if (raw) return Number(raw);
    const now = Date.now();
    window.localStorage.setItem(KEY_INSTALL, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

/** Componentes chamam isso após erros importantes (ex.: falha download escala). */
export function reportRecentError() {
  try {
    window.localStorage.setItem(KEY_LAST_ERROR, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function hadRecentError(): boolean {
  try {
    const raw = window.localStorage.getItem(KEY_LAST_ERROR);
    if (!raw) return false;
    return Date.now() - Number(raw) < ERROR_COOLDOWN_MS;
  } catch {
    return false;
  }
}

async function openNativeReview(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    // Tenta plugin oficial @capacitor-community/in-app-review se estiver
    // instalado no APK. Import dinâmico por string montada em runtime para
    // evitar erro de typecheck quando o pacote não está nas devDependencies.
    const pkg = ["@capacitor-community", "in-app-review"].join("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(/* @vite-ignore */ pkg).catch(() => null);
    if (mod && typeof mod.InAppReview?.requestReview === "function") {
      await mod.InAppReview.requestReview();
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}


function openPlayStoreFallback() {
  try {
    window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
  } catch {
    /* ignore */
  }
}

export async function maybePromptReview(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(KEY_DONE) === "1") return;

    const installAt = getOrInitInstallDate();
    const daysInstalled = (Date.now() - installAt) / (1000 * 60 * 60 * 24);
    if (daysInstalled < MIN_DAYS_INSTALLED) return;

    const marcasCount = loadMarcas().length;
    if (marcasCount < MIN_MARCAS) return;

    if (hadRecentError()) return;

    const lastAsk = Number(window.localStorage.getItem(KEY_LAST_ASK) || 0);
    if (lastAsk > 0) {
      const days = (Date.now() - lastAsk) / (1000 * 60 * 60 * 24);
      if (days < MIN_DAYS_BETWEEN_ASKS) return;
    }

    window.localStorage.setItem(KEY_LAST_ASK, String(Date.now()));

    // Tenta a janela nativa do Google Play primeiro.
    const ok = await openNativeReview();
    if (ok) {
      window.localStorage.setItem(KEY_DONE, "1");
      return;
    }

    // Fallback: toast com ação.
    toast("Está curtindo o QAP, QRV!?", {
      description: "Sua avaliação ajuda muito outros policiais a encontrarem o app.",
      duration: 12000,
      action: {
        label: "Avaliar",
        onClick: () => {
          openPlayStoreFallback();
          try {
            window.localStorage.setItem(KEY_DONE, "1");
          } catch {}
        },
      },
      cancel: {
        label: "Depois",
        onClick: () => {},
      },
    });
  } catch {
    /* ignore */
  }
}
