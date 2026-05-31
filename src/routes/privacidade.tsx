import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Política de Privacidade — Atividade D" }] }),
  component: PrivacidadeScreen,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[17px] font-bold" style={{ color: "#4f46e5" }}>
        {title}
      </h2>
      <div className="mt-2 text-[15px] leading-[1.6]" style={{ color: "#3A4A60" }}>
        {children}
      </div>
    </section>
  );
}

function PrivacidadeScreen() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="flex items-center gap-3 px-4 py-4">
        <Link
          to="/"
          aria-label="Voltar"
          className="flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95"
          style={{ background: "#1e1e3a", color: "#4f46e5" }}
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "#4f46e5" }}>
          Política de Privacidade
        </h1>
      </header>

      <div className="mx-4 mt-2 rounded-[20px] bg-[#141432] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="text-[20px] font-extrabold" style={{ color: "#4f46e5" }}>
          Política de Privacidade — Atividade D
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "#8b8db5" }}>
          Última atualização: 2025
        </p>

        <Section title="1. Sobre o aplicativo">
          O Atividade D é uma ferramenta de apoio pessoal para policiais militares
          do Estado de São Paulo acompanharem suas escalas de Dejem e Delegada.
          O app funciona localmente, sem cadastro e sem envio de dados para
          servidores externos.
        </Section>

        <Section title="2. Dados coletados">
          Não coletamos nenhum dado pessoal. Todas as informações inseridas
          (marcas, escalas, lembretes) ficam armazenadas exclusivamente no seu
          dispositivo.
        </Section>

        <Section title="3. AnyConnect e sistemas da PMESP">
          O app não administra, controla nem se responsabiliza pelo aplicativo
          AnyConnect ou pelos sistemas da Polícia Militar. Qualquer problema de
          acesso ou autenticação é de responsabilidade dos sistemas da PMESP.
        </Section>

        <Section title="4. Responsabilidade sobre escalas">
          O Atividade D é uma ferramenta de apoio. Não nos responsabilizamos por
          atrasos, faltas ou quaisquer consequências decorrentes do uso do app.
        </Section>

        <Section title="5. Publicidade">
          O app pode exibir anúncios para manter o uso gratuito. Os anúncios são
          fornecidos por parceiros externos.
        </Section>

        <Section title="6. Contato">
          Em caso de dúvidas, entre em contato:
          <br />
          <a
            href="mailto:Suporte.qapqrv@gmail.com"
            className="font-semibold underline"
            style={{ color: "#4f46e5" }}
          >
            Suporte.qapqrv@gmail.com
          </a>
        </Section>
      </div>
      <div className="h-24" />
    </div>
  );
}
