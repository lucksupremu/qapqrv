import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  CalendarPlus,
  Menu,
  Globe,
  Mail,
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
      label: "Marcar / Desmarcar",
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
  ].filter((b) => native || !(b as { nativeOnly?: boolean }).nativeOnly);

  return (
    <div className="min-h-screen pb-8" style={{ background: "var(--bg)" }}>
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <img
            src={appLogo}
            alt="QAP, QRV! — Ferramentas Policiais"
            className="h-12 w-12 rounded-2xl object-cover"
            style={{ boxShadow: "var(--shadow-card)" }}
          />
          <h1 className="text-[22px] font-extrabold leading-none tracking-tight" style={{ color: "var(--text-dark)" }}>
            QAP, QRV!
          </h1>
        </div>
        <button
          aria-label="Menu"
          onClick={() => setDrawerOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border transition active:scale-95"
          style={{ background: "var(--surface-2)", color: "var(--primary-light)", borderColor: "var(--border-soft)" }}
        >
          <Menu size={20} />
        </button>
      </header>

      {/* CONSULTA DE ESCALA — layout compacto, label fora do campo */}
      <section
        className="mx-4 mt-2 rounded-[20px] border bg-[#ffffff] p-4"
        style={{ borderColor: "var(--border-soft)", boxShadow: "var(--shadow-card)" }}
      >
        <label
          htmlFor="id-escala-input"
          className="block text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--primary)" }}
        >
          Consultar escala
        </label>

        <div className="mt-2 flex items-stretch gap-2">
          <div
            className="flex flex-1 items-center gap-2 rounded-[12px] border px-3"
            style={{ borderColor: "var(--border-soft)", background: "var(--surface-2)", height: 46 }}
          >
            <Search size={16} style={{ color: "var(--primary-light)" }} />
            <input
              id="id-escala-input"
              inputMode="numeric"
              placeholder="ID da escala"
              value={idEscala}
              onChange={(e) => setIdEscala(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleConsultar()}
              className="w-full bg-transparent text-[15px] font-semibold outline-none placeholder:font-normal"
              style={{ color: "var(--text-dark)" }}
            />
          </div>
          <button
            onClick={handleConsultar}
            disabled={consultando}
            aria-label="Consultar"
            className="flex h-[46px] items-center justify-center gap-2 rounded-[12px] px-4 font-bold text-white transition active:scale-[0.97] disabled:opacity-70"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            {consultando ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          </button>
        </div>

        <VpnBadge />
      </section>

      {/* GRID DE BLOCOS DE AÇÃO */}
      <section className="mx-4 mt-4">
        <h2 className="mb-3 text-[14px] font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
          Acesso rápido
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {blocos.map((b) => (
            <button
              key={b.label}
              onClick={b.onClick}
              className="flex aspect-square flex-col items-center justify-center gap-3 rounded-[20px] border bg-[#ffffff] p-3 transition active:scale-[0.98]"
              style={{ borderColor: "var(--border-soft)", boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="flex h-[60px] w-[60px] items-center justify-center rounded-full text-white"
                style={{ background: b.gradient, boxShadow: b.shadow }}
              >
                <b.icon size={28} />
              </div>
              <span
                className="text-center text-[13px] font-bold leading-tight"
                style={{ color: "var(--text-dark)" }}
              >
                {b.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* PRÓXIMAS ESCALAS */}
      <section className="mx-4 mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
            Próximas escalas
          </h2>
          <button
            onClick={() => navigate({ to: "/calendario" })}
            className="text-[12px] font-bold"
            style={{ color: "var(--primary)" }}
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
              <div
                className="flex items-center gap-3 rounded-[16px] border bg-[#ffffff] p-4"
                style={{ borderColor: "var(--border-soft)", boxShadow: "var(--shadow-card)" }}
              >
                <Calendar size={22} style={{ color: "var(--muted-fg)" }} />
                <div className="flex-1">
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-dark)" }}>
                    Nenhuma escala agendada
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--muted-fg)" }}>
                    Toque em "Ver tudo" para criar uma marcação.
                  </p>
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
                  diasFalta === 0
                    ? "Hoje"
                    : diasFalta === 1
                      ? "Amanhã"
                      : `Em ${diasFalta} dias`;
                const cor = TIPO_COR[m.tipo] ?? "#5b7a8f";
                return (
                  <li
                    key={m.id}
                    onClick={() => navigate({ to: "/calendario" })}
                    className="flex cursor-pointer overflow-hidden rounded-[14px] border bg-[#ffffff] transition active:scale-[0.99]"
                    style={{ borderColor: "var(--border-soft)", boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="w-1.5 shrink-0" style={{ background: cor }} />
                    <div className="flex flex-1 items-center gap-3 p-3">
                      <div
                        className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[12px] text-white"
                        style={{ background: cor }}
                      >
                        <span className="text-[16px] font-bold leading-none">
                          {d.getDate().toString().padStart(2, "0")}
                        </span>
                        <span className="mt-0.5 text-[9px] font-bold uppercase leading-none">
                          {d.toLocaleString("pt-BR", { month: "short" }).replace(".", "")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="truncate text-[14px] font-bold"
                          style={{ color: "var(--text-dark)" }}
                        >
                          {TIPO_LABEL[m.tipo] ?? "Escala"}
                        </p>
                        <p className="text-[12px]" style={{ color: "var(--muted-fg)" }}>
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
                        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          background: diasFalta <= 1 ? cor : "var(--surface-2)",
                          color: diasFalta <= 1 ? "#fff" : "var(--text-dark)",
                        }}
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

      {/* FOOTER */}
      <footer className="mt-8 text-center">
        <button
          onClick={() => navigate({ to: "/privacidade" })}
          className="text-[13px] underline"
          style={{ color: "var(--muted-fg)" }}
        >
          Política de Privacidade
        </button>
      </footer>

    </div>
  );
}

function VpnBadge() {
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

  // VPN ativa: chip verde fininho.
  if (status === "on") {
    return (
      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
          VPN ativa
        </span>
      </div>
    );
  }

  // Estado de verificação: chip neutro.
  if (status === "checking") {
    return (
      <div className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "var(--border-soft)", background: "var(--surface-2)" }}>
        <Loader2 size={12} className="animate-spin" style={{ color: "var(--muted-fg)" }} />
        <span className="text-[12px] font-semibold" style={{ color: "var(--muted-fg)" }}>
          Verificando VPN…
        </span>
      </div>
    );
  }

  // off / unknown: chip clicável que expande detalhes + ação.
  const isOff = status === "off";
  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 transition active:scale-[0.98]"
        aria-expanded={expanded}
      >
        <ShieldCheck size={14} className="text-amber-700 dark:text-amber-300" />
        <span className="text-[12px] font-semibold text-amber-800 dark:text-amber-200">
          {isOff ? "VPN desconectada" : "Conecte a VPN"}
        </span>
        <Info size={12} className="text-amber-700/70 dark:text-amber-300/70" />
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2 rounded-[12px] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 animate-fade-in">
          <p className="text-[12px] leading-snug text-amber-800 dark:text-amber-200">
            Abra o Cisco AnyConnect, toque em <span className="font-semibold">Conectar</span> e
            aguarde o cadeado verde. Depois volte aqui.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAnyConnect()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[12px] font-bold text-white shadow-sm active:scale-[0.97] hover:bg-amber-700"
            >
              <ShieldCheck size={13} />
              Abrir AnyConnect
            </button>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 px-3 py-1.5 text-[12px] font-semibold text-amber-800 dark:text-amber-200 transition active:scale-[0.97] hover:bg-amber-500/20"
            >
              Verificar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


