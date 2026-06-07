import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

const STORAGE_KEY = "privacy_consent_v1";

export function PrivacyConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setOpen(true);
    } catch {
      // ignore
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-consent-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-[430px] rounded-t-[24px] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.2)] sm:rounded-[24px] animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3 px-5 pt-5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "#e8f0f8", color: "#2e6b8a" }}
          >
            <ShieldCheck size={24} />
          </div>
          <h2
            id="privacy-consent-title"
            className="text-[18px] font-extrabold"
            style={{ color: "#2e6b8a" }}
          >
            Política de Privacidade
          </h2>
        </div>

        <div
          className="mx-5 mt-4 max-h-[50vh] overflow-y-auto rounded-[16px] p-4 text-[14px] leading-[1.55]"
          style={{ background: "#f4f8fc", color: "#3A4A60" }}
        >
          <p>
            Bem-vindo ao <strong>QAP, QRV!</strong>. Antes de continuar, leia
            como tratamos suas informações:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              O app funciona <strong>localmente no seu dispositivo</strong>, sem
              cadastro e sem envio de dados pessoais para nossos servidores.
            </li>
            <li>
              Dados como favoritos, histórico e preferências ficam salvos
              apenas no seu navegador.
            </li>
            <li>
              Podemos exibir <strong>anúncios do Google AdSense</strong>, que
              usam cookies para personalização.
            </li>
            <li>
              Funcionalidades como localização só são acessadas com sua
              permissão explícita e usadas no momento da consulta.
            </li>
          </ul>
          <p className="mt-3">
            Ao continuar, você confirma que leu e aceita a{" "}
            <a
              href="/politica-de-privacidade.html"
              className="font-semibold underline"
              style={{ color: "#2e6b8a" }}
              onClick={accept}
            >
              Política de Privacidade completa
            </a>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 px-5 pb-6 pt-4">
          <button
            type="button"
            onClick={accept}
            className="h-12 w-full rounded-full text-[15px] font-bold text-white shadow-md transition active:scale-[0.98]"
            style={{ background: "#2e6b8a" }}
          >
            Li e aceito
          </button>
          <a
            href="/politica-de-privacidade.html"
            onClick={accept}
            className="h-11 w-full text-center text-[14px] font-semibold leading-[44px]"
            style={{ color: "#2e6b8a" }}
          >
            Ler política completa
          </a>
        </div>
      </div>
    </div>
  );
}
