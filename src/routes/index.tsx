import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Menu,
  Globe,
  KeyRound,
  Info,
  Loader2,
  Search,
  ArrowRight,
} from "lucide-react";
import { MarcarModal } from "@/components/marcar-modal";
import { type Marca, loadMarcas, saveMarcas } from "@/lib/marcas";
import { useDrawer } from "@/components/side-drawer";
import { openAnyConnect } from "@/lib/open-anyconnect";
import { openInAppBrowser } from "@/lib/in-app-browser";
import { upsertEscala, baixarPdfEmBackground } from "@/lib/escalas-baixadas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atividade D — Escalas PMESP" },
      {
        name: "description",
        content:
          "Acompanhe suas escalas Dejem e Delegada da PMESP em um só lugar.",
      },
    ],
  }),
  component: HomeScreen,
});

const MESES_PT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}




function HomeScreen() {
  const navigate = useNavigate();
  const { setOpen: setDrawerOpen } = useDrawer();
  const [idEscala, setIdEscala] = useState("");
  const [marcarOpen, setMarcarOpen] = useState(false);
  const [marcas, setMarcas] = useState<Marca[]>(() => loadMarcas());

  useEffect(() => {
    saveMarcas(marcas);
  }, [marcas]);



  // Mês atual e janelas
  const { mesesRecentes, mesesValores } = useMemo(() => {
    const hoje = new Date();
    const y = hoje.getFullYear();
    const m = hoje.getMonth();
    const recentes = [
      { y, m: m - 2 },
      { y, m: m - 1 },
      { y, m },
    ].map(({ y, m }) => {
      const d = new Date(y, m, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });
    const valores = [
      { y, m },
      { y, m: m + 1 },
    ].map(({ y, m }) => {
      const d = new Date(y, m, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });
    return { mesesRecentes: recentes, mesesValores: valores };
  }, []);

  const contarTipo = (
    match: (t: Marca["tipo"]) => boolean,
    ano: number,
    mes: number,
  ) =>
    marcas.filter((mk) => {
      if (!match(mk.tipo)) return false;
      const d = new Date(mk.data);
      return d.getFullYear() === ano && d.getMonth() === mes;
    }).length;

  const somar = (ano: number, mes: number) =>
    marcas
      .filter((mk) => {
        const d = new Date(mk.data);
        return d.getFullYear() === ano && d.getMonth() === mes;
      })
      .reduce((acc, mk) => acc + (mk.valor || 0), 0);

  const dejemContagens = mesesRecentes.map((x) =>
    contarTipo((t) => t === "dejem", x.ano, x.mes),
  );
  const delegadaContagens = mesesRecentes.map((x) =>
    contarTipo(
      (t) => t === "delegada_capital" || t === "delegada_outras",
      x.ano,
      x.mes,
    ),
  );

  const valoresMensais = mesesValores.map((x) => somar(x.ano, x.mes));

  const [consultando, setConsultando] = useState(false);

  const handleConsultar = async () => {
    const id = idEscala.trim();
    if (!id) {
      toast.error("Informe o ID da escala.");
      return;
    }
    setConsultando(true);

    const url = `https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/arrelconesc.aspx?${encodeURIComponent(id)}`;

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
      await openInAppBrowser(url, { titulo: `Escala ${id}` });
      toast.success("Escala adicionada em Escalas baixadas.");
    } catch {
      toast.error("Não foi possível abrir a escala.");
    } finally {
      setConsultando(false);
    }
  };




  return (
    <div className="min-h-screen pb-8" style={{ background: "var(--bg)" }}>
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <div>
          <h1 className="text-[32px] font-extrabold leading-none tracking-tight text-[#0f2535]">
            Atividade D
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

      {/* CARD AZUL */}
      <section
        className="relative mx-4 mt-4 overflow-hidden rounded-[24px] p-5 text-white"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "var(--shadow-glow), var(--shadow-elegant)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
          style={{ background: "#6ba3c8" }}
        />
        <div className="relative flex items-center justify-between">
          <h2 className="text-[18px] font-bold tracking-tight">Valores a receber</h2>
          <button
            aria-label="Abrir calendário"
            onClick={() => navigate({ to: "/calendario" })}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition active:scale-95 hover:bg-white/25"
            style={{ color: "#ffffff" }}
          >
            <Calendar size={18} />
          </button>
        </div>

        {/* Valores mensais */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {mesesValores.map((x, i) => (
            <div
              key={`val-${i}`}
              className="rounded-xl p-3"
              style={{ background: "#1f4e68" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                {MESES_PT[x.mes]}
              </div>
              <div className="mt-1 text-[16px] font-bold">
                {formatBRL(valoresMensais[i] || 0)}
              </div>
            </div>
          ))}
        </div>

        {/* Dejem */}
        <div className="mt-5">
          <h3 className="text-[20px] font-bold">Dejem</h3>
          <div className="mt-2 flex gap-2">
            {mesesRecentes.map((x, i) => (
              <div
                key={`dej-${i}`}
                className="flex-1 rounded-xl p-[10px]"
                style={{ background: "#1f4e68" }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                  {MESES_PT[x.mes]}
                </div>
                <div className="mt-1 text-center text-[22px] font-bold">
                  {dejemContagens[i] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delegada */}
        <div className="mt-5">
          <h3 className="text-[20px] font-bold">Delegada</h3>
          <div className="mt-2 flex gap-2">
            {mesesRecentes.map((x, i) => (
              <div
                key={`del-${i}`}
                className="flex-1 rounded-xl p-[10px]"
                style={{ background: "#1f4e68" }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                  {MESES_PT[x.mes]}
                </div>
                <div className="mt-1 text-center text-[22px] font-bold">
                  {delegadaContagens[i] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARD AÇÕES */}
      <section
        className="mx-4 mt-4 rounded-[20px] border bg-[#ffffff] p-5"
        style={{ borderColor: "#d5e3ee", boxShadow: "var(--shadow-card)" }}
      >
        {/* Marcar/Desmarcar */}
        <button
          onClick={() => setMarcarOpen(true)}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] font-bold text-white active:scale-[0.99]"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          <Globe size={20} />
          Marcar/Desmarcar
        </button>

        {/* AnyConnect + info */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={openAnyConnect}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[14px] border bg-transparent font-bold active:scale-[0.99]"
            style={{ borderColor: "#2e6b8a", color: "#6ba3c8" }}
          >
            <KeyRound size={20} />
            Abrir AnyConnect
          </button>
          <button
            aria-label="Informações sobre AnyConnect"
            onClick={() => navigate({ to: "/anyconnect" })}
            className="flex h-10 w-10 items-center justify-center self-center rounded-full border"
            style={{ borderColor: "#2e6b8a", color: "#6ba3c8" }}
          >
            <Info size={18} />
          </button>
        </div>

        {/* Consulta de escala */}
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
        <div className="mt-4 flex items-center gap-2">
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

      <MarcarModal
        open={marcarOpen}
        onOpenChange={setMarcarOpen}
        onSave={(marca) => setMarcas((prev) => [marca, ...prev])}
      />

      <PinModal
        open={pinOpen}
        modo="informar"
        onClose={() => setPinOpen(false)}
        onConfirm={onPinConfirm}
      />
    </div>
  );
}
