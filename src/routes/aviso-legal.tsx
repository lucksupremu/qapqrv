import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const Route = createFileRoute("/aviso-legal")({
  head: () => ({
    meta: [
      { title: "Aviso Legal — MIKE TOOLS" },
      { name: "description", content: "Aviso legal do MIKE TOOLS: natureza independente, limitações de responsabilidade e canais oficiais da PMESP." },
      { property: "og:url", content: "https://miketools.top/aviso-legal" },
    ],
    links: [{ rel: "canonical", href: "https://miketools.top/aviso-legal" }],
  }),
  component: AvisoScreen,
});

function AvisoScreen() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showBrand={false} title="Aviso Legal" subtitle="Informações importantes" />
      <Breadcrumbs items={[{ label: "Início", to: "/" }, { label: "Aviso Legal" }]} />
      <main className="mx-auto max-w-3xl px-5 py-5 space-y-4 text-[15px] leading-relaxed text-foreground/85">
        <p>
          O <strong>MIKE TOOLS</strong> é um aplicativo independente, mantido de
          forma comunitária, sem vínculo institucional com a Polícia Militar do
          Estado de São Paulo, a Secretaria de Segurança Pública ou qualquer
          órgão público.
        </p>
        <h2 className="pt-2 text-lg font-bold text-foreground">Natureza da informação</h2>
        <p>
          O conteúdo publicado tem caráter meramente informativo. Toda decisão
          administrativa, operacional ou funcional deve ser confirmada em canais
          oficiais da Corporação. O MIKE TOOLS não substitui a intranet PMESP,
          diretrizes internas ou instruções da chefia imediata.
        </p>
        <h2 className="pt-2 text-lg font-bold text-foreground">Limitação de responsabilidade</h2>
        <p>
          Fazemos esforço razoável para manter as informações atualizadas, mas
          não garantimos que estejam livres de erros ou que reflitam a versão
          mais recente das normas. Não nos responsabilizamos por eventuais
          prejuízos decorrentes do uso das informações ou ferramentas.
        </p>
        <h2 className="pt-2 text-lg font-bold text-foreground">Direitos de terceiros</h2>
        <p>
          Marcas, logotipos e sistemas de terceiros citados pertencem aos
          respectivos titulares. O uso desses nomes ocorre apenas para fins
          descritivos.
        </p>
        <h2 className="pt-2 text-lg font-bold text-foreground">Contato</h2>
        <p>
          Solicitações ou correções: <a href="mailto:suporte@miketools.top" className="text-primary underline">suporte@miketools.top</a>.
        </p>
      </main>
    </div>
  );
}
