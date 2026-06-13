// Atualiza o badge numérico do ícone do app (PWA instalada).
// Conta marcas + eventos personalizados agendados para HOJE.
// Suporte: Chrome/Edge desktop, Android (em PWA instalada), alguns navegadores Samsung.
// Em navegadores sem suporte vira no-op silencioso.

import { loadMarcas } from "@/lib/marcas";
import { loadEventos } from "@/lib/eventos-personalizados";

type BadgeNav = Navigator & {
  setAppBadge?: (n?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

function isToday(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function countTodayItems(): number {
  try {
    const marcasHoje = loadMarcas().filter((m) => isToday(m.data)).length;
    const eventosHoje = loadEventos().filter((e) => isToday(e.data)).length;
    return marcasHoje + eventosHoje;
  } catch {
    return 0;
  }
}

export async function updateAppBadge(): Promise<void> {
  if (typeof navigator === "undefined") return;
  const nav = navigator as BadgeNav;
  if (!nav.setAppBadge) return;
  const n = countTodayItems();
  try {
    if (n > 0) await nav.setAppBadge(n);
    else await nav.clearAppBadge?.();
  } catch {
    /* ignore */
  }
}

let installed = false;
export function installAppBadgeUpdater(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const tick = () => void updateAppBadge();

  tick();
  window.addEventListener("marcas-changed", tick);
  window.addEventListener("eventos-changed", tick);
  window.addEventListener("focus", tick);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });

  // Recalcula à meia-noite + a cada 1h como fallback.
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    5,
  );
  window.setTimeout(() => {
    tick();
    window.setInterval(tick, 60 * 60 * 1000);
  }, nextMidnight.getTime() - now.getTime());
}
