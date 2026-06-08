// Tema do app: 'auto' (segue o sistema), 'light' ou 'dark'.
// Persiste em localStorage e escuta mudanças do sistema quando em modo auto.

export type ThemeMode = "auto" | "light" | "dark";
export type Theme = "light" | "dark";

const KEY = "app_theme_mode";
const LEGACY_KEY = "app_theme";

function readSystem(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  try {
    const m = localStorage.getItem(KEY);
    if (m === "auto" || m === "dark" || m === "light") return m;
    // Migração: chave antiga era "light" | "dark"
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === "dark" || legacy === "light") return legacy;
  } catch {
    /* ignore */
  }
  return "auto";
}

export function resolveTheme(mode: ThemeMode = getStoredMode()): Theme {
  return mode === "auto" ? readSystem() : mode;
}

function applyResolved(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = theme;
}

export function setThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
  applyResolved(resolveTheme(mode));
  try {
    window.dispatchEvent(new CustomEvent("theme-mode-changed", { detail: mode }));
  } catch {
    /* ignore */
  }
}

/** Aplica o tema atual (chamar em boot) e mantém em sincronia com o sistema quando em auto. */
export function initTheme(): () => void {
  if (typeof window === "undefined") return () => {};
  applyResolved(resolveTheme());
  let mql: MediaQueryList | null = null;
  const handler = () => {
    if (getStoredMode() === "auto") applyResolved(readSystem());
  };
  try {
    mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", handler);
  } catch {
    /* ignore */
  }
  return () => {
    try {
      mql?.removeEventListener("change", handler);
    } catch {
      /* ignore */
    }
  };
}

// ===== Compat: API antiga (alguns componentes ainda importam) =====

export function getStoredTheme(): Theme {
  return resolveTheme();
}

export function applyTheme(theme: Theme) {
  setThemeMode(theme);
}

export function toggleTheme(): Theme {
  const next: Theme = resolveTheme() === "dark" ? "light" : "dark";
  setThemeMode(next);
  return next;
}

/** Inline script string, injected in <head> to prevent flash of wrong theme. */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=localStorage.getItem('${KEY}');if(m!=='auto'&&m!=='dark'&&m!=='light'){var l=localStorage.getItem('${LEGACY_KEY}');m=(l==='dark'||l==='light')?l:'auto';}var t=m;if(m==='auto'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}document.documentElement.style.colorScheme=t;}catch(e){}})();`;
