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
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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


  const blocos: ActionBlock[] = [
    {
      label: "Marcar / Desmarcar",
      icon: CalendarPlus,
      gradient: "linear-gradient(135deg, #1a5276 0%, #3498db 100%)",
      shadow: "0 0 24px -8px rgba(26,82,118,0.45)",
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
      gradient: "linear-gradient(135deg, #8e44ad 0%, #c39bd3 100%)",
      shadow: "0 0 24px -8px rgba(142,68,173,0.45)",
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
      gradient: "linear-gradient(135deg, #d35400 0%, #f39c12 100%)",
      shadow: "0 0 24px -8px rgba(211,84,0,0.45)",
      onClick: () => navigate({ to: "/calendario" }),
    },
    {
      label: "Escalas baixadas",
      icon: FolderDown,
      gradient: "linear-gradient(135deg, #27ae60 0%, #58d68d 100%)",
      shadow: "0 0 24px -8px rgba(39,174,96,0.45)",
      onClick: () => navigate({ to: "/escalas-baixadas" }),
    },
    {
      label: "Guia AnyConnect",
      icon: BookOpen,
      gradient: "linear-gradient(135deg, #c0392b 0%, #ec7063 100%)",
      shadow: "0 0 24px -8px rgba(192,57,43,0.45)",
      onClick: () => navigate({ to: "/anyconnect" }),
    },
  ];

  return (
    <div className="min-h-screen pb-8" style={{ background: "var(--bg)" }}>
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <img
            src={appLogo}
            alt="QAP, QRV! — Ferramentas Policiais"
            className="h-14 w-14 rounded-2xl object-cover"
            style={{ boxShadow: "var(--shadow-card)" }}
          />
          <div>
            <h1 className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: "var(--text-dark)" }}>
              QAP, QRV!
            </h1>
            <p className="mt-1 text-[12px] font-medium tracking-wide" style={{ color: "var(--muted-fg)" }}>
              Escalas PMESP
            </p>
          </div>
        </div>
        <button
          aria-label="Menu"
          onClick={() => setDrawerOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border transition active:scale-95"
          style={{ background: "var(--surface-2)", color: "var(--primary-light)", borderColor: "var(--border-soft)" }}
        >
          <Menu size={22} />
        </button>
      </header>

      {/* CONSULTA DE ESCALA */}
      <section
        className="mx-4 mt-4 rounded-[20px] border bg-[#ffffff] p-5"
        style={{ borderColor: "var(--border-soft)", boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="text-[14px] font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
          Consultar escala
        </h2>

        <div className="mt-3 flex items-stretch gap-2">
          <div
            className="relative flex-1 rounded-[14px] border px-3 pt-[18px] pb-1"
            style={{ borderColor: "var(--border-soft)", background: "var(--surface-2)", height: 52 }}
          >
            <label
              className="absolute left-3 top-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--primary-light)" }}
            >
              ID da escala
            </label>
            <input
              inputMode="numeric"
              value={idEscala}
              onChange={(e) => setIdEscala(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleConsultar()}
              className="w-full bg-transparent text-[16px] font-semibold outline-none"
              style={{ color: "var(--text-dark)" }}
            />
          </div>
          <button
            onClick={handleConsultar}
            disabled={consultando}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] px-5 font-bold text-white transition active:scale-[0.99] disabled:opacity-70"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            {consultando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Consultando...
              </>
            ) : (
              "Consultar"
            )}
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

  if (status === "on") {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-10 w-10 shrink-0 cursor-help items-center justify-center rounded-full bg-emerald-500/20">
              <ShieldCheck size={18} className="text-emerald-700 dark:text-emerald-300" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="max-w-[200px]">A VPN está ativa e a intranet da PMESP está acessível.</p>
          </TooltipContent>
        </Tooltip>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-emerald-800 dark:text-emerald-200">
            VPN AnyConnect ativa
          </p>
          <p className="text-[12px] font-medium text-emerald-700/90 dark:text-emerald-300/90">
            Tudo pronto para consultar escalas.
          </p>
        </div>
      </div>
    );
  }

  if (status === "off") {
    return (
      <div className="mt-4 flex flex-col gap-3 rounded-[14px] border-2 border-amber-500/50 bg-amber-500/10 px-4 py-3">
        <div className="flex items-start gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-0.5 flex h-10 w-10 shrink-0 cursor-help items-center justify-center rounded-full bg-amber-500/20">
                <ShieldCheck size={18} className="text-amber-700 dark:text-amber-300" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="max-w-[220px]">
                Sem VPN a intranet da PMESP fica inacessível. Conecte o AnyConnect para continuar.
              </p>
            </TooltipContent>
          </Tooltip>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-amber-800 dark:text-amber-200">
              VPN desconectada
            </p>
            <p className="text-[12px] font-medium text-amber-700/90 dark:text-amber-300/90">
              Conecte o AnyConnect antes de consultar.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-amber-600/10 px-3 py-2">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
          <p className="text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">
            <span className="font-bold">Ação necessária:</span> abra o Cisco AnyConnect, toque em{" "}
            <span className="font-semibold">Conectar</span> e aguarde o cadeado verde. Depois volte
            aqui e toque em <span className="font-semibold">Verificar</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => openAnyConnect()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-[12px] font-bold text-white shadow-sm active:scale-[0.97] hover:bg-amber-700"
              >
                <ShieldCheck size={14} />
                Abrir AnyConnect
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Abre o app Cisco AnyConnect para conectar a VPN</p>
            </TooltipContent>
          </Tooltip>
          <button
            onClick={refresh}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/40 px-3 py-2 text-[12px] font-semibold text-amber-800 dark:text-amber-200 transition active:scale-[0.97] hover:bg-amber-500/20"
          >
            Verificar
          </button>
        </div>
      </div>
    );
  }

  // status === "unknown" (web/iOS sem plugin) ou "checking":
  // não há detecção confiável no navegador — apenas orienta o usuário.
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[14px] border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mt-0.5 flex h-10 w-10 shrink-0 cursor-help items-center justify-center rounded-full bg-amber-500/20">
              <ShieldCheck size={18} className="text-amber-700 dark:text-amber-300" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="max-w-[220px]">
              No navegador não é possível verificar a VPN automaticamente — conecte o AnyConnect
              antes de consultar.
            </p>
          </TooltipContent>
        </Tooltip>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-amber-800 dark:text-amber-200">
            Conecte a VPN AnyConnect
          </p>
          <p className="text-[12px] font-medium leading-snug text-amber-700/90 dark:text-amber-300/90">
            Para consultar escalas é necessário estar conectado à VPN da PMESP pelo Cisco
            AnyConnect.
          </p>
        </div>
      </div>
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => openAnyConnect()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-[12px] font-bold text-white shadow-sm active:scale-[0.97] hover:bg-amber-700"
            >
              <ShieldCheck size={14} />
              Abrir AnyConnect
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Abre o Cisco AnyConnect (Android ou iOS)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

