import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Menu, Globe, KeyRound, Info } from "lucide-react";
import { MarcarModal } from "@/components/marcar-modal";
import { type Marca, loadMarcas, saveMarcas } from "@/lib/marcas";

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

  const contar = (tipo: Marca["tipo"], ano: number, mes: number) =>
    marcas.filter((mk) => {
      if (mk.tipo !== tipo) return false;
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

  const dejemContagens = mesesRecentes.map((x) => contar("dejem", x.ano, x.mes));
  const delegadaContagens = mesesRecentes.map((x) => contar("delegada", x.ano, x.mes));
  const valoresMensais = mesesValores.map((x) => somar(x.ano, x.mes));

  const handleConsultar = () => {
    const id = idEscala.trim();
    if (!id) return;
    navigate({ to: "/ferramenta/consulta-escala", search: { id } as never });
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: "var(--bg)" }}>
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <h1 className="text-[32px] font-extrabold leading-none" style={{ color: "#1B3A6B" }}>
          Atividade D
        </h1>
        <button
          aria-label="Menu"
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "#D5DCE8", color: "#1B3A6B" }}
        >
          <Menu size={22} />
        </button>
      </header>

      {/* CARD AZUL */}
      <section
        className="mx-4 mt-4 rounded-[20px] p-5 text-white"
        style={{ background: "#1B3A6B" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold">Valores a receber</h2>
          <button
            aria-label="Abrir calendário"
            onClick={() => navigate({ to: "/calendario" })}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white"
            style={{ color: "#1B3A6B" }}
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
              style={{ background: "#2A4F8A" }}
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
                style={{ background: "#2A4F8A" }}
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
                style={{ background: "#2A4F8A" }}
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

      {/* CARD BRANCO */}
      <section className="mx-4 mt-4 rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        {/* Marcar/Desmarcar */}
        <button
          onClick={() => navigate({ to: "/escalas-baixadas" })}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] font-bold text-white active:scale-[0.99]"
          style={{ background: "#1B3A6B" }}
        >
          <Globe size={20} />
          Marcar/Desmarcar
        </button>

        {/* AnyConnect + info */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => navigate({ to: "/anyconnect" })}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[14px] border-2 bg-white font-bold active:scale-[0.99]"
            style={{ borderColor: "#1B3A6B", color: "#1B3A6B" }}
          >
            <KeyRound size={20} />
            Abrir AnyConnect
          </button>
          <button
            aria-label="Informações sobre AnyConnect"
            onClick={() => navigate({ to: "/anyconnect" })}
            className="flex h-10 w-10 items-center justify-center self-center rounded-full border-2"
            style={{ borderColor: "#1B3A6B", color: "#1B3A6B" }}
          >
            <Info size={18} />
          </button>
        </div>

        {/* Consulta de escala */}
        <div className="mt-3 flex items-stretch gap-2">
          <div
            className="relative flex-1 rounded-[14px] border-2 px-3 pt-[18px] pb-1"
            style={{ borderColor: "#1B3A6B", height: 52 }}
          >
            <label
              className="absolute left-3 top-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "#1B3A6B" }}
            >
              ID da escala
            </label>
            <input
              inputMode="numeric"
              value={idEscala}
              onChange={(e) => setIdEscala(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleConsultar()}
              className="w-full bg-transparent text-[16px] font-semibold outline-none"
              style={{ color: "#1A1A2E" }}
            />
          </div>
          <button
            onClick={handleConsultar}
            className="h-[52px] rounded-[14px] px-5 font-bold text-white active:scale-[0.99]"
            style={{ background: "#1B3A6B" }}
          >
            Consultar
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-8 text-center">
        <button
          onClick={() => navigate({ to: "/privacidade" })}
          className="text-[13px] underline"
          style={{ color: "#8A9BB5" }}
        >
          Política de Privacidade
        </button>
      </footer>
    </div>
  );
}
