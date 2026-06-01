import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Smartphone,
} from "lucide-react";
import { openAnyConnect } from "@/lib/open-anyconnect";
import passo1 from "@/assets/anyconnect/passo-1.jpg";
import passo2 from "@/assets/anyconnect/passo-2.jpg";
import passo3 from "@/assets/anyconnect/passo-3.jpg";
import passo4 from "@/assets/anyconnect/passo-4.jpg";
import passo5 from "@/assets/anyconnect/passo-5.jpg";
import passo6 from "@/assets/anyconnect/passo-6.jpg";
import passo7 from "@/assets/anyconnect/passo-7.jpg";

export const Route = createFileRoute("/anyconnect")({
  head: () => ({ meta: [{ title: "Configurar AnyConnect — QAP, QRV!" }] }),
  component: AnyConnectGuideScreen,
});

const SERVIDOR = "extranet.policiamilitar.sp.gov.br";

type Chip = { label: string; value: string; mono?: boolean };

type Passo = {
  src: string;
  alt: string;
  titulo: string;
  descricao: string;
  chips?: Chip[];
  destaqueServidor?: boolean;
};

const PASSOS: Passo[] = [
  {
    src: passo1,
    alt: "Tela inicial do Cisco Secure Client com seta apontando para os 3 pontos no canto superior direito",
    titulo: "Abra o menu",
    descricao: "Toque nos 3 pontos (⋮) no canto superior direito.",
  },
  {
    src: passo2,
    alt: "Menu suspenso aberto com a opção Configurações destacada",
    titulo: "Vá em Configurações",
    descricao: "Toque na opção Configurações.",
  },
  {
    src: passo3,
    alt: "Tela de Configurações com todas as opções desmarcadas (padrão)",
    titulo: "Mantenha o padrão",
    descricao: "Não altere nada — todas as opções devem ficar desmarcadas.",
  },
  {
    src: passo4,
    alt: "Tela inicial com seta apontando para Conexões / PMESP",
    titulo: "Acesse PMESP",
    descricao: "Toque em Conexões → PMESP.",
  },
  {
    src: passo5,
    alt: "Editor de conexão mostrando Descrição PMESP, servidor extranet.policiamilitar.sp.gov.br e Preferências avançadas",
    titulo: "Confira o servidor",
    descricao: "Cole o endereço abaixo e toque em Preferências avançadas.",
    destaqueServidor: true,
    chips: [{ label: "Descrição", value: "PMESP" }],
  },
  {
    src: passo6,
    alt: "Tela de Preferências avançadas com Certificado Desabilitado, Autenticação EAP-AnyConnect e botão Concluído",
    titulo: "Preferências avançadas",
    descricao: "Confirme os valores e toque em Concluído ✓.",
    chips: [
      { label: "Certificado", value: "Desabilitado" },
      { label: "Autenticação", value: "EAP-AnyConnect" },
    ],
  },
  {
    src: passo7,
    alt: "Tela do Cisco Secure Client com a lista de Grupos aberta, destacando a opção 13 - DEJEM DELEGADA",
    titulo: "Conecte-se",
    descricao:
      "Toque em Conectar, escolha o Grupo 13 e informe seu CPF + senha da aba Procedimentos.",
    chips: [
      { label: "Grupo", value: "13 - DEJEM DELEGADA" },
      { label: "Usuário", value: "Seu CPF" },
      { label: "Senha", value: "Aba Procedimentos" },
    ],
  },
];

