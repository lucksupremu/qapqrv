import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  CalendarPlus,
  Menu,
  Globe,
  Mail,
  KeyRound,
  BookOpen,
  FolderDown,
  Loader2,
  Search,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { type Marca, loadMarcas, saveMarcas } from "@/lib/marcas";
import { useDrawer } from "@/components/side-drawer";
import { openAnyConnect } from "@/lib/open-anyconnect";
import { openInAppBrowser, isNativeApp } from "@/lib/in-app-browser";
import { upsertEscala, baixarPdfEmBackground } from "@/lib/escalas-baixadas";
import { isIntranetReachable } from "@/lib/check-vpn";

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
  onClick: () => void;
};

function HomeScreen() {
  const navigate = useNavigate();
  const { setOpen: setDrawerOpen } = useDrawer();
  const [idEscala, setIdEscala] = useState("");
  const [marcas, setMarcas] = useState<Marca[]>(() => loadMarcas());
  const [consultando, setConsultando] = useState(false);

  useEffect(() => {
    saveMarcas(marcas);
  }, [marcas]);

  const handleConsultar = async () => {
    const id = idEscala.trim();
    if (!id) {
      toast.error("Informe o ID da escala.");
      return;
    }
    setConsultando(true);

    const url = `https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/arrelconesc.aspx?${encodeURIComponent(id)}`;

    // No web, abre uma aba em branco já no clique para não ser bloqueado.
    // Será preenchida ou fechada depois do teste de VPN.
    const novaAba =
      !isNativeApp() && typeof window !== "undefined"
        ? window.open("about:blank", "_blank", "noopener,noreferrer")
        : null;

    try {
      const vpnOk = await isIntranetReachable();

      if (!vpnOk) {
        if (novaAba) novaAba.close();
        toast.error("VPN AnyConnect não está conectada. Abrindo o app...");
        openAnyConnect();
        setConsultando(false);
        return;
      }

      if (isNativeApp()) {
        await openInAppBrowser(url, { titulo: `Escala ${id}` });
      } else if (novaAba) {
        novaAba.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      console.error("Erro ao abrir escala:", e);
      if (novaAba) novaAba.close();
      toast.error("Não foi possível abrir a escala.");
      setConsultando(false);
      return;
    }

    // Salva em "Escalas baixadas" em segundo plano, sem bloquear nem quebrar.
    try {
      upsertEscala({
        id,
        url,
        titulo: `Escala ${id}`,
        dataSalva: new Date().toISOString(),
      });
      void baixarPdfEmBackground(id, url).then((ok) => {
        if (ok) toast.success(`PDF da escala ${id} salvo offline.`);
      });
    } catch (e) {
      console.warn("Falha ao salvar escala localmente:", e);
    } finally {
      setConsultando(false);
    }
  };

  const blocos: ActionBlock[] = [
    {
      label: "Marcar / Desmarcar",
      icon: CalendarPlus,
      onClick: () =>
        openInAppBrowser(
          "https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/EscOpeDel.aspx",
          { titulo: "Marcar / Desmarcar" }
        ),
    },
    {
      label: "Email iNotes",
      icon: Mail,
      onClick: () =>
        openInAppBrowser("https://correio.policiamilitar.sp.gov.br/iwaredir.nsf", {
          titulo: "Email iNotes",
        }),
    },
    {
      label: "Calendário",
      icon: Calendar,
      onClick: () => navigate({ to: "/calendario" }),
    },
    {
      label: "Escalas baixadas",
      icon: FolderDown,
      onClick: () => navigate({ to: "/escalas-baixadas" }),
    },
    {
      label: "Guia AnyConnect",
      icon: BookOpen,
      onClick: () => navigate({ to: "/anyconnect" }),
    },
  ];

  return (
    <div className="min-h-screen pb-8" style={{ background: "var(--bg)" }}>
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <div>
          <h1 className="text-[32px] font-extrabold leading-none tracking-tight text-[#0f2535]">
            QAP, QRV!
          </h1>
          <p className="mt-1 text-[12px] font-medium tracking-wide text-[#5b7a8f]">
            Escalas PMESP
          </p>
        </div>
        <button
          aria-label="Menu"
          onClick={() => setDrawerOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border transition active:scale-95"
          style={{ background: "#e8f0f8", color: "#6ba3c8", borderColor: "#d5e3ee" }}
        >
          <Menu size={22} />
        </button>
      </header>

      {/* CONSULTA DE ESCALA */}
      <section
        className="mx-4 mt-4 rounded-[20px] border bg-[#ffffff] p-5"
        style={{ borderColor: "#d5e3ee", boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="text-[14px] font-bold uppercase tracking-wider" style={{ color: "#2e6b8a" }}>
          Consultar escala
        </h2>

        <div className="mt-3 flex items-stretch gap-2">
          <div
            className="relative flex-1 rounded-[14px] border px-3 pt-[18px] pb-1"
            style={{ borderColor: "#d5e3ee", background: "#e8f0f8", height: 52 }}
          >
            <label
              className="absolute left-3 top-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "#6ba3c8" }}
            >
              ID da escala
            </label>
            <input
              inputMode="numeric"
              value={idEscala}
              onChange={(e) => setIdEscala(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleConsultar()}
              className="w-full bg-transparent text-[16px] font-semibold outline-none"
              style={{ color: "#0f2535" }}
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

        {/* Passo a passo rápido */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {[
            { icon: Globe, label: "Acesse o site" },
            { icon: KeyRound, label: "Conecte no AnyConnect" },
            { icon: Search, label: "Informe o ID e pesquise" },
          ].map((passo, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <passo.icon size={14} />
                </div>
                <span className="text-center text-[10px] font-semibold" style={{ color: "#5b7a8f" }}>
                  {passo.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight size={12} style={{ color: "#6ba3c8" }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* GRID DE BLOCOS DE AÇÃO */}
      <section className="mx-4 mt-4">
        <h2 className="mb-3 text-[14px] font-bold uppercase tracking-wider" style={{ color: "#2e6b8a" }}>
          Acesso rápido
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {blocos.map((b) => (
            <button
              key={b.label}
              onClick={b.onClick}
              className="flex aspect-square flex-col items-center justify-center gap-3 rounded-[20px] border bg-[#ffffff] p-3 transition active:scale-[0.98]"
              style={{ borderColor: "#d5e3ee", boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="flex h-[60px] w-[60px] items-center justify-center rounded-full text-white"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                <b.icon size={28} />
              </div>
              <span
                className="text-center text-[13px] font-bold leading-tight"
                style={{ color: "#0f2535" }}
              >
                {b.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-8 text-center">
        <button
          onClick={() => navigate({ to: "/privacidade" })}
          className="text-[13px] underline"
          style={{ color: "#5b7a8f" }}
        >
          Política de Privacidade
        </button>
      </footer>
    </div>
  );
}
