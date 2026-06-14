// Atalhos dinâmicos do PWA (long-press no ícone do app).
// Usa navigator.dynamicShortcuts (Chromium 134+, Android e desktop).
// Em navegadores sem suporte, vira no-op.

type Shortcut = {
  name: string;
  short_name?: string;
  description?: string;
  url: string;
  icons?: { src: string; sizes?: string; type?: string }[];
};

type DynamicShortcutsAPI = {
  set?: (shortcuts: Shortcut[]) => Promise<void>;
  delete?: (urlOrName: string) => Promise<void>;
};

function api(): DynamicShortcutsAPI | null {
  if (typeof navigator === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ds = (navigator as any).dynamicShortcuts as DynamicShortcutsAPI | undefined;
  return ds && typeof ds.set === "function" ? ds : null;
}

const ICON = [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }];

const BASE: Shortcut[] = [
  {
    name: "Abrir calendário",
    short_name: "Calendário",
    description: "Ver marcas do mês",
    url: "/calendario",
    icons: ICON,
  },
  {
    name: "Nova marca",
    short_name: "Nova marca",
    description: "Registrar nova marca de atividade",
    url: "/calendario?action=nova-marca",
    icons: ICON,
  },
];

/** Atualiza os atalhos do app de acordo com a rota atual. */
export async function updateDynamicShortcuts(pathname: string): Promise<void> {
  const ds = api();
  if (!ds?.set) return;
  const extra: Shortcut[] = [];
  if (pathname.startsWith("/calendario")) {
    extra.push({
      name: "Registrar marca de hoje",
      short_name: "Marca hoje",
      url: "/calendario?action=nova-marca",
      icons: ICON,
    });
  } else if (pathname.startsWith("/escalas-baixadas") || pathname.startsWith("/escala-viewer")) {
    extra.push({
      name: "Última escala baixada",
      short_name: "Última escala",
      url: "/escalas-baixadas",
      icons: ICON,
    });
  }
  try {
    await ds.set([...extra, ...BASE].slice(0, 4));
  } catch {
    /* ignore */
  }
}
