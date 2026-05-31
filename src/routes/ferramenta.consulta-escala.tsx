import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  Search,
  Star,
  Trash2,
  RotateCcw,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Loader,
  WifiOff,
  Wifi,
  ChevronRight,
  Info,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/bottom-nav";
import { consultarEscala, formatBRL, formatDateBR, type Escala } from "@/lib/escala";
import { useEscalaHistorico } from "@/hooks/use-escala-historico";
import { isIntranetReachable } from "@/lib/check-vpn";
import { openAnyConnect } from "@/lib/open-anyconnect";

const idSchema = z
  .string()
  .trim()
  .regex(/^\d+$/u, "O ID deve conter apenas números")
  .min(1, "Informe o ID da escala")
  .max(12, "ID muito longo");

export const Route = createFileRoute("/ferramenta/consulta-escala")({
  head: () => ({
    meta: [
      { title: "Consulta de Escala — QAP, QRV!" },
      {
        name: "description",
        content:
          "Consulta de Escala DEJEM / Delegada por ID, com histórico e favoritos.",
      },
    ],
  }),
  component: ConsultaEscalaPage,
});

function ConsultaEscalaPage() {
  const [id, setId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Escala | null>(null);
  const { items, adicionar, favoritar, remover } = useEscalaHistorico();
  const [vpnStatus, setVpnStatus] = useState<"checking" | "ok" | "off">("checking");

  const checkVpn = useCallback(async () => {
    setVpnStatus("checking");
    const ok = await isIntranetReachable();
    setVpnStatus(ok ? "ok" : "off");
  }, []);

  useEffect(() => {
    void checkVpn();
  }, [checkVpn]);

  const consultar = useCallback(
    async (rawId: string) => {
      setErro(null);
      void checkVpn();
      const parsed = idSchema.safeParse(rawId);
      if (!parsed.success) {
        setErro(parsed.error.issues[0]?.message ?? "ID inválido");
        return;
      }
      setLoading(true);
      try {
        const escala = await consultarEscala(parsed.data);
        if (!escala) {
          setErro("Nenhuma escala encontrada para este ID.");
          setResultado(null);
          return;
        }
        setResultado(escala);
        await adicionar(escala);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao consultar.");
      } finally {
        setLoading(false);
      }
    },
    [adicionar, checkVpn],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void consultar(id);
  };

  const recentes = useMemo(() => items.slice(0, 10), [items]);
  const favoritoAtual = useMemo(
    () =>
      resultado
        ? !!items.find((it) => it.escala.id === resultado.id)?.favorito
        : false,
    [items, resultado],
  );

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header
        className="relative px-5 pt-6 pb-10 text-brand-navy-foreground"
        style={{ background: "var(--gradient-header)" }}
      >
        <div className="flex items-center justify-between">
          <Link
            to="/inicio"
            className="rounded-lg p-1.5 -ml-1.5 hover:bg-white/10"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg">
            <CalendarClock className="size-8 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">Consulta de Escala</h1>
            <p className="text-sm text-white/75 mt-0.5">DEJEM / Delegada</p>
          </div>
        </div>
      </header>

      <main className="px-4 -mt-6 space-y-5">
        <VpnBadge status={vpnStatus} onRecheck={checkVpn} />

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-card p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <label htmlFor="id-escala" className="text-xs font-semibold text-muted-foreground">
            ID DA ESCALA
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="id-escala"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={id}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D+/g, "");
                setId(onlyDigits);
                if (erro) setErro(null);
              }}
              placeholder="Ex.: 123456"
              className="flex-1 rounded-xl border border-input bg-background px-3.5 py-3 text-base outline-none focus:border-brand-blue"
            />
            <button
              type="submit"
              disabled={loading || !id}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-3 font-semibold text-brand-blue-foreground disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Consultar
            </button>
          </div>
          {erro ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="size-3.5" />
              {erro}
            </p>
          ) : null}
        </form>

        {resultado ? (
          <ResultadoCard
            escala={resultado}
            favorito={favoritoAtual}
            onFavoritar={() => favoritar(resultado.id)}
            onNova={() => {
              setResultado(null);
              setId("");
            }}
          />
        ) : null}

        <section>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-foreground">Consultas Recentes</h2>
            <span className="text-xs text-muted-foreground">{recentes.length}</span>
          </div>

          {recentes.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
              <p className="text-xs text-muted-foreground">
                Suas consultas aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentes.map((item) => (
                <li
                  key={item.escala.id + item.consultadoEm}
                  className="flex items-center gap-3 rounded-xl bg-card p-3"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <button
                    onClick={() => {
                      setId(item.escala.id);
                      setResultado(item.escala);
                    }}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-semibold text-card-foreground">
                      #{item.escala.id} · {item.escala.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBR(item.escala.data)} · {item.escala.unidade} ·{" "}
                      {formatBRL(item.escala.valorTotal)}
                    </p>
                  </button>
                  <button
                    aria-label="Favoritar"
                    onClick={() => favoritar(item.escala.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-amber-500"
                  >
                    <Star
                      className={`size-4 ${item.favorito ? "fill-amber-400 text-amber-500" : ""}`}
                    />
                  </button>
                  <button
                    aria-label="Reabrir"
                    onClick={() => {
                      setId(item.escala.id);
                      setResultado(item.escala);
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-brand-blue"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                  <button
                    aria-label="Excluir"
                    onClick={() => remover(item.escala.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function ResultadoCard({
  escala,
  favorito,
  onFavoritar,
  onNova,
}: {
  escala: Escala;
  favorito: boolean;
  onFavoritar: () => void;
  onNova: () => void;
}) {
  const campos: Array<{ label: string; value: string }> = [
    { label: "ID da escala", value: `#${escala.id}` },
    { label: "Tipo", value: escala.tipo },
    { label: "Data", value: formatDateBR(escala.data) },
    { label: "Início", value: escala.horarioInicial },
    { label: "Fim", value: escala.horarioFinal },
    { label: "Horas", value: `${escala.quantidadeHoras}h` },
    { label: "Unidade", value: escala.unidade },
    { label: "Valor da hora", value: formatBRL(escala.valorHora) },
  ];

  return (
    <article
      className="rounded-2xl bg-card p-4 space-y-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-card-foreground">Resultado</h2>
        <button
          onClick={onFavoritar}
          aria-label={favorito ? "Remover dos favoritos" : "Favoritar"}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-amber-500"
        >
          <Star
            className={`size-5 ${favorito ? "fill-amber-400 text-amber-500" : ""}`}
          />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {campos.map((c) => (
          <div
            key={c.label}
            className="rounded-xl bg-background/60 border border-border/60 p-3"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground break-words">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-gradient-to-br from-brand-blue to-indigo-600 p-4 text-white">
        <p className="text-[10px] uppercase tracking-wide opacity-80">
          Valor total previsto
        </p>
        <p className="mt-1 text-2xl font-black">{formatBRL(escala.valorTotal)}</p>
      </div>

      <button
        onClick={onNova}
        className="w-full rounded-xl border border-border bg-background py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
      >
        Nova consulta
      </button>
    </article>
  );
}

function VpnBadge({
  status,
  onRecheck,
}: {
  status: "checking" | "ok" | "off";
  onRecheck: () => void;
}) {
  if (status === "checking") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs text-muted-foreground">
        <Loader className="size-4 animate-spin" />
        Verificando conexão com a intranet…
      </div>
    );
  }
  if (status === "ok") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex cursor-help items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <Wifi className="size-4" />
            Intranet acessível — pronto para consultar.
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>A VPN está ativa e a intranet da PMESP responde.</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mt-0.5 flex h-8 w-8 shrink-0 cursor-help items-center justify-center rounded-full bg-amber-500/20">
              <WifiOff className="size-4 text-amber-700 dark:text-amber-300" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="max-w-[220px]">
              Sem VPN a intranet da PMESP fica inacessível. Conecte o AnyConnect para continuar.
            </p>
          </TooltipContent>
        </Tooltip>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
            VPN AnyConnect desconectada
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-700/90 dark:text-amber-300/90">
            A intranet da PMESP não está acessível. Conecte a VPN antes de consultar escalas.
          </p>
        </div>
      </div>
      {/* Mensagem de ação passo a passo */}
      <div className="flex items-start gap-2 rounded-lg bg-amber-600/10 px-3 py-2">
        <Info size={16} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
          <span className="font-bold">Ação necessária:</span> abra o Cisco AnyConnect, toque em{" "}
          <span className="font-semibold">Conectar</span> e aguarde o cadeado verde. Depois volte
          aqui e toque em <span className="font-semibold">Verificar novamente</span>.
        </p>
      </div>
      <div className="flex items-center gap-2 pl-11">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => openAnyConnect()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition active:scale-[0.97] hover:bg-amber-700"
            >
              <ShieldCheck className="size-3.5" />
              Abrir AnyConnect
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Abre o app Cisco AnyConnect para conectar a VPN</p>
          </TooltipContent>
        </Tooltip>
        <button
          type="button"
          onClick={onRecheck}
          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 transition active:scale-[0.97] hover:bg-amber-500/20"
        >
          <Wifi className="size-3.5" />
          Verificar novamente
        </button>
      </div>
    </div>
  );
}
