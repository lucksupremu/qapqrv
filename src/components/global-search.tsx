// Busca global: ferramentas + escalas baixadas + histórico + marcas + favoritos.
// Atalho Ctrl/Cmd+K no desktop, ícone de lupa no header em qualquer dispositivo.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, CalendarClock, FileText, History, Bookmark, ClipboardList } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { tools } from "@/lib/tools";
import { loadMarcas, TIPO_LABEL_SHORT, type Marca } from "@/lib/marcas";
import { lerLista, type EscalaSalva } from "@/lib/escalas-baixadas";
import { lerHistorico } from "@/lib/escala-storage";

type Hit = {
  key: string;
  group: "Ferramentas" | "Escalas baixadas" | "Histórico" | "Marcas" | "Favoritos";
  title: string;
  subtitle?: string;
  icon: typeof Search;
  onPick: () => void;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function GlobalSearchButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        aria-label="Buscar"
        onClick={() => setOpen(true)}
        className="rounded-lg p-1.5 hover:bg-white/10 active:bg-white/15 transition"
      >
        <Search className="size-6" />
      </button>
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [baixadas, setBaixadas] = useState<EscalaSalva[]>([]);
  const [historico, setHistorico] = useState<
    Array<{ id: string; nome: string; favorito?: boolean; consultadoEm: number }>
  >([]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setMarcas(loadMarcas());
    setBaixadas(lerLista());
    void lerHistorico().then((items) =>
      setHistorico(
        items.map((it) => ({
          id: it.escala.id,
          nome: `Escala ${it.escala.id} · ${it.escala.tipo}`,
          favorito: it.favorito,
          consultadoEm: it.consultadoEm,
        })),
      ),
    );
  }, [open]);

  const hits: Hit[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out: Hit[] = [];

    // Ferramentas
    for (const t of tools) {
      const hay = `${t.name} ${t.description}`.toLowerCase();
      if (!term || hay.includes(term)) {
        out.push({
          key: `tool:${t.slug}`,
          group: "Ferramentas",
          title: t.name,
          subtitle: t.description,
          icon: CalendarClock,
          onPick: () => {
            onOpenChange(false);
            navigate({ to: "/ferramenta/$slug", params: { slug: t.slug } });
          },
        });
      }
    }

    // Escalas baixadas
    for (const e of baixadas) {
      const title = e.titulo || `Escala ${e.id}`;
      const hay = `${title} ${e.url ?? ""}`.toLowerCase();
      if (!term || hay.includes(term)) {
        out.push({
          key: `bx:${e.id}`,
          group: "Escalas baixadas",
          title,
          subtitle: fmtDate(e.dataSalva ?? e.savedAt),
          icon: FileText,
          onPick: () => {
            onOpenChange(false);
            navigate({ to: "/escala-viewer/$id", params: { id: e.id } });
          },
        });
      }
    }

    // Marcas
    for (const m of marcas) {
      const tipoLabel = TIPO_LABEL_SHORT[m.tipo] ?? "Marca";
      const sub = `${fmtDate(m.data)}${m.valor ? ` · R$ ${m.valor.toFixed(2)}` : ""}`;
      const hay = `${tipoLabel} ${sub}`.toLowerCase();
      if (!term || hay.includes(term)) {
        out.push({
          key: `mc:${m.id}`,
          group: "Marcas",
          title: tipoLabel,
          subtitle: sub,
          icon: ClipboardList,
          onPick: () => {
            onOpenChange(false);
            navigate({ to: "/calendario" });
          },
        });
      }
    }

    // Histórico + Favoritos
    for (const h of historico) {
      const nome = h.nome ?? h.id;
      const hay = nome.toLowerCase();
      if (!term || hay.includes(term)) {
        out.push({
          key: `${h.favorito ? "fav" : "hist"}:${h.id}`,
          group: h.favorito ? "Favoritos" : "Histórico",
          title: nome,
          subtitle: fmtDate(h.consultadoEm),
          icon: h.favorito ? Bookmark : History,
          onPick: () => {
            onOpenChange(false);
            navigate({ to: h.favorito ? "/favoritos" : "/historico" });
          },
        });
      }
    }

    return out.slice(0, 60);
  }, [q, marcas, baixadas, historico, navigate, onOpenChange]);

  const grouped = useMemo(() => {
    const map = new Map<Hit["group"], Hit[]>();
    for (const h of hits) {
      const arr = map.get(h.group) ?? [];
      arr.push(h);
      map.set(h.group, arr);
    }
    return Array.from(map.entries());
  }, [hits]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 overflow-hidden rounded-[18px] p-0">
        <DialogTitle className="sr-only">Buscar</DialogTitle>
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
        >
          <Search size={18} style={{ color: "var(--muted-fg)" }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ferramentas, escalas, marcas…"
            className="w-full bg-transparent text-[15px] outline-none"
            style={{ color: "var(--text-dark)" }}
            aria-label="Termo de busca"
          />
          <kbd
            className="hidden rounded px-1.5 py-0.5 text-[10px] font-bold sm:inline"
            style={{ background: "var(--surface-2)", color: "var(--muted-fg)" }}
          >
            ESC
          </kbd>
        </div>

        <div
          className="max-h-[60vh] overflow-y-auto"
          style={{ background: "var(--surface)" }}
        >
          {grouped.length === 0 ? (
            <div
              className="px-4 py-10 text-center text-[14px]"
              style={{ color: "var(--muted-fg)" }}
            >
              Nada encontrado para "{q}".
            </div>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="py-2">
                <p
                  className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--muted-fg)" }}
                >
                  {group}
                </p>
                {items.map((h) => {
                  const Icon = h.icon;
                  return (
                    <button
                      key={h.key}
                      onClick={h.onPick}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[var(--surface-2)]"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                        style={{ background: "var(--surface-2)", color: "var(--primary)" }}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[14px] font-bold"
                          style={{ color: "var(--text-dark)" }}
                        >
                          {h.title}
                        </span>
                        {h.subtitle && (
                          <span
                            className="block truncate text-[12px]"
                            style={{ color: "var(--muted-fg)" }}
                          >
                            {h.subtitle}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
