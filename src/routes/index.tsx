import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { toast } from "sonner";
import {
  Calendar,
  CalendarPlus,
  Menu,
  Globe,
  Mail,
  Wallet,
  BookOpen,
  FolderDown,
  Loader2,
  Search,
  ArrowRight,
  ShieldCheck,
  Info,
  type LucideIcon,
} from "lucide-react";

import { type Marca, loadMarcas, saveMarcas } from "@/lib/marcas";
import { useDrawer } from "@/components/side-drawer";
import { useIsNative } from "@/hooks/use-is-native";
import appLogo from "@/assets/app-logo.png";

import { openInAppBrowser, isNativeApp } from "@/lib/in-app-browser";
import { salvarEscalaEmBackground } from "@/lib/escala-download";
import { guardIntranet } from "@/lib/vpn-guard";
import { openAnyConnect } from "@/lib/open-anyconnect";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QAP, QRV! — Escalas PMESP" },
      {
        name: "description",
        content:
          "Acompanhe suas escalas Dejem e Delegada da PMESP em um só lugar.",
      },
    ],
  }),
  component: HomeScreen,
});

type ActionBlock = {
  label: string;
  icon: LucideIcon;
  gradient: string;
  shadow: string;
  onClick: () => void;
  nativeOnly?: boolean;
};

