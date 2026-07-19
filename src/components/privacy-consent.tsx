import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
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
      role="region"
      aria-labelledby="privacy-consent-title"
      className="fixed inset-x-3 bottom-[76px] z-[60] mx-auto max-w-[430px] animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.18)]">
        <div className="flex items-center gap-3 px-4 pt-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "#e8f0f8", color: "#2e6b8a" }}
          >
            <ShieldCheck size={20} />
          </div>
          <h2
            id="privacy-consent-title"
            className="text-[15px] font-extrabold"
            style={{ color: "#2e6b8a" }}
          >
            Política de Privacidade
          </h2>
        </div>

        <div
          className="mx-4 mt-3 max-h-[26vh] overflow-y-auto rounded-[14px] p-3 text-[12.5px] leading-[1.45]"
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
            <Link
              to="/privacidade"
              className="font-semibold underline"
              style={{ color: "#2e6b8a" }}
              onClick={accept}
            >
              Política de Privacidade completa
            </Link>
            .
          </p>
        </div>

        <div className="flex gap-2 px-4 pb-4 pt-3">
          <Link
            to="/privacidade"
            onClick={accept}
            className="h-10 flex-1 text-center text-[13px] font-semibold leading-10"
            style={{ color: "#2e6b8a" }}
          >
            Ler política
          </Link>
          <button
            type="button"
            onClick={accept}
            className="h-10 flex-1 rounded-full text-[13px] font-bold text-white shadow-md transition active:scale-[0.98]"
            style={{ background: "#2e6b8a" }}
          >
            Li e aceito
          </button>
        </div>
      </div>
    </div>
  );
}
