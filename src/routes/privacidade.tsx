import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — QAP, QRV!" },
      {
        name: "description",
        content:
          "Política de Privacidade do QAP, QRV!: dados, cookies, Google AdSense, AdMob, permissões, LGPD e contato.",
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

      <div className="mx-4 mt-2 rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="text-[20px] font-extrabold" style={{ color: "#2e6b8a" }}>
          Política de Privacidade — QAP, QRV!
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "#5b7a8f" }}>
          Última atualização: 19 de junho de 2026
        </p>

        <Section title="1. Quem somos">
          O <strong>QAP, QRV!</strong> (site <a className="underline" href="https://miketools.top">miketools.top</a>) é
          uma central gratuita de ferramentas operacionais voltada ao policial
          militar do Estado de São Paulo. Esta política descreve como tratamos
          suas informações ao usar o site ou o aplicativo. Em caso de dúvidas,
          contato pelo e-mail{" "}
          <a className="underline" href="mailto:suporte.qapqrv@gmail.com">
            suporte.qapqrv@gmail.com
          </a>.
        </Section>

        <Section title="2. Dados que coletamos">
          <p>Não exigimos cadastro nem login. Os seguintes dados podem ser tratados:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Dados locais (armazenamento no seu dispositivo)</strong>: favoritos, histórico,
              escalas baixadas, preferências de tema e configurações. Ficam no
              <em> localStorage</em> do navegador/app, não são enviados a nós.
            </li>
            <li>
              <strong>Notificações push</strong>: se você aceitar, geramos um token
              anônimo para enviar lembretes de escala. Pode ser revogado a
              qualquer momento nas configurações do navegador/sistema.
            </li>
            <li>
              <strong>Logs técnicos</strong>: nossa hospedagem registra endereço IP,
              user-agent e horário das requisições para fins de segurança e
              prevenção de abuso, por até 30 dias.
            </li>
          </ul>
        </Section>

        <Section title="3. Cookies e tecnologias semelhantes">
          Usamos armazenamento local (<em>localStorage</em>, <em>sessionStorage</em>) para o
          funcionamento do app e cookies de terceiros para publicidade e análise.
          Você pode bloquear ou apagar cookies a qualquer momento nas
          configurações do seu navegador.
        </Section>

        <Section title="4. Publicidade — Google AdSense e AdMob">
          <p>
            Para manter o serviço gratuito, exibimos anúncios fornecidos pelo
            <strong> Google AdSense</strong> (no site) e <strong>Google AdMob</strong> (no
            aplicativo Android).
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              O Google, como provedor terceirizado, utiliza cookies (incluindo o
              cookie <strong>DART</strong>) e identificadores de publicidade para veicular
              anúncios com base em visitas anteriores a este e a outros sites.
            </li>
            <li>
              O uso do cookie DART pela Google permite que ela e seus parceiros
              veiculem anúncios aos seus usuários com base nas visitas a sites
              na Internet.
            </li>
            <li>
              Você pode desativar a publicidade personalizada visitando{" "}
              <a
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
                href="https://adssettings.google.com"
              >
                adssettings.google.com
              </a>
              , ou as iniciativas de opt-out em{" "}
              <a
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.aboutads.info"
              >
                aboutads.info
              </a>
              .
            </li>
            <li>
              Para mais informações sobre como o Google usa dados quando você
              acessa sites de parceiros, consulte{" "}
              <a
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
                href="https://policies.google.com/technologies/partner-sites"
              >
                policies.google.com/technologies/partner-sites
              </a>
              .
            </li>
          </ul>
        </Section>

        <Section title="5. Provedores e subprocessadores">
          Utilizamos serviços de hospedagem e infraestrutura (Lovable Cloud /
          Supabase) e a plataforma de anúncios do Google. Cada fornecedor
          processa dados conforme sua própria política de privacidade.
        </Section>

        <Section title="6. Permissões do dispositivo">
          Algumas funções pedem permissões específicas, sempre opt-in:
          localização (apenas para a ferramenta de localização), notificações
          (para lembretes de escala) e arquivos/armazenamento (para salvar PDFs
          de escala offline). Os dados são usados localmente para a função
          solicitada.
        </Section>

        <Section title="7. Direitos do titular (LGPD/GDPR)">
          Você pode, a qualquer momento, solicitar acesso, correção, exclusão
          ou portabilidade dos seus dados, bem como revogar consentimentos.
          Como a maior parte dos dados fica no seu dispositivo, basta limpar os
          dados do navegador/app ou desinstalar. Para os demais, escreva para{" "}
          <a className="underline" href="mailto:suporte.qapqrv@gmail.com">
            suporte.qapqrv@gmail.com
          </a>.
        </Section>

        <Section title="8. Crianças">
          O serviço não é destinado a menores de 13 anos e não coletamos
          intencionalmente dados desse público.
        </Section>

        <Section title="9. AnyConnect e sistemas da PMESP">
          O app não administra, não controla e não se responsabiliza pelo
          aplicativo AnyConnect ou pelos sistemas da Polícia Militar. Problemas
          de autenticação ou acesso são de responsabilidade dos sistemas da PMESP.
        </Section>

        <Section title="10. Alterações nesta política">
          Esta política pode ser atualizada para refletir mudanças no serviço
          ou na legislação. A data da última atualização é exibida no topo.
        </Section>

        <Section title="11. Contato">
          Dúvidas, solicitações de exclusão ou denúncias:{" "}
          <a className="underline font-semibold" href="mailto:suporte.qapqrv@gmail.com">
            suporte.qapqrv@gmail.com
          </a>
          .
        </Section>
      </div>
      <div className="h-24" />
    </div>
  );
}
