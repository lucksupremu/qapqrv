import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — QAP, QRV! | Ferramentas operacionais PMESP" },
      {
        name: "description",
        content:
          "Conheça o QAP, QRV!: missão, equipe, funcionalidades, contato e política de privacidade do app de ferramentas para o policial militar de São Paulo.",
      },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <div className="min-h-screen pb-24 bg-background">
      <AppHeader showBrand={false} title="Sobre" subtitle="QAP, QRV!" />

      <main className="px-5 mt-6 space-y-7 text-sm leading-relaxed max-w-2xl mx-auto">
        <section>
          <h2 className="font-bold text-base mb-2">Nossa missão</h2>
          <p className="text-muted-foreground">
            O <strong>QAP, QRV!</strong> nasceu para reunir, em um único lugar, as
            ferramentas que o policial militar do Estado de São Paulo usa todos
            os dias: consulta de escalas Dejem e Delegada, calendário, lembretes,
            atalhos para a intranet via AnyConnect e utilidades de campo. Tudo
            sem cadastro e sem login.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Principais funcionalidades</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Consulta e armazenamento offline de escalas Dejem e Delegada.</li>
            <li>Calendário com marcação automática de plantões e folgas.</li>
            <li>Lembretes locais com notificações push (opt-in).</li>
            <li>Atalhos para a intranet PMESP via VPN AnyConnect.</li>
            <li>Compartilhamento rápido de escalas com colegas.</li>
            <li>Histórico, favoritos e busca global.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Para quem</h2>
          <p className="text-muted-foreground">
            Para o policial militar do Estado de São Paulo e familiares
            interessados em acompanhar a escala. O app respeita o tempo do
            usuário: abre rápido, funciona offline e não pede dados pessoais.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Quem mantém</h2>
          <p className="text-muted-foreground">
            Projeto independente, sem vínculo oficial com a PMESP. Desenvolvido
            e mantido por um policial militar entusiasta de tecnologia, com
            colaboração de colegas que sugerem melhorias.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Como o app se sustenta</h2>
          <p className="text-muted-foreground">
            Para continuar gratuito, exibimos anúncios de Google AdSense (web) e
            Google AdMob (app Android). Os anúncios são responsáveis por toda a
            manutenção da infraestrutura. Detalhes na{" "}
            <Link to="/privacidade" className="underline font-semibold">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Conteúdo e suporte</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>
              <Link to="/manual" className="underline">Manual completo</Link>
            </li>
            <li>
              <Link to="/blog" className="underline">Artigos e dicas operacionais</Link>
            </li>
            <li>
              <Link to="/contato" className="underline">Fale conosco</Link>
            </li>
            <li>
              <Link to="/termos" className="underline">Termos de Uso</Link>
            </li>
            <li>
              <Link to="/privacidade" className="underline">Política de Privacidade</Link>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Contato</h2>
          <p className="text-muted-foreground">
            Sugestões, ferramentas e parcerias:{" "}
            <a
              href="mailto:suporte.qapqrv@gmail.com"
              className="underline font-semibold"
            >
              suporte.qapqrv@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Versão</h2>
          <p className="text-muted-foreground">1.0.0</p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
