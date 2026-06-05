import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Copy, PlayCircle, Smartphone } from "lucide-react";
import { openAnyConnect } from "@/lib/open-anyconnect";
import tutorialVideo from "@/assets/anyconnect/tutorial.mp4.asset.json";
import { useIsNative } from "@/hooks/use-is-native";

// No APK (Capacitor) o app roda em https://localhost e não tem acesso ao
// caminho relativo `/__l5e/...`. Para o vídeo carregar, prefixamos com o
// host público.
const PUBLIC_HOST = "https://qapqrv.lovable.app";

export const Route = createFileRoute("/anyconnect")({
  head: () => ({ meta: [{ title: "Configurar AnyConnect — QAP, QRV!" }] }),
  component: AnyConnectGuideScreen,
});

const SERVIDOR = "extranet.policiamilitar.sp.gov.br";

type Chip = { label: string; value: string; mono?: boolean };

type Passo = {
  titulo: string;
  descricao: string;
  chips?: Chip[];
  destaqueServidor?: boolean;
};

const PASSOS: Passo[] = [
  {
    titulo: "Abra o menu",
    descricao: "Toque nos 3 pontos (⋮) no canto superior direito.",
  },
  {
    titulo: "Vá em Configurações",
    descricao: "Toque na opção Configurações.",
  },
  {
    titulo: "Mantenha o padrão",
    descricao: "Não altere nada — todas as opções devem ficar desmarcadas.",
  },
  {
    titulo: "Acesse PMESP",
    descricao: "Toque em Conexões → PMESP.",
  },
  {
    titulo: "Confira o servidor",
    descricao: "Cole o endereço abaixo e toque em Preferências avançadas.",
    destaqueServidor: true,
    chips: [{ label: "Descrição", value: "PMESP" }],
  },
  {
    titulo: "Preferências avançadas",
    descricao: "Confirme os valores e toque em Concluído ✓.",
    chips: [
      { label: "Certificado", value: "Desabilitado" },
      { label: "Autenticação", value: "EAP-AnyConnect" },
    ],
  },
  {
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
  const isNative = useIsNative();
  const abrirAnyConnect = () => openAnyConnect();
  const videoSrc = isNative ? `${PUBLIC_HOST}${tutorialVideo.url}` : tutorialVideo.url;

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

      {/* Servidor */}
      <div className="mx-3 mt-1">
        <CopyServerButton />
      </div>

      {/* Card principal */}
      <div className="mx-3 mt-3 overflow-hidden rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
        {/* Vídeo tutorial */}
        <div
          className="overflow-hidden rounded-[16px]"
          style={{ background: "#000" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ background: "#e8f0f8" }}
          >
            <PlayCircle size={18} style={{ color: "#2e6b8a" }} />
            <p
              className="text-[13px] font-bold"
              style={{ color: "#1a3348" }}
            >
              Vídeo tutorial — toque para reproduzir
            </p>
          </div>
          <video
            src={videoSrc}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            className="block h-[420px] w-full bg-black"
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Instruções passo a passo */}
        <h2
          className="mt-5 text-[18px] font-extrabold"
          style={{ color: "#1a3348" }}
        >
          Passo a passo
        </h2>
        <ol className="mt-3 space-y-4">
          {PASSOS.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ background: "#2e6b8a" }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3
                  className="text-[16px] font-extrabold leading-tight"
                  style={{ color: "#000000" }}
                >
                  {p.titulo}
                </h3>
                <p
                  className="mt-1 text-[15px] font-semibold leading-relaxed"
                  style={{ color: "#000000" }}
                >
                  {p.descricao}
                </p>

                {p.destaqueServidor && (
                  <div className="mt-2">
                    <CopyServerButton compact />
                  </div>
                )}

                {p.chips && p.chips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.chips.map((c) => (
                      <div
                        key={c.label}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold"
                        style={{ background: "#dbe9f5", color: "#000000" }}
                      >
                        <span style={{ color: "#1a3348" }}>{c.label}:</span>
                        <span className={c.mono ? "font-mono" : ""}>
                          {c.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
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
