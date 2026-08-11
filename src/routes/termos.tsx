import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — MIKE TOOLS" },
      {
        name: "description",
        content:
          "Termos de Uso do aplicativo MIKE TOOLS: condições, responsabilidades, propriedade intelectual e limitações.",
      },
      { property: "og:url", content: "https://miketools.top/termos" },
    ],
    links: [{ rel: "canonical", href: "https://miketools.top/termos" }],
  }),
  component: TermosScreen,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[17px] font-bold" style={{ color: "#2e6b8a" }}>
        {title}
      </h2>
      <div className="mt-2 text-[15px] leading-[1.6] text-slate-700">{children}</div>
    </section>
  );
}

function TermosScreen() {
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
          Termos de Uso
        </h1>
      </header>

      <div className="mx-auto mt-2 max-w-2xl rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] mx-4">
        <h1 className="text-[20px] font-extrabold" style={{ color: "#2e6b8a" }}>
          Termos de Uso — MIKE TOOLS
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Última atualização: 19 de junho de 2026
        </p>

        <Section title="1. Aceitação dos termos">
          Ao acessar ou usar o site <strong>miketools.top</strong> ou o
          aplicativo <strong>MIKE TOOLS</strong>, você concorda com estes Termos
          de Uso e com a nossa{" "}
          <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
          Se não concordar, não utilize o serviço.
        </Section>

        <Section title="2. Natureza do serviço">
          O MIKE TOOLS é uma ferramenta independente de apoio operacional. Não
          possui vínculo oficial com a Polícia Militar do Estado de São Paulo
          nem com qualquer órgão público. Os dados exibidos pelo aplicativo
          dependem de sistemas oficiais — que podem ficar indisponíveis ou
          mudar sem aviso.
        </Section>

        <Section title="3. Uso permitido">
          Você se compromete a usar o serviço apenas para fins lícitos, não
          tentar burlar mecanismos de segurança, não fazer engenharia reversa,
          não automatizar requisições em volume e não usar o app para causar
          dano a terceiros.
        </Section>

        <Section title="4. Conta e dados">
          O app não exige cadastro. Os dados que você insere (favoritos,
          escalas, lembretes) ficam armazenados no seu próprio dispositivo. É
          sua responsabilidade fazer backup quando necessário.
        </Section>

        <Section title="5. Publicidade">
          Anúncios podem ser exibidos via Google AdSense (web) e Google AdMob
          (app). Ao usar o serviço, você concorda com a exibição de
          publicidade. Consulte a{" "}
          <Link to="/privacidade" className="underline">Política de Privacidade</Link>{" "}
          para detalhes sobre cookies e personalização.
        </Section>

        <Section title="6. Propriedade intelectual">
          O nome "MIKE TOOLS", o logotipo, o design e os textos originais deste
          site são protegidos por direitos autorais. Marcas de terceiros
          (Google, AnyConnect, PMESP) pertencem aos seus respectivos titulares
          e são citadas apenas para referência.
        </Section>

        <Section title="7. Isenção de responsabilidade">
          O serviço é fornecido "como está". Não nos responsabilizamos por
          atrasos, faltas, prejuízos ou quaisquer consequências decorrentes do
          uso do app, indisponibilidade de sistemas externos ou erros nos
          dados exibidos. Confirme sempre informações críticas pelos canais
          oficiais.
        </Section>

        <Section title="8. Alterações">
          Podemos atualizar estes Termos a qualquer momento. A continuidade do
          uso após a publicação de mudanças significa aceitação.
        </Section>

        <Section title="9. Lei aplicável">
          Estes Termos são regidos pelas leis da República Federativa do Brasil.
          Fica eleito o foro da Comarca de São Paulo/SP para dirimir eventuais
          controvérsias.
        </Section>

        <Section title="10. Contato">
          <a className="underline font-semibold" href="mailto:suporte.qapqrv@gmail.com">
            suporte.qapqrv@gmail.com
          </a>
        </Section>
      </div>
      <div className="h-24" />
    </div>
  );
}
