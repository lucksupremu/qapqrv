import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Smartphone } from "lucide-react";
import { openAnyConnect } from "@/lib/open-anyconnect";

export const Route = createFileRoute("/anyconnect")({
  head: () => ({ meta: [{ title: "Configurar AnyConnect — Atividade D" }] }),
  component: AnyConnectGuideScreen,
});

const PASSOS: { texto: string; imagem: string }[] = [
  {
    imagem: "Tela inicial do Cisco Secure Client",
    texto:
      "Abra o Cisco Secure Client e toque nos 3 pontos (⋮) no canto superior direito",
  },
  {
    imagem: "Menu superior aberto",
    texto: "No menu que aparece, toque em Configurações",
  },
  {
    imagem: "Tela de configurações avançadas",
    texto:
      "Verifique se as configurações avançadas estão como padrão (não altere nada)",
  },
  {
    imagem: "Lista de conexões",
    texto: "Volte à tela inicial e toque em Conexões → PMESP",
  },
  {
    imagem: "Detalhes da conexão PMESP",
    texto:
      "Confirme: Descrição = PMESP | Servidor = extranet.policiamilitar.sp.gov.br | Toque em Preferências avançadas",
  },
  {
    imagem: "Preferências avançadas",
    texto:
      "Confirme: Certificado = Desabilitado | Autenticação = EAP-AnyConnect | Toque em Concluído ✓",
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
          style={{ background: "#D5DCE8", color: "#1B3A6B" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="flex-1 text-center text-[18px] font-bold"
          style={{ color: "#1B3A6B" }}
        >
          Configurar AnyConnect
        </h1>
        <span className="h-10 w-10" aria-hidden />
      </header>

      {/* Carrossel */}
      <div className="mx-3 mt-2 overflow-hidden rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p
          className="text-center text-[13px] font-semibold"
          style={{ color: "#8A9BB5" }}
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
                  className="flex h-[280px] w-full items-center justify-center rounded-[16px] px-4 text-center text-[14px] font-bold"
                  style={{
                    background: "rgba(27, 58, 107, 0.1)",
                    color: "#1B3A6B",
                  }}
                >
                  {p.imagem}
                </div>
                <p
                  className="mt-4 px-2 text-center text-[15px] font-semibold leading-relaxed"
                  style={{ color: "#1A1A2E" }}
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
                background: i === step ? "#1B3A6B" : "#D5DCE8",
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
            className="flex items-center gap-1 rounded-[12px] border-2 bg-white px-4 py-2 text-[13px] font-bold disabled:opacity-40"
            style={{ borderColor: "#1B3A6B", color: "#1B3A6B" }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <button
            onClick={isLast ? () => navigate({ to: "/" }) : goNext}
            className="flex items-center gap-1 rounded-[12px] px-4 py-2 text-[13px] font-bold text-white"
            style={{ background: "#1B3A6B" }}
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
          style={{ background: "#1B3A6B" }}
        >
          <Smartphone size={18} />
          Abrir AnyConnect
        </button>
      </div>
    </div>
  );
}
