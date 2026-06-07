import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft, Mail } from "lucide-react";

export const Route = createFileRoute("/politica-de-privacidade")({
  component: PoliticaDePrivacidadePage,
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
        content:
          "Como o QAP, QRV! trata seus dados, permissões e privacidade.",
      },
      {
        property: "og:url",
        content: "https://miketools.top/politica-de-privacidade",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://miketools.top/politica-de-privacidade",
      },
    ],
  }),
});

function Secao({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-[18px] sm:text-[20px] font-extrabold text-[#2e6b8a] mb-2">
        {numero}. {titulo}
      </h2>
      <div className="text-[15px] leading-[1.65] text-slate-700 space-y-3">
        {children}
      </div>
    </section>
  );
}

function PoliticaDePrivacidadePage() {
  const atualizadoEm = "07 de junho de 2026";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef4fa] via-[#f5f8fb] to-white px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          to="/inicio"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#2e6b8a] hover:underline"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <article className="mt-4 rounded-3xl bg-white shadow-[0_8px_32px_rgba(46,107,138,0.12)] ring-1 ring-slate-100 overflow-hidden">
          <header
            className="px-6 sm:px-10 py-8 sm:py-10 text-white"
            style={{
              background:
                "linear-gradient(135deg, #2e6b8a 0%, #3d87ac 60%, #4ea2cc 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                <ShieldCheck size={26} />
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] opacity-80">
                  QAP, QRV!
                </p>
                <h1 className="text-[22px] sm:text-[28px] font-extrabold leading-tight">
                  Política de Privacidade
                </h1>
              </div>
            </div>
            <p className="mt-4 text-[13px] opacity-90">
              Última atualização: {atualizadoEm}
            </p>
          </header>

          <div className="px-6 sm:px-10 py-8 sm:py-10">
            <p className="text-[15px] leading-[1.65] text-slate-700">
              Esta Política de Privacidade descreve como o aplicativo{" "}
              <strong>QAP, QRV!</strong> trata as informações relacionadas ao
              seu uso. Ao utilizar o aplicativo, você concorda com as práticas
              aqui descritas.
            </p>

            <Secao numero={1} titulo="Sobre o aplicativo">
              <p>
                O <strong>QAP, QRV!</strong> é um aplicativo voltado a
                profissionais de segurança pública, reunindo ferramentas de
                consulta, calendário de escalas, atalhos para sistemas
                institucionais e utilitários do dia a dia operacional.
              </p>
              <p>
                O app funciona predominantemente de forma local, sem exigir
                cadastro de conta.
              </p>
            </Secao>

            <Secao numero={2} titulo="Dados coletados">
              <p>
                Não coletamos dados pessoais identificáveis em nossos
                servidores. O QAP, QRV! não exige cadastro, login ou envio de
                informações pessoais para funcionar.
              </p>
              <p>
                Podemos coletar, de forma anônima e agregada, dados técnicos
                como tipo de dispositivo, idioma e métricas de uso para
                melhorar a experiência do aplicativo.
              </p>
            </Secao>

            <Secao numero={3} titulo="Permissões utilizadas">
              <p>
                Algumas funcionalidades podem solicitar permissões específicas
                do dispositivo, sempre com autorização explícita do usuário:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Localização</strong>: usada apenas no momento da
                  consulta da sua localização atual; não é armazenada nem
                  enviada a terceiros.
                </li>
                <li>
                  <strong>Notificações</strong>: para lembretes de plantão e
                  avisos do app.
                </li>
                <li>
                  <strong>Internet</strong>: para abrir sistemas institucionais
                  e exibir anúncios.
                </li>
              </ul>
            </Secao>

            <Secao numero={4} titulo="Armazenamento local">
              <p>
                Preferências, favoritos, histórico de uso e dados da sua escala
                ficam armazenados <strong>apenas no seu dispositivo</strong>,
                no armazenamento local do navegador ou do aplicativo. Esses
                dados não são enviados para servidores do QAP, QRV!.
              </p>
              <p>
                Você pode apagar esses dados a qualquer momento limpando o
                armazenamento do app ou do navegador.
              </p>
            </Secao>

            <Secao numero={5} titulo="Publicidade (Google AdMob)">
              <p>
                O aplicativo pode exibir anúncios fornecidos pelo{" "}
                <strong>Google AdMob</strong> e/ou Google AdSense. Esses
                serviços podem coletar identificadores anônimos e dados de uso
                para exibir anúncios mais relevantes, conforme as políticas do
                Google.
              </p>
              <p>
                Você pode gerenciar suas preferências de anúncios diretamente
                nas configurações do seu dispositivo ou em{" "}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#2e6b8a] underline"
                >
                  adssettings.google.com
                </a>
                .
              </p>
            </Secao>

            <Secao numero={6} titulo="Segurança">
              <p>
                Adotamos boas práticas para proteger o funcionamento do
                aplicativo. Como o app não armazena dados pessoais em
                servidores próprios, o principal cuidado é com o seu próprio
                dispositivo: mantenha o sistema atualizado e use bloqueio de
                tela.
              </p>
              <p>
                Credenciais de sistemas institucionais (PMESP, intranet, etc.)
                são digitadas diretamente nos sites oficiais — o QAP, QRV! não
                vê nem armazena essas informações.
              </p>
            </Secao>

            <Secao numero={7} titulo="Exclusão de dados">
              <p>
                Como não mantemos cadastro de usuários, não há contas para
                excluir. Para apagar todos os dados locais do app:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  No navegador: limpe os dados do site nas configurações do
                  navegador.
                </li>
                <li>
                  No app instalado: limpe o armazenamento do aplicativo nas
                  configurações do dispositivo, ou desinstale o app.
                </li>
              </ul>
              <p>
                Se desejar solicitar formalmente a exclusão de qualquer dado,
                entre em contato pelo e-mail indicado abaixo.
              </p>
            </Secao>

            <Secao numero={8} titulo="Alterações desta política">
              <p>
                Esta Política de Privacidade pode ser atualizada
                periodicamente. A data da última atualização sempre estará
                indicada no topo desta página. O uso continuado do aplicativo
                após alterações representa concordância com a nova versão.
              </p>
            </Secao>

            <Secao numero={9} titulo="Contato">
              <p>
                Em caso de dúvidas, sugestões ou solicitações relacionadas a
                esta política, entre em contato:
              </p>
              <a
                href="mailto:Suporte.qapqrv@gmail.com"
                className="inline-flex items-center gap-2 mt-2 rounded-full bg-[#2e6b8a] px-5 py-2.5 text-[14px] font-bold text-white shadow-md hover:bg-[#27607c] transition"
              >
                <Mail size={16} />
                Suporte.qapqrv@gmail.com
              </a>
            </Secao>

            <p className="mt-10 text-center text-[12px] text-slate-500">
              © {new Date().getFullYear()} QAP, QRV! — Todos os direitos
              reservados.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
