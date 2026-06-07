import { createFileRoute, Link } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";

const PRIVACIDADE_HTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Política de Privacidade — QAP, QRV!</title>
    <meta name="description" content="Política de Privacidade do QAP, QRV! para dados, permissões e contato." />
    <link rel="canonical" href="https://miketools.top/privacidade" />
    <style>
      :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; background: #f3f8fb; color: #3a4a60; }
      body { margin: 0; background: #f3f8fb; }
      main { max-width: 860px; margin: 0 auto; padding: 32px 18px 56px; }
      article { background: #ffffff; border-radius: 20px; box-shadow: 0 2px 12px rgba(0,0,0,.12); padding: 28px; }
      h1, h2 { color: #2e6b8a; }
      h1 { margin: 0 0 6px; font-size: 28px; }
      h2 { margin: 26px 0 8px; font-size: 18px; }
      p { margin: 0; line-height: 1.65; }
      .date { color: #5b7a8f; font-size: 14px; }
      a { color: #2e6b8a; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <article>
        <h1>Política de Privacidade — QAP, QRV!</h1>
        <p class="date">Última atualização: 2026</p>
        <h2>1. Sobre o aplicativo</h2>
        <p>O QAP, QRV! é uma ferramenta de apoio pessoal para policiais militares do Estado de São Paulo acompanharem suas escalas de Dejem e Delegada. O app funciona localmente, sem cadastro e sem envio de dados para servidores externos.</p>
        <h2>2. Dados coletados</h2>
        <p>Não coletamos nenhum dado pessoal. Todas as informações inseridas (marcas, escalas, lembretes) ficam armazenadas exclusivamente no seu dispositivo. Também podem ficar salvos localmente favoritos, histórico, preferências, escalas baixadas e configurações do app.</p>
        <h2>3. Permissões do dispositivo</h2>
        <p>Algumas funções podem solicitar permissões do dispositivo, sempre com autorização do usuário: localização, para mostrar sua posição quando você usa a ferramenta de localização; notificações, para lembretes de escala; e armazenamento/arquivos, para abrir ou salvar documentos baixados. Essas informações são usadas apenas para executar a função solicitada e não são enviadas aos nossos servidores.</p>
        <h2>4. Retenção e exclusão de dados</h2>
        <p>Como os dados ficam no próprio dispositivo, você pode excluí-los limpando os dados do navegador/app, removendo favoritos e histórico dentro do aplicativo ou desinstalando o app.</p>
        <h2>5. AnyConnect e sistemas da PMESP</h2>
        <p>O app não administra, controla nem se responsabiliza pelo aplicativo AnyConnect ou pelos sistemas da Polícia Militar. Qualquer problema de acesso ou autenticação é de responsabilidade dos sistemas da PMESP.</p>
        <h2>6. Responsabilidade sobre escalas</h2>
        <p>O QAP, QRV! é uma ferramenta de apoio. Não nos responsabilizamos por atrasos, faltas ou quaisquer consequências decorrentes do uso do app.</p>
        <h2>7. Publicidade</h2>
        <p>O app pode exibir anúncios para manter o uso gratuito. Os anúncios são fornecidos por parceiros externos, como o Google AdSense/AdMob, que podem usar cookies, identificadores do dispositivo ou ID de publicidade conforme suas próprias políticas.</p>
        <h2>8. Contato</h2>
        <p>Em caso de dúvidas, entre em contato:<br /><a href="mailto:Suporte.qapqrv@gmail.com">Suporte.qapqrv@gmail.com</a></p>
      </article>
    </main>
  </body>
</html>`;

export const Route = createFileRoute("/privacidade")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(PRIVACIDADE_HTML, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=300",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
  head: () => ({
    meta: [
      { title: "Política de Privacidade — QAP, QRV!" },
      {
        name: "description",
        content: "Política de Privacidade do QAP, QRV! para dados, permissões e contato.",
      },
    ],
  }),
  component: PrivacidadeScreen,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[17px] font-bold" style={{ color: "#2e6b8a" }}>
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
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "#2e6b8a" }}>
          Política de Privacidade
        </h1>
      </header>

      <div className="mx-4 mt-2 rounded-[20px] bg-[#ffffff] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="text-[20px] font-extrabold" style={{ color: "#2e6b8a" }}>
          Política de Privacidade — QAP, QRV!
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "#5b7a8f" }}>
          Última atualização: 2026
        </p>

        <Section title="1. Sobre o aplicativo">
          O QAP, QRV! é uma ferramenta de apoio pessoal para policiais militares
          do Estado de São Paulo acompanharem suas escalas de Dejem e Delegada.
          O app funciona localmente, sem cadastro e sem envio de dados para
          servidores externos.
        </Section>

        <Section title="2. Dados coletados">
          Não coletamos nenhum dado pessoal. Todas as informações inseridas
          (marcas, escalas, lembretes) ficam armazenadas exclusivamente no seu
          dispositivo. Também podem ficar salvos localmente favoritos,
          histórico, preferências, escalas baixadas e configurações do app.
        </Section>

        <Section title="3. Permissões do dispositivo">
          Algumas funções podem solicitar permissões do dispositivo, sempre com
          autorização do usuário: localização, para mostrar sua posição quando
          você usa a ferramenta de localização; notificações, para lembretes de
          escala; e armazenamento/arquivos, para abrir ou salvar documentos
          baixados. Essas informações são usadas apenas para executar a função
          solicitada e não são enviadas aos nossos servidores.
        </Section>

        <Section title="4. Retenção e exclusão de dados">
          Como os dados ficam no próprio dispositivo, você pode excluí-los
          limpando os dados do navegador/app, removendo favoritos e histórico
          dentro do aplicativo ou desinstalando o app.
        </Section>

        <Section title="5. AnyConnect e sistemas da PMESP">
          O app não administra, controla nem se responsabiliza pelo aplicativo
          AnyConnect ou pelos sistemas da Polícia Militar. Qualquer problema de
          acesso ou autenticação é de responsabilidade dos sistemas da PMESP.
        </Section>

        <Section title="6. Responsabilidade sobre escalas">
          O QAP, QRV! é uma ferramenta de apoio. Não nos responsabilizamos por
          atrasos, faltas ou quaisquer consequências decorrentes do uso do app.
        </Section>

        <Section title="7. Publicidade">
          O app pode exibir anúncios para manter o uso gratuito. Os anúncios são
          fornecidos por parceiros externos, como o Google AdSense/AdMob, que
          podem usar cookies, identificadores do dispositivo ou ID de publicidade
          conforme suas próprias políticas.
        </Section>

        <Section title="8. Contato">
          Em caso de dúvidas, entre em contato:
          <br />
          <a
            href="mailto:Suporte.qapqrv@gmail.com"
            className="font-semibold underline"
            style={{ color: "#2e6b8a" }}
          >
            Suporte.qapqrv@gmail.com
          </a>
        </Section>
      </div>
      <div className="h-24" />
    </div>
  );
}
