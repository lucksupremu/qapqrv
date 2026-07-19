import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CalendarPlus,
  Menu,
  Mail,
  Wallet,
  BookOpen,
  BookOpenCheck,
  FolderDown,
  Loader2,
  Search,
  ArrowRight,
  ShieldCheck,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";

import { type Marca, loadMarcas, saveMarcas } from "@/lib/marcas";
import { useDrawer } from "@/components/side-drawer";
import { useIsNative } from "@/hooks/use-is-native";
import appLogo from "@/assets/app-logo.png";

import { openInAppBrowser, isNativeApp } from "@/lib/in-app-browser";
import { upsertEscala, lerLista } from "@/lib/escalas-baixadas";
import { guardIntranet } from "@/lib/vpn-guard";
import { openAnyConnect } from "@/lib/open-anyconnect";

import { EscalaCalendarCard } from "@/components/escala-calendar-card";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { InstallPushOptIn } from "@/components/install-push-opt-in";
import { ShareAppBanner } from "@/components/share-app-banner";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QAP, QRV! — Escalas PMESP" },
      {
        name: "description",
        content: "Acompanhe suas escalas Dejem e Delegada da PMESP em um só lugar.",
      },
    ],
  }),
  component: HomeScreen,
});

type ActionBlock = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  nativeOnly?: boolean;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
  },
};

