import { useState } from "react";
import { X, ShieldAlert, Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  url: string;
  onClose: () => void;
  onContinue: () => void;
};

/**
 * Modal exibido no mobile-web (PWA / navegador comum) antes de abrir
 * sistemas internos da PMESP. O Chrome (e derivados como Samsung Internet,
 * Edge, Brave) bloqueia o certificado autoassinado / ICP-Brasil e não
 * oferece a opção "Continuar mesmo assim". Ensinamos o usuário a instalar
 * o certificado raiz uma única vez — depois disso, qualquer navegador
 * padrão do aparelho abre normalmente.
 */
export function CertWarningModal({ open, url, onClose, onContinue }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const baixarCertificado = () => {
    window.open(
      "http://acraiz.icpbrasil.gov.br/credenciadas/RAIZ/ICP-Brasilv10.crt",
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-[var(--card)] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ background: "var(--gradient-primary)", color: "#fff" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <ShieldAlert size={22} />
          </div>
          <h2 className="flex-1 text-[16px] font-bold leading-tight">
            Aviso de certificado
          </h2>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-5 text-[14px]" style={{ color: "var(--fg)" }}>
          <p>
            Este sistema usa um <strong>certificado interno da PMESP</strong> que o
            Chrome (e outros navegadores baseados nele) costuma bloquear no Android,
            sem oferecer a opção <em>“Continuar mesmo assim”</em>.
          </p>

          <div
            className="rounded-xl border-l-4 p-3 text-[13px]"
            style={{
              background: "var(--muted)",
              borderColor: "var(--primary)",
              color: "var(--fg)",
            }}
          >
            <strong>Solução definitiva (1× por aparelho):</strong>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Toque em <strong>“Baixar certificado”</strong> abaixo.</li>
              <li>
                Vá em <strong>Configurações → Segurança → Criptografia e
                credenciais → Instalar certificado → Certificado CA</strong>.
              </li>
              <li>Selecione o arquivo baixado e confirme.</li>
              <li>Pronto! Qualquer navegador abre os sistemas PMESP.</li>
            </ol>
          </div>

          <p className="text-[12px]" style={{ color: "var(--muted-fg)" }}>
            Alternativa rápida: copie o link e cole no <strong>Firefox</strong>,
            que aceita o certificado sem instalação.
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2 px-5 pb-5">
          <button
            onClick={baixarCertificado}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl font-bold text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ExternalLink size={18} />
            Baixar certificado PMESP
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copiarLink}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl border-2 font-semibold"
              style={{
                borderColor: "var(--primary)",
                color: "var(--primary)",
                background: "transparent",
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado" : "Copiar link"}
            </button>
            <button
              onClick={() => {
                onContinue();
                onClose();
              }}
              className="flex h-11 items-center justify-center rounded-2xl font-semibold"
              style={{ background: "var(--muted)", color: "var(--fg)" }}
            >
              Tentar abrir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
