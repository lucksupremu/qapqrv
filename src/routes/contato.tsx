import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — QAP, QRV!" },
      {
        name: "description",
        content:
          "Entre em contato com a equipe do QAP, QRV! para sugestões, parcerias, suporte e solicitações relacionadas à LGPD.",
      },
    ],
  }),
  component: ContatoScreen,
});

function ContatoScreen() {
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const mailto = `mailto:suporte.qapqrv@gmail.com?subject=${encodeURIComponent(
    assunto || "Contato pelo site",
  )}&body=${encodeURIComponent(mensagem)}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="flex items-center gap-3 px-4 py-4">
        <Link
          to="/"
          aria-label="Voltar"
          className="flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "#2e6b8a" }}>
          Fale conosco
        </h1>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-24">
        <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
          <p className="text-[15px] leading-relaxed text-slate-700">
            Tem uma sugestão de ferramenta, achou um bug ou quer falar sobre
            parcerias e publicidade? Envie uma mensagem — respondemos por e-mail.
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <Mail size={20} className="text-slate-500" />
            <a
              href="mailto:suporte.qapqrv@gmail.com"
              className="font-semibold text-slate-800 underline"
            >
              suporte.qapqrv@gmail.com
            </a>
          </div>

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = mailto;
            }}
          >
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Assunto</span>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Ex.: Sugestão de funcionalidade"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2e6b8a] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Mensagem</span>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={6}
                placeholder="Conte como podemos ajudar…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2e6b8a] focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full font-bold text-white shadow-md transition active:scale-[0.98]"
              style={{ background: "#2e6b8a" }}
            >
              <Send size={18} /> Enviar e-mail
            </button>
            <p className="text-center text-xs text-slate-500">
              Ao enviar, seu cliente de e-mail será aberto. Nenhum dado é
              processado pelo nosso servidor.
            </p>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Para solicitações de LGPD (acesso/exclusão de dados), use o mesmo
          e-mail mencionando "LGPD" no assunto. Veja a{" "}
          <Link to="/privacidade" className="underline font-semibold">
            Política de Privacidade
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
