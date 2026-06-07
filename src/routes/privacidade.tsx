import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
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

        <Section title="2. Coleta de dados">
          Não coletamos nenhum dado pessoal. Todas as informações inseridas,
          como marcas, escalas e lembretes, ficam armazenadas exclusivamente no
          seu dispositivo. Também podem ficar salvos localmente favoritos,
          histórico, preferências, escalas baixadas e configurações do app.
        </Section>

        <Section title="3. Uso das informações">
          As informações armazenadas localmente são usadas apenas para executar
          as funções do aplicativo, como organizar escalas, exibir lembretes,
          manter preferências e facilitar o acesso a ferramentas usadas pelo
          usuário.
        </Section>

        <Section title="4. Compartilhamento de dados">
          Não vendemos, compartilhamos nem transferimos dados pessoais para
          terceiros. O app pode exibir anúncios fornecidos por parceiros
          externos, como Google AdSense ou AdMob, que podem usar cookies,
          identificadores do dispositivo ou ID de publicidade conforme suas
          próprias políticas.
        </Section>

        <Section title="5. Permissões do dispositivo">
          Algumas funções podem solicitar permissões do dispositivo, sempre com
          autorização do usuário: localização, para mostrar sua posição quando
          você usa a ferramenta de localização; notificações, para lembretes de
          escala; e armazenamento ou arquivos, para abrir ou salvar documentos
          baixados.
        </Section>

        <Section title="6. Segurança">
          Como os dados ficam no próprio dispositivo, recomendamos manter o
          aparelho protegido por senha, biometria ou outro método de bloqueio.
          As informações usadas pelas ferramentas do app não são enviadas aos
          nossos servidores.
        </Section>

        <Section title="7. Direitos do usuário">
          Você pode excluir os dados locais limpando os dados do navegador ou
          app, removendo favoritos e histórico dentro do aplicativo ou
          desinstalando o app do dispositivo.
        </Section>

        <Section title="8. AnyConnect e sistemas da PMESP">
          O app não administra, controla nem se responsabiliza pelo aplicativo
          AnyConnect ou pelos sistemas da Polícia Militar. Qualquer problema de
          acesso ou autenticação é de responsabilidade dos sistemas da PMESP.
        </Section>

        <Section title="9. Responsabilidade sobre escalas">
          O QAP, QRV! é uma ferramenta de apoio. Não nos responsabilizamos por
          atrasos, faltas ou quaisquer consequências decorrentes do uso do app.
        </Section>

        <Section title="10. Contato">
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
