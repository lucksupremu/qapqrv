import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Smartphone } from "lucide-react";
import { openAnyConnect } from "@/lib/open-anyconnect";
import passo1 from "@/assets/anyconnect/passo-1.jpg";
import passo2 from "@/assets/anyconnect/passo-2.jpg";
import passo3 from "@/assets/anyconnect/passo-3.jpg";
import passo4 from "@/assets/anyconnect/passo-4.jpg";
import passo5 from "@/assets/anyconnect/passo-5.jpg";
import passo6 from "@/assets/anyconnect/passo-6.jpg";

export const Route = createFileRoute("/anyconnect")({
  head: () => ({ meta: [{ title: "Configurar AnyConnect — QAP, QRV!" }] }),
  component: AnyConnectGuideScreen,
});

const PASSOS: { src: string; alt: string; texto: string }[] = [
  {
    src: passo1,
    alt: "Tela inicial do Cisco Secure Client com seta apontando para os 3 pontos no canto superior direito",
    texto:
      "Abra o Cisco Secure Client e toque nos 3 pontos (⋮) no canto superior direito.",
  },
  {
    src: passo2,
    alt: "Menu suspenso aberto com a opção Configurações destacada",
    texto: "No menu que aparece, toque em Configurações.",
  },
  {
    src: passo3,
    alt: "Tela de Configurações com todas as opções desmarcadas (padrão)",
    texto:
      "Confirme que as opções estão no padrão (todas desmarcadas). Não altere nada e volte.",
  },
  {
    src: passo4,
    alt: "Tela inicial com seta apontando para Conexões / PMESP",
    texto: "De volta à tela inicial, toque em Conexões → PMESP.",
  },
  {
    src: passo5,
    alt: "Editor de conexão mostrando Descrição PMESP, servidor extranet.policiamilitar.sp.gov.br e Preferências avançadas",
    texto:
      "Confirme: Descrição = PMESP | Servidor = extranet.policiamilitar.sp.gov.br | depois toque em Preferências avançadas.",
  },
  {
    src: passo6,
    alt: "Tela de Preferências avançadas com Certificado Desabilitado, Autenticação EAP-AnyConnect e botão Concluído",
    texto:
      "Confirme: Certificado = Desabilitado | Autenticação = EAP-AnyConnect | toque em Concluído ✓.",
  },
];

function AnyConnectGuideScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const isLast = step === PASSOS.length - 1;

  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  const goNext = () => {
    if (!isLast) setStep((s) => s + 1);
  };

  const abrirAnyConnect = () => openAnyConnect();

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

      {/* Carrossel */}
      <div className="mx-3 mt-2 overflow-hidden rounded-[20px] bg-[#ffffff] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
        <p
          className="text-center text-[13px] font-semibold"
          style={{ color: "#5b7a8f" }}
        >
          Passo {step + 1} de {PASSOS.length}
        </p>

        <div className="mt-3 overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {PASSOS.map((p, i) => (
              <div key={i} className="w-full shrink-0 px-1">
                <div
                  className="flex h-[520px] w-full items-center justify-center overflow-hidden rounded-[16px]"
                  style={{ background: "#f4f8fc" }}
                >
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p
                  className="mt-4 px-2 text-center text-[15px] font-semibold leading-relaxed"
                  style={{ color: "#0f2535" }}
                >
                  {p.texto}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {PASSOS.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir ao passo ${i + 1}`}
              onClick={() => setStep(i)}
              className="h-2 w-2 rounded-full transition"
              style={{
                background: i === step ? "#2e6b8a" : "#e8f0f8",
                transform: i === step ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {/* Navegação */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={goPrev}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-[12px] border-2 bg-[#ffffff] px-4 py-2 text-[13px] font-bold disabled:opacity-40"
            style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <button
            onClick={isLast ? () => navigate({ to: "/" }) : goNext}
            className="flex items-center gap-1 rounded-[12px] px-4 py-2 text-[13px] font-bold text-white"
            style={{ background: "#2e6b8a" }}
          >
            {isLast ? "Concluído" : (<>Próximo <ChevronRight size={16} /></>)}
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
