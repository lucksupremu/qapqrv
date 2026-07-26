import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — MIKE TOOLS | Ferramentas operacionais PMESP" },
      {
        name: "description",
        content:
          "Conheça o MIKE TOOLS: missão, equipe, funcionalidades, contato e política de privacidade do app de ferramentas para o policial militar de São Paulo.",
      },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <div className="min-h-screen pb-24 bg-background">
      <AppHeader showBrand={false} title="Sobre" subtitle="MIKE TOOLS" />

      <main className="px-5 mt-6 space-y-7 text-sm leading-relaxed max-w-2xl mx-auto">
        <section>
          <h2 className="font-bold text-base mb-2">Nossa missão</h2>
          <p className="text-muted-foreground">
            O <strong>MIKE TOOLS</strong> nasceu para reunir, em um único lugar, as
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
          <h2 className="font-bold text-base mb-2">História do projeto</h2>
          <p className="text-muted-foreground">
            O MIKE TOOLS começou como um script pessoal para consultar escalas Dejem
            sem precisar abrir cinco abas na intranet. Em pouco tempo virou uma
            página web, depois um PWA e, mais adiante, também um aplicativo Android.
            Hoje é usado diariamente por policiais de várias OPMs do Estado de
            São Paulo — e continua sendo desenvolvido nas folgas, com base em
            feedback direto do efetivo.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Como sugerir uma ferramenta</h2>
          <p className="text-muted-foreground">
            Toda ferramenta nova no app veio de um pedido real. Se você tem uma
            ideia que pode ajudar outros colegas — checklist, calculadora, atalho,
            calendário —, envie por e-mail ou pelo formulário de contato. Sugestões
            claras, com exemplo de uso, entram em desenvolvimento mais rápido.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Perguntas frequentes</h2>
          <div className="space-y-4 text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">O app é oficial da PMESP?</p>
              <p>Não. É um projeto independente, mantido por iniciativa própria. Sempre confirme dados críticos pelos canais oficiais.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Preciso fazer cadastro?</p>
              <p>Não. O app funciona sem login. Seus dados ficam apenas no seu dispositivo.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">O app custa alguma coisa?</p>
              <p>Não. É gratuito e sustentado por anúncios discretos em páginas de conteúdo (blog, manual, sobre).</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Funciona offline?</p>
              <p>Sim. Depois da primeira consulta, escala, calendário e lembretes continuam disponíveis mesmo sem sinal.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Minha senha da intranet é enviada para vocês?</p>
              <p>Não. O MIKE TOOLS não coleta, não armazena nem transmite credenciais. A autenticação continua sendo feita pelo Cisco Secure Client (AnyConnect) diretamente com o servidor da PMESP.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Como reporto um bug?</p>
              <p>Pelo formulário de <Link to="/contato" className="underline">contato</Link> ou pelo e-mail de suporte. Descreva o passo a passo e, se possível, anexe print.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Vocês recebem dados da PMESP em tempo real?</p>
              <p>Não temos integração privilegiada. O app consulta as mesmas páginas públicas ou internas às quais qualquer policial autenticado tem acesso.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Segurança</h2>
          <p className="text-muted-foreground">
            Levamos segurança a sério porque o público-alvo é policial militar.
            Todo o processamento sensível — como digitação de credenciais da
            intranet, autenticação da VPN e leitura do PDF de escala — acontece
            no próprio dispositivo. Não temos servidor que armazene senhas,
            escalas ou informação de contracheque. Cofres biométricos (quando o
            aparelho suporta) usam a API nativa do Android/iOS, sem chave
            trafegada. Sempre que o app precisa abrir um serviço externo, ele
            avisa antes e mostra o domínio de destino.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Privacidade</h2>
          <p className="text-muted-foreground">
            Não coletamos e-mail, telefone, matrícula ou nome. Dados de escala e
            preferências ficam no armazenamento local do navegador ou do APK.
            Cookies de anúncios só aparecem em páginas editoriais públicas
            (blog, manual, conteúdos institucionais) — nunca dentro das
            ferramentas operacionais. Todos os detalhes técnicos estão na{" "}
            <Link to="/privacidade" className="underline font-semibold">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Tecnologias utilizadas</h2>
          <p className="text-muted-foreground">
            O app é construído com React, TypeScript, Vite e TanStack Router.
            No mobile, empacotamos em APK Android via Capacitor. A base é PWA:
            funciona offline, pode ser instalada e envia notificações locais.
            Não usamos backend proprietário — apenas serviços do próprio
            aparelho e integrações públicas com portais oficiais.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Atualizações e melhoria contínua</h2>
          <p className="text-muted-foreground">
            Publicamos melhorias com frequência, priorizando estabilidade e
            velocidade em vez de acumular funcionalidades. Cada nova ferramenta
            entra depois de ter sido pedida por policiais de campo. O
            calendário, por exemplo, foi refeito três vezes até chegar à
            versão atual, com destaque visual para dia e noite, contador
            mensal de horas e post-it para compromissos.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Compromisso</h2>
          <p className="text-muted-foreground">
            Enquanto o MIKE TOOLS for útil, seguimos publicando atualizações
            gratuitas. Se você usa o app no plantão, considera compartilhar com
            um colega — o boca a boca é o que sustenta o projeto vivo.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Versão</h2>
          <p className="text-muted-foreground">3.0.0</p>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