function CopyServerButton({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SERVIDOR);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = SERVIDOR;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-[14px] border bg-white ${
        compact ? "p-2" : "p-3"
      }`}
      style={{ borderColor: "#cfe0ec" }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="text-[11px] font-bold uppercase tracking-wide"
          style={{ color: "#05101a" }}
        >
          Servidor
        </p>
        <p
          className="truncate font-mono text-[13px] font-bold"
          style={{ color: "#02080d" }}
          title={SERVIDOR}
        >
          {SERVIDOR}
        </p>
      </div>
      <button
        onClick={handleCopy}
        aria-label={copied ? "Endereço copiado" : "Copiar endereço do servidor"}
        className="flex shrink-0 items-center gap-1 rounded-[10px] px-3 py-2 text-[12px] font-bold text-white transition active:scale-[0.97]"
        style={{ background: copied ? "#2d8a5f" : "#2e6b8a" }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}

function AnyConnectGuideScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const isLast = step === PASSOS.length - 1;
  const touchStartX = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  const goNext = () => {
    if (!isLast) setStep((s) => s + 1);
  };

  // Teclado ← →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLast]);

  // Scroll suave ao topo do card ao trocar de passo
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const abrirAnyConnect = () => openAnyConnect();
  const passo = PASSOS[step];
  const progresso = ((step + 1) / PASSOS.length) * 100;

  return (
    <div
      className="flex min-h-screen flex-col pb-28"
      style={{ background: "var(--bg)" }}
    >
      <header className="flex items-center gap-2 px-3 py-3">
        <button
          aria-label="Voltar"
          onClick={() => navigate({ to: "/" })}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="flex-1 text-center text-[18px] font-bold"
          style={{ color: "#2e6b8a" }}
        >
          Configurar AnyConnect
        </h1>
        <span className="h-10 w-10" aria-hidden />
      </header>

      {/* Bloco fixo de copiar servidor (sempre visível) */}
      <div className="mx-3 mt-1">
        <CopyServerButton />
      </div>

      {/* Carrossel */}
      <div
        ref={cardRef}
        className="mx-3 mt-3 overflow-hidden rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Header passo + progresso */}
        <div className="flex items-center justify-between gap-3">
          <span
            className="flex h-8 items-center justify-center rounded-full px-3 text-[12px] font-bold text-white"
            style={{ background: "#2e6b8a" }}
          >
            {step + 1}/{PASSOS.length}
          </span>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full"
            style={{ background: "#e8f0f8" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progresso}%`, background: "#2e6b8a" }}
            />
          </div>
        </div>

        {/* Imagem */}
        <div className="mt-3 overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {PASSOS.map((p, i) => (
              <div key={i} className="w-full shrink-0 px-1">
                <div
                  className="flex h-[420px] w-full items-center justify-center overflow-hidden rounded-[16px]"
                  style={{ background: "#f4f8fc" }}
                >
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo do passo atual com animação */}
        <div
          key={step}
          aria-live="polite"
          className="mt-4 animate-fade-in px-1"
        >
          <h2
            className="text-[22px] font-extrabold leading-tight"
            style={{ color: "#000000" }}
          >
            {passo.titulo}
          </h2>
          <p
            className="mt-2 text-[17px] font-bold leading-relaxed"
            style={{ color: "#000000" }}
          >
            {passo.descricao}
          </p>

          {passo.destaqueServidor && (
            <div className="mt-3">
              <CopyServerButton compact />
            </div>
          )}

          {passo.chips && passo.chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {passo.chips.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] font-bold"
                  style={{ background: "#dbe9f5", color: "#000000" }}
                >
                  <span style={{ color: "#1a3348" }}>{c.label}:</span>
                  <span className={c.mono ? "font-mono" : ""}>{c.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dots */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {PASSOS.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir ao passo ${i + 1}`}
              onClick={() => setStep(i)}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === step ? 20 : 8,
                background: i === step ? "#2e6b8a" : "#cfe0ec",
              }}
            />
          ))}
        </div>

        {/* Navegação */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={goPrev}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-[12px] border-2 bg-white px-4 py-2 text-[13px] font-bold disabled:opacity-40"
            style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <button
            onClick={isLast ? abrirAnyConnect : goNext}
            className="flex items-center gap-1 rounded-[12px] px-4 py-2 text-[13px] font-bold text-white active:scale-[0.98]"
            style={{ background: "#2e6b8a" }}
          >
            {isLast ? (
              <>
                <Smartphone size={16} /> Abrir AnyConnect
              </>
            ) : (
              <>
                Próximo <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Botão fixo */}
      <div
        className="fixed inset-x-0 bottom-0 px-4 py-3"
        style={{ background: "var(--bg)" }}
      >
        <button
          onClick={abrirAnyConnect}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] font-bold text-white active:scale-[0.99]"
          style={{ background: "#2e6b8a" }}
        >
          <Smartphone size={18} />
          Abrir AnyConnect
        </button>
      </div>
    </div>
  );
}