function HomeScreen() {
  const navigate = useNavigate();
  const { setOpen: setDrawerOpen } = useDrawer();
  const [idEscala, setIdEscala] = useState("");
  // Inicia vazio para casar com o HTML do SSR (sem acesso a localStorage).
  // Após hidratar, o useEffect abaixo popula a lista — evita hydration mismatch
  // que estava derrubando os event handlers da Home em alguns Chromes Android.
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const native = useIsNative();
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setThemeState(next);
  };


  useEffect(() => {
    setMarcas(loadMarcas());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveMarcas(marcas);
  }, [marcas, hydrated]);

  // Recarrega marcas ao voltar para a aba/rota (ex.: depois de adicionar
  // uma escala em /calendario) sem precisar recarregar a página.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => setMarcas(loadMarcas());
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === "marcas_atividade_d") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const handleConsultar = () => {
    const id = idEscala.trim();
    if (!id) {
      toast.error("Informe o ID da escala.");
      return;
    }

    const url = `https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/arrelconesc.aspx?${encodeURIComponent(id)}`;

    setConsultando(true);
    void guardIntranet(() => {
      if (isNativeApp()) {
        void openInAppBrowser(url, { titulo: `Escala ${id}` });
      } else if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      setTimeout(() => {
        // Salvar offline só faz sentido no APK (no web o fetch da intranet
        // bate em CORS e a função não consegue persistir o PDF).
        if (isNativeApp()) {
          void salvarEscalaEmBackground(id, url).finally(() => setConsultando(false));
        } else {
          setConsultando(false);
        }
      }, 0);
    }, `a escala #${id}`).finally(() => {
      // se o guard recusou (toast), libera o botão
      setTimeout(() => setConsultando(false), 300);
    });
  };


  // Paleta sistemática: primário (azul institucional) e accent (dourado do logo),
  // alternados. Adeus arco-íris.
  const GRAD_PRIMARY = "var(--gradient-primary)";
  const GRAD_GOLD = "var(--gradient-gold)";
  const SHADOW_PRIMARY = "var(--shadow-glow)";
  const SHADOW_GOLD = "var(--shadow-glow-gold)";

  const blocos: ActionBlock[] = [
    {
      label: "Marcar / Desmarcar\nDejem/Delegada",
      icon: CalendarPlus,
      gradient: GRAD_PRIMARY,
      shadow: SHADOW_PRIMARY,
      onClick: () =>
        void guardIntranet(
          () =>
            openInAppBrowser(
              "https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/EscOpeDel.aspx",
              { titulo: "Marcar / Desmarcar" },
            ),
          "Marcar / Desmarcar",
        ),
    },
    {
      label: "Email iNotes",
      icon: Mail,
      gradient: GRAD_GOLD,
      shadow: SHADOW_GOLD,
      onClick: () =>
        void guardIntranet(
          () =>
            openInAppBrowser("https://correio.policiamilitar.sp.gov.br/iwaredir.nsf", {
              titulo: "Email iNotes",
            }),
          "o Email iNotes",
        ),
    },
    {
      label: "Calendário",
      icon: Calendar,
      gradient: GRAD_PRIMARY,
      shadow: SHADOW_PRIMARY,
      onClick: () => navigate({ to: "/calendario" }),
    },
    {
      label: "Escalas baixadas",
      icon: FolderDown,
      gradient: GRAD_GOLD,
      shadow: SHADOW_GOLD,
      onClick: () => navigate({ to: "/escalas-baixadas" }),
      nativeOnly: true,
    },
    {
      label: "Guia AnyConnect",
      icon: BookOpen,
      gradient: GRAD_PRIMARY,
      shadow: SHADOW_PRIMARY,
      onClick: () => navigate({ to: "/anyconnect" }),
    },
    {
      label: "Folha de Pagamento",
      icon: Wallet,
      gradient: GRAD_GOLD,
      shadow: SHADOW_GOLD,
      onClick: () =>
        void guardIntranet(
          () =>
            openInAppBrowser(
              "https://www.ciaf.policiamilitar.sp.gov.br/folhadepagamento/autenticacaosegura.aspx",
              { titulo: "Folha de Pagamento" },
            ),
          "a Folha de Pagamento",
        ),
    },
  ].filter((b) => native || !(b as { nativeOnly?: boolean }).nativeOnly);

  return (
    <div
      className="min-h-screen pb-8 text-slate-900 dark:text-slate-100 bg-[#f1f5fb] dark:bg-[#050b18]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* HEADER tático */}
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-500/25 blur-lg animate-pulse" />
            <img
              src={appLogo}
              alt="QAP, QRV!"
              className="relative h-11 w-11 rounded-full object-cover border border-amber-500/40 no-dark-filter"
            />
          </div>
          <div>
            <h1 className="font-display text-[18px] font-extrabold uppercase tracking-tight leading-none text-slate-900 dark:text-white">
              QAP, QRV!
            </h1>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-500">
              Ferramentas Operacionais
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-amber-400 transition active:scale-95"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            aria-label="Menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 transition active:scale-95"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* CONSULTA — card tático com glow dourado */}
      <section className="px-5 pt-2">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-white/5 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 p-5 shadow-sm dark:shadow-none">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="mb-4 flex items-center justify-between">
            <label
              htmlFor="id-escala-input"
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500"
            >
              Consulta Operacional

            </label>
            <InlineVpnChip />
          </div>

          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                id="id-escala-input"
                inputMode="numeric"
                placeholder="Insira o ID da Escala"
                value={idEscala}
                onChange={(e) => setIdEscala(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleConsultar()}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800/80 dark:bg-[#020617] py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all focus:border-amber-500/50 focus:outline-none focus:ring-4 focus:ring-amber-500/10"
              />

            </div>
            <button
              onClick={handleConsultar}
              disabled={consultando}
              aria-label="Consultar"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-black shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-70"
            >
              {consultando ? <Loader2 size={20} className="animate-spin" strokeWidth={3} /> : <ArrowRight size={20} strokeWidth={3} />}
            </button>
          </div>

          <VpnDetailRow />
        </div>
      </section>

      {/* PRÓXIMAS ESCALAS */}
      <section className="px-5 mt-6">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Próximas Escalas
          </h2>
          <button
            onClick={() => navigate({ to: "/calendario" })}
            className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500"
          >
            Ver tudo →
          </button>
        </div>
        {(() => {
          const now = Date.now();
          const proximas = marcas
            .filter((m) => {
              const t = new Date(m.data).getTime();
              return !Number.isNaN(t) && t >= now;
            })
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .slice(0, 5);

          if (proximas.length === 0) {
            return (
              <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/30 p-4 shadow-sm dark:shadow-none">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#020617]">
                  <Calendar size={18} className="text-slate-400 dark:text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Sem escalas próximas</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-600">Toque em "Ver tudo" para configurar.</p>
                </div>
              </div>
            );
          }

          const TIPO_LABEL: Record<string, string> = {
            dejem: "Dejem",
            delegada: "Delegada",
            delegada_capital: "Delegada Capital",
            delegada_outras: "Delegada",
          };
          const TIPO_COR: Record<string, string> = {
            dejem: "#3498DB",
            delegada: "#2ECC71",
            delegada_capital: "#2ECC71",
            delegada_outras: "#E67E22",
          };

          const startOfDay = (d: Date) => {
            const x = new Date(d);
            x.setHours(0, 0, 0, 0);
            return x.getTime();
          };
          const today0 = startOfDay(new Date());

          return (
            <ul className="space-y-2">
              {proximas.map((m) => {
                const d = new Date(m.data);
                const diasFalta = Math.round((startOfDay(d) - today0) / 86400000);
                const label =
                  diasFalta === 0 ? "Hoje" : diasFalta === 1 ? "Amanhã" : `Em ${diasFalta} dias`;
                const cor = TIPO_COR[m.tipo] ?? "#5b7a8f";
                return (
                  <li
                    key={m.id}
                    onClick={() => navigate({ to: "/calendario" })}
                    className="flex cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40 shadow-sm dark:shadow-none transition active:scale-[0.99]"
                  >
                    <div className="w-1.5 shrink-0" style={{ background: cor }} />
                    <div className="flex flex-1 items-center gap-3 p-3">
                      <div
                        className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-white"
                        style={{ background: cor }}
                      >
                        <span className="text-[16px] font-bold leading-none">
                          {d.getDate().toString().padStart(2, "0")}
                        </span>
                        <span className="mt-0.5 text-[9px] font-bold uppercase leading-none">
                          {d.toLocaleString("pt-BR", { month: "short" }).replace(".", "")}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-slate-900 dark:text-slate-100">
                          {TIPO_LABEL[m.tipo] ?? "Escala"}
                        </p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-500">
                          {d.toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {m.valor > 0
                            ? ` · ${m.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          diasFalta <= 1
                            ? "text-white"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                        style={diasFalta <= 1 ? { background: cor } : undefined}
                      >
                        {label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        })()}
      </section>

      {/* ACESSO RÁPIDO — grid tático */}
      <section className="px-5 mt-6">
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Acesso Rápido
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {blocos.map((b, i) => {
            const gold = i % 2 === 0;
            return (
              <button
                key={b.label}
                onClick={b.onClick}
                className="group flex flex-col items-start gap-3 rounded-3xl border border-white/5 bg-slate-900/40 p-4 text-left transition-all hover:bg-slate-900/70 active:scale-95"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                    gold
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  }`}
                >
                  <b.icon size={20} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-200 whitespace-pre-line">
                  {b.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-8 text-center">
        <button
          onClick={() => navigate({ to: "/privacidade" })}
          className="text-[11px] uppercase tracking-wider text-slate-600 underline underline-offset-4 decoration-slate-800"
        >
          Política de Privacidade
        </button>
      </footer>
    </div>
  );
}

function InlineVpnChip() {
  const isNative = useIsNative();
  const [status, setStatus] = useState<"checking" | "on" | "off" | "unknown">("checking");
  useEffect(() => {
    if (!isNative) return;
    let active = true;
    void (async () => {
      const { isVpnActive } = await import("@/lib/vpn-status");
      const r = await isVpnActive();
      if (!active) return;
      setStatus(r === null ? "unknown" : r ? "on" : "off");
    })();
    return () => {
      active = false;
    };
  }, [isNative]);

  if (!isNative) return null;

  if (status === "checking") {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1">
        <Loader2 size={10} className="animate-spin text-slate-500" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Verificando</span>
      </div>
    );
  }
  if (status === "on") {
    return (
      <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">VPN Ativa</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">VPN Off</span>
    </div>
  );
}

function VpnDetailRow() {
  const isNative = useIsNative();
  const [status, setStatus] = useState<"checking" | "on" | "off" | "unknown">("checking");
  const [expanded, setExpanded] = useState(false);

  const refresh = async () => {
    setStatus("checking");
    const { isVpnActive } = await import("@/lib/vpn-status");
    const r = await isVpnActive();
    setStatus(r === null ? "unknown" : r ? "on" : "off");
  };

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  if (status === "on" || status === "checking") return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 transition active:scale-[0.98]"
        aria-expanded={expanded}
      >
        <ShieldCheck size={12} className="text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
          Conecte a VPN para acessar a intranet
        </span>
        <Info size={11} className="text-amber-400/70" />
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 animate-fade-in">
          <p className="text-[11px] leading-snug text-amber-200/90">
            Abra o Cisco AnyConnect, toque em <span className="font-bold">Conectar</span> e aguarde o cadeado verde.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAnyConnect()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-black active:scale-95"
            >
              <ShieldCheck size={12} />
              Abrir AnyConnect
            </button>
            {isNative && (
              <button
                onClick={refresh}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 active:scale-95"
              >
                Verificar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