function HomeScreen() {
  const navigate = useNavigate();
  const { setOpen: setDrawerOpen } = useDrawer();
  const [idEscala, setIdEscala] = useState("");
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const native = useIsNative();
  const [theme, setThemeState] = useState<Theme>("light");
  const { canPrompt, promptInstall } = usePwaInstall();

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("install") !== "1") return;
    params.delete("install");
    const q = params.toString();
    const url = window.location.pathname + (q ? `?${q}` : "") + window.location.hash;
    window.history.replaceState({}, "", url);

    const t = window.setTimeout(() => {
      if (canPrompt) {
        void promptInstall();
      } else {
        toast.info("Este navegador não permite instalar com 1 toque.");
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [canPrompt, promptInstall]);

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

  const handleConsultar = async () => {
    const id = idEscala.trim();
    if (!id) {
      toast.error("Informe o ID da escala.");
      return;
    }

    const url = `https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/arrelconesc.aspx?${encodeURIComponent(id)}`;

    try {
      upsertEscala({
        id,
        url,
        titulo: `Escala ${id}`,
        dataSalva: new Date().toISOString(),
      });
    } catch {
      /* ignore */
    }

    setConsultando(true);
    const nativeApp = isNativeApp();

    if (!nativeApp) {
      if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      setConsultando(false);
      return;
    }

    const loadingId = toast.loading(`Baixando escala #${id}…`);
    try {
      try {
        const { warmupIntranetSession } = await import("@/lib/intranet-warmup");
        await warmupIntranetSession();
      } catch {
        /* ignore */
      }
      const { InAppWebView } = await import("@/lib/in-app-webview");
      const result = await InAppWebView.downloadPdf({ id, url });

      try {
        const lista = lerLista();
        const next = lista.map((x) =>
          x.id === id
            ? {
                ...x,
                hasPdf: true,
                pdfSize: result.size,
                pdfMime: result.mime || "application/pdf",
                localPath: result.path,
              }
            : x,
        );
        const { salvarLista } = await import("@/lib/escalas-baixadas");
        salvarLista(next);
      } catch {
        /* ignore */
      }

      toast.success(`Escala #${id} baixada. Abrindo…`, { id: loadingId });
      try {
        await InAppWebView.openPdfExternal({ path: result.path });
      } catch (extErr) {
        console.warn("Leitor externo falhou, tentando visualizador interno", extErr);
        try {
          await InAppWebView.openPdf({ path: result.path, title: `Escala ${id}` });
        } catch (intErr) {
          const m = intErr instanceof Error ? intErr.message : String(intErr);
          toast.error(`PDF baixado, mas não foi possível abri-lo: ${m}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || `Não foi possível baixar a escala #${id}.`, { id: loadingId });
    } finally {
      setConsultando(false);
    }
  };

  const blocos: ActionBlock[] = [
    {
      label: "Marcar / Desmarcar\nDejem/Delegada",
      icon: CalendarPlus,
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
      onClick: () =>
        openInAppBrowser("https://correio.policiamilitar.sp.gov.br/iwaredir.nsf", {
          titulo: "Email iNotes",
          modo: "webview",
          forceMobileUA: true,
        }),
    },
    {
      label: "Escalas baixadas",
      icon: FolderDown,
      onClick: () => navigate({ to: "/escalas-baixadas" }),
      nativeOnly: true,
    },
    {
      label: "Vídeo tutorial ANYCONECT",
      icon: BookOpen,
      onClick: () => navigate({ to: "/anyconnect" }),
    },
    {
      label: "Folha de Pagamento",
      icon: Wallet,
      onClick: () =>
        openInAppBrowser(
          "https://www.ciaf.policiamilitar.sp.gov.br/flp/mobile/mobileview.aspx",
          { titulo: "Folha de Pagamento", modo: "webview", forceMobileUA: true },
        ),
    },
    {
      label: "PVT",
      icon: BookOpenCheck,
      onClick: () =>
        window.open("https://ead.pmesp.org/login/index.php", "_blank", "noopener,noreferrer"),
    },
  ].filter((b) => native || !(b as { nativeOnly?: boolean }).nativeOnly);

  return (
    <div
      className="min-h-screen pb-24 font-body"
      style={{ background: "var(--tactical-bg)", color: "var(--tactical-text)" }}
    >
      {/* HEADER tático */}
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-lg animate-pulse"
              style={{ background: "var(--tactical-accent)", opacity: 0.25 }}
            />
            <img
              src={appLogo}
              alt="QAP, QRV!"
              className="relative h-12 w-12 rounded-full object-cover border-2 no-dark-filter"
              style={{ borderColor: "var(--tactical-accent)" }}
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--tactical-muted)" }}>
              Status: Operacional
            </p>
            <h1 className="font-tactical text-[22px] font-normal uppercase tracking-wide leading-none">
              QAP, QRV!
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border transition active:scale-95"
            style={{
              background: "var(--tactical-card-2)",
              borderColor: "var(--tactical-border)",
              color: "var(--tactical-muted)",
            }}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            aria-label="Menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border transition active:scale-95"
            style={{
              background: "var(--tactical-card-2)",
              borderColor: "var(--tactical-border)",
              color: "var(--tactical-muted)",
            }}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5 px-5 pt-2"
      >
        <motion.div variants={itemVariants}>
          <BrowserHintBanner />
        </motion.div>
        <motion.div variants={itemVariants}>
          <PwaInstallBanner />
        </motion.div>
        <motion.div variants={itemVariants}>
          <InstallPushOptIn />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ShareAppBanner />
        </motion.div>

        {/* CONSULTA — hero card */}
        <motion.section variants={itemVariants}>
          <div
            className="relative overflow-hidden rounded-[24px] p-5"
            style={{
              background: "var(--tactical-card)",
              border: "1px solid var(--tactical-border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="pointer-events-none absolute -right-8 -bottom-8 h-40 w-40 rounded-full blur-3xl"
              style={{ background: "var(--tactical-accent)", opacity: 0.12 }}
            />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-tactical text-lg tracking-wide uppercase" style={{ color: "var(--tactical-accent)" }}>
                  Consulta de Escala
                </h2>
                <InlineVpnChip />
              </div>

              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--tactical-muted)" }}
                  />
                  <input
                    id="id-escala-input"
                    inputMode="numeric"
                    placeholder="Insira o ID da Escala"
                    value={idEscala}
                    onChange={(e) => setIdEscala(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleConsultar()}
                    className="w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm font-semibold transition-all focus:outline-none"
                    style={{
                      background: "var(--tactical-bg)",
                      borderColor: "var(--tactical-border)",
                      color: "var(--tactical-text)",
                    }}
                  />
                </div>
                <button
                  onClick={handleConsultar}
                  disabled={consultando}
                  aria-label="Consultar"
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition active:scale-95 disabled:opacity-70"
                  style={{
                    background: "var(--tactical-accent)",
                    color: "#ffffff",
                    boxShadow: "var(--tactical-glow)",
                  }}
                >
                  {consultando ? (
                    <Loader2 size={22} className="animate-spin" strokeWidth={3} />
                  ) : (
                    <ArrowRight size={22} strokeWidth={3} />
                  )}
                </button>
              </div>

              <VpnDetailRow />
            </div>
          </div>
        </motion.section>

        {/* ACESSO RÁPIDO — grid tático */}
        <motion.section variants={itemVariants}>
          <h3 className="font-tactical text-sm tracking-[0.18em] uppercase mb-3" style={{ color: "var(--tactical-muted)" }}>
            Acesso Rápido
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {blocos.map((b) => (
              <button
                key={b.label}
                onClick={b.onClick}
                className="group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all active:scale-95"
                style={{
                  background: "var(--tactical-card)",
                  borderColor: "var(--tactical-border)",
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors"
                  style={{
                    background: "rgba(232, 93, 58, 0.12)",
                    borderColor: "rgba(232, 93, 58, 0.25)",
                    color: "var(--tactical-accent)",
                  }}
                >
                  <b.icon size={20} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold uppercase leading-tight tracking-wide whitespace-pre-line">
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* MINHA ESCALA — calendário de plantões */}
        <motion.section variants={itemVariants}>
          <div
            className="rounded-[24px] border p-4"
            style={{
              background: "var(--tactical-card)",
              borderColor: "var(--tactical-border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="font-tactical text-sm tracking-[0.18em] uppercase" style={{ color: "var(--tactical-muted)" }}>
                Minha Escala
              </h3>
            </div>
            <EscalaCalendarCard />
          </div>
        </motion.section>
      </motion.main>
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
      <div
        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1"
        style={{ background: "var(--tactical-card-2)", borderColor: "var(--tactical-border)" }}
      >
        <Loader2 size={10} className="animate-spin" style={{ color: "var(--tactical-muted)" }} />
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--tactical-muted)" }}>
          Verificando
        </span>
      </div>
    );
  }
  if (status === "on") {
    return (
      <div className="flex items-center gap-2 rounded-full border px-2.5 py-1" style={{ borderColor: "#10b981", background: "rgba(16, 185, 129, 0.12)" }}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
          VPN Ativa
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-full border px-2.5 py-1" style={{ borderColor: "#ef4444", background: "rgba(239, 68, 68, 0.15)" }}>
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      <span className="text-[9px] font-black uppercase tracking-wider text-red-400">
        VPN Off
      </span>
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
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition active:scale-[0.98]"
        aria-expanded={expanded}
        style={{ borderColor: "#ef4444", background: "rgba(239, 68, 68, 0.85)" }}
      >
        <ShieldCheck size={12} className="text-white" />
        <span className="text-[10px] font-black uppercase tracking-wider text-white">
          Conectar VPN — acesso às escalas
        </span>
        <Info size={11} className="text-white/90" />
      </button>

      {expanded && (
        <div
          className="mt-2 flex flex-col gap-2 rounded-2xl border px-3 py-2.5 animate-fade-in"
          style={{ borderColor: "rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.12)" }}
        >
          <p className="text-[11px] font-semibold leading-snug text-red-50">
            Conecte ao Cisco AnyConnect para liberar o acesso às escalas.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAnyConnect()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white active:scale-95"
            >
              <ShieldCheck size={12} />
              Abrir Cisco AnyConnect
            </button>
            {isNative && (
              <button
                onClick={refresh}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider active:scale-95"
                style={{ borderColor: "rgba(239, 68, 68, 0.6)", background: "var(--tactical-card)", color: "var(--tactical-text)" }}
              >
                Verificar conexão
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BrowserHintBanner() {
  const native = useIsNative();
  const [open, setOpen] = useState(false);
  const KEY = "home_browser_hint_dismissed_v1";

  useEffect(() => {
    if (typeof window === "undefined" || native) return;
    try {
      if (!window.localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, [native]);

  if (!open || native) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div className="pt-1">
      <div
        className="flex items-start gap-2.5 rounded-2xl border px-3.5 py-2.5"
        style={{ borderColor: "rgba(232, 93, 58, 0.25)", background: "rgba(232, 93, 58, 0.08)" }}
      >
        <Info
          size={16}
          className="mt-0.5 shrink-0"
          style={{ color: "var(--tactical-accent)" }}
        />
        <p className="flex-1 text-[12px] leading-snug" style={{ color: "var(--tactical-text)" }}>
          Se o Chrome bloquear o acesso a escalas ou à marcação Dejem/Delegada,
          abra em outro navegador (Firefox ou Edge).
        </p>
        <button
          aria-label="Dispensar"
          onClick={dismiss}
          className="-mr-1 -mt-1 shrink-0 rounded-full p-1 transition"
          style={{ color: "var(--tactical-muted)" }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
