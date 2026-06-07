import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade – QAP, QRV!" },
      {
        name: "description",
        content:
          "Política de Privacidade do aplicativo QAP, QRV!: dados coletados, permissões, armazenamento local, publicidade e contato.",
      },
      { property: "og:title", content: "Política de Privacidade – QAP, QRV!" },
      {
        property: "og:description",
        content: "Como o QAP, QRV! trata seus dados, permissões e privacidade.",
      },
      { property: "og:url", content: "https://miketools.top/politica-de-privacidade" },
    ],
    links: [{ rel: "canonical", href: "https://miketools.top/politica-de-privacidade" }],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          to="/inicio"
          className="mb-4 inline-flex items-center text-sm font-bold text-primary underline-offset-4 hover:underline"
        >
          ← Voltar
        </Link>

        <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
          <header className="bg-primary px-7 py-9 text-primary-foreground sm:px-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] opacity-90">
              QAP, QRV!
            </p>
            <h1 className="text-3xl font-extrabold leading-tight">Política de Privacidade</h1>
            <p className="mt-4 text-sm opacity-90">Última atualização: 07 de junho de 2026</p>
          </header>

          <div className="space-y-7 px-7 py-8 text-[15px] leading-7 text-muted-foreground sm:px-10 sm:py-10">
            <p>
              Esta Política de Privacidade descreve como o aplicativo <strong>QAP, QRV!</strong> trata as informações relacionadas ao seu uso. Ao utilizar o aplicativo, você concorda com as práticas aqui descritas.
            </p>

            <PolicySection title="1. Sobre o aplicativo">
              <p>
                O <strong>QAP, QRV!</strong> é um aplicativo voltado a profissionais de segurança pública, reunindo ferramentas de consulta, calendário de escalas, atalhos para sistemas institucionais e utilitários do dia a dia operacional.
              </p>
              <p>O app funciona predominantemente de forma local, sem exigir cadastro de conta.</p>
            </PolicySection>

            <PolicySection title="2. Dados coletados">
              <p>Não coletamos dados pessoais identificáveis em nossos servidores. O QAP, QRV! não exige cadastro, login ou envio de informações pessoais para funcionar.</p>
              <p>Podemos coletar, de forma anônima e agregada, dados técnicos como tipo de dispositivo, idioma e métricas de uso para melhorar a experiência do aplicativo.</p>
            </PolicySection>

            <PolicySection title="3. Permissões utilizadas">
              <p>Algumas funcionalidades podem solicitar permissões específicas do dispositivo, sempre com autorização explícita do usuário:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Localização</strong>: usada apenas no momento da consulta da sua localização atual; não é armazenada nem enviada a terceiros.</li>
                <li><strong>Notificações</strong>: para lembretes de plantão e avisos do app.</li>
                <li><strong>Internet</strong>: para abrir sistemas institucionais e exibir anúncios.</li>
              </ul>
            </PolicySection>

            <PolicySection title="4. Armazenamento local">
              <p>Preferências, favoritos, histórico de uso e dados da sua escala ficam armazenados <strong>apenas no seu dispositivo</strong>, no armazenamento local do navegador ou do aplicativo. Esses dados não são enviados para servidores do QAP, QRV!.</p>
              <p>Você pode apagar esses dados a qualquer momento limpando o armazenamento do app ou do navegador.</p>
            </PolicySection>

            <PolicySection title="5. Publicidade">
              <p>O aplicativo pode exibir anúncios fornecidos pelo Google AdMob e/ou Google AdSense. Esses serviços podem coletar identificadores anônimos e dados de uso para exibir anúncios mais relevantes, conforme as políticas do Google.</p>
              <p>Você pode gerenciar suas preferências de anúncios diretamente nas configurações do seu dispositivo ou em <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">adssettings.google.com</a>.</p>
            </PolicySection>

            <PolicySection title="6. Segurança">
              <p>Adotamos boas práticas para proteger o funcionamento do aplicativo. Como o app não armazena dados pessoais em servidores próprios, o principal cuidado é com o seu próprio dispositivo: mantenha o sistema atualizado e use bloqueio de tela.</p>
              <p>Credenciais de sistemas institucionais são digitadas diretamente nos sites oficiais — o QAP, QRV! não vê nem armazena essas informações.</p>
            </PolicySection>

            <PolicySection title="7. Exclusão de dados">
              <p>Como não mantemos cadastro de usuários, não há contas para excluir. Para apagar todos os dados locais do app:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>No navegador: limpe os dados do site nas configurações do navegador.</li>
                <li>No app instalado: limpe o armazenamento do aplicativo nas configurações do dispositivo, ou desinstale o app.</li>
              </ul>
              <p>Se desejar solicitar formalmente a exclusão de qualquer dado, entre em contato pelo e-mail indicado abaixo.</p>
            </PolicySection>

            <PolicySection title="8. Alterações desta política">
              <p>Esta Política de Privacidade pode ser atualizada periodicamente. A data da última atualização sempre estará indicada no topo desta página. O uso continuado do aplicativo após alterações representa concordância com a nova versão.</p>
            </PolicySection>

            <PolicySection title="9. Contato">
              <p>Em caso de dúvidas, sugestões ou solicitações relacionadas a esta política, entre em contato:</p>
              <a href="mailto:Suporte.qapqrv@gmail.com" className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground">
                Suporte.qapqrv@gmail.com
              </a>
            </PolicySection>

            <footer className="pt-3 text-center text-xs text-muted-foreground">
              © 2026 QAP, QRV! — Todos os direitos reservados.
            </footer>
          </div>
        </article>
      </div>
    </main>
  );
}

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-extrabold leading-tight text-primary">{title}</h2>
      {children}
    </section>
  );
}