import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  ChevronRight,
  CalendarPlus,
  Mail,
  Calendar,
  ShieldCheck,
  Wallet,
  Search,
  Sun,
  Menu,
  Lock,
  HelpCircle,
  Download,
  Smartphone,
  AlertTriangle,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Manual de Uso — QAP, QRV!" },
      {
        name: "description",
        content:
          "Manual completo do app QAP, QRV! com passo a passo de cada função para usuários iniciantes da PMESP.",
      },
      { property: "og:title", content: "Manual de Uso — QAP, QRV!" },
      {
        property: "og:description",
        content:
          "Aprenda a usar todas as funções do QAP, QRV! com tutoriais simples e diretos.",
      },
    ],
  }),
  component: ManualScreen,
});

type Secao = {
  id: string;
  titulo: string;
  icone: LucideIcon;
};

const SECOES: Secao[] = [
  { id: "boas-vindas", titulo: "1. Boas-vindas", icone: BookOpenCheck },
  { id: "primeiros-passos", titulo: "2. Primeiros passos", icone: Download },
  { id: "tela-inicial", titulo: "3. Tela inicial", icone: Smartphone },
  { id: "vpn", titulo: "4. VPN AnyConnect", icone: ShieldCheck },
  { id: "consulta", titulo: "5. Consulta de escala por ID", icone: Search },
  { id: "marcar", titulo: "6. Marcar / Desmarcar Dejem-Delegada", icone: CalendarPlus },
  { id: "calendario", titulo: "7. Calendário e histórico", icone: Calendar },
  { id: "folha", titulo: "8. Folha de Pagamento (CIAF)", icone: Wallet },
  { id: "inotes", titulo: "9. Email iNotes", icone: Mail },
  { id: "menu", titulo: "10. Menu, tema e instalação", icone: Menu },
  { id: "privacidade", titulo: "11. Privacidade e dados", icone: Lock },
  { id: "problemas", titulo: "12. Solução de problemas", icone: AlertTriangle },
  { id: "suporte", titulo: "13. Suporte", icone: HelpCircle },
];

function ManualScreen() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div
      className="min-h-screen pb-16 text-slate-900 dark:text-slate-100 bg-[#f1f5fb] dark:bg-[#050b18]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* HEADER */}
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <button
            aria-label="Voltar"
            onClick={() => navigate({ to: "/" })}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 transition active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-[18px] font-extrabold uppercase tracking-tight leading-none text-slate-900 dark:text-white">
              Manual de Uso
            </h1>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tudo o que o app faz, passo a passo
            </p>
          </div>
        </div>
        <button
          aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
          onClick={toggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-amber-400 transition active:scale-95"
        >
          <Sun size={20} />
        </button>
      </header>

      {/* INTRO */}
      <section className="px-5">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-white/5 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 p-5 shadow-sm dark:shadow-none">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <BookOpenCheck size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                Bem-vindo ao manual
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                Aqui você encontra explicações claras de cada função do app QAP, QRV!,
                com o passo a passo para quem está usando pela primeira vez.
                Toque em uma seção para abrir o conteúdo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SUMÁRIO */}
      <section className="px-5 mt-5">
        <h3 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-700 dark:text-slate-400">
          Sumário
        </h3>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SECOES.map((s) => {
            const Icon = s.icone;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40 px-3 py-2.5 shadow-sm dark:shadow-none transition active:scale-[0.99] hover:bg-slate-50 dark:hover:bg-slate-900/70"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-400">
                    <Icon size={16} />
                  </div>
                  <span className="flex-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                    {s.titulo}
                  </span>
                  <ChevronRight size={16} className="text-slate-400 dark:text-slate-600" />
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      {/* CONTEÚDO */}
      <div className="mt-8 space-y-6 px-5">
        <Bloco id="boas-vindas" titulo="1. Boas-vindas" icone={BookOpenCheck}>
          <p>
            O <strong>QAP, QRV!</strong> é um aplicativo feito para policiais militares
            do Estado de São Paulo (PMESP). Ele reúne, em um só lugar, atalhos para os
            sistemas internos mais usados no dia a dia: consultar escalas por ID,
            marcar e desmarcar plantões (Dejem e Delegada), acessar a Folha de
            Pagamento (CIAF), o Email iNotes e organizar seus plantões num
            calendário pessoal.
          </p>
          <p>
            O app roda pelo <strong>navegador</strong> e também pode ser instalado
            como atalho na tela inicial do celular, funcionando como um aplicativo.
          </p>
        </Bloco>

        <Bloco id="primeiros-passos" titulo="2. Primeiros passos" icone={Download} tom="blue">
          <SubTitulo>Instalando como atalho (PWA)</SubTitulo>
          <p className="text-[12.5px] text-slate-600 dark:text-slate-400">
            Você pode usar o app direto no navegador, ou instalá-lo como atalho
            para abrir rapidinho pela tela inicial:
          </p>
          <Lista ordenada>
            <li>Abra o site do app no Chrome (Android) ou Safari (iPhone).</li>
            <li>
              <strong>Android:</strong> menu (três pontos) → "Instalar aplicativo"
              ou "Adicionar à tela inicial".
            </li>
            <li>
              <strong>iPhone:</strong> ícone de compartilhar (quadrado com seta) →
              "Adicionar à Tela de Início".
            </li>
          </Lista>

          <Dica>
            Se aparecer um banner no topo da home dizendo "Instalar app", basta
            tocar nele que o próprio app guia a instalação.
          </Dica>
        </Bloco>

        <Bloco id="tela-inicial" titulo="3. Tela inicial" icone={Smartphone}>
          <p>De cima pra baixo, é isso que você vê na home:</p>
          <Lista ordenada>
            <li>
              <strong>Topo:</strong> logo do app, botão <em>sol/lua</em> (alterna
              tema claro/escuro) e ícone <em>☰</em> (abre o menu lateral).
            </li>
            <li>
              <strong>Banner "Instalar app"</strong> — aparece quando dá pra
              instalar o app como atalho no celular.
            </li>
            <li>
              <strong>Card "Consulta escala Dejem/Delegada":</strong> campo pra
              digitar o ID da escala e botão amarelo de seta pra abrir.
            </li>
            <li>
              <strong>Próximas Escalas:</strong> seus 5 próximos plantões
              cadastrados, com etiqueta "Hoje", "Amanhã" ou "Em N dias".
            </li>
            <li>
              <strong>Acesso Rápido:</strong> grid com os botões
              Marcar/Desmarcar, iNotes, Calendário, Guia AnyConnect,
              Folha de Pagamento e Manual.
            </li>
            <li>
              <strong>Minha Escala:</strong> calendário visual do mês com os
              plantões marcados.
            </li>
            <li>
              <strong>Rodapé:</strong> link para a Política de Privacidade.
            </li>
          </Lista>
        </Bloco>

        <Bloco id="vpn" titulo="4. VPN AnyConnect" icone={ShieldCheck} tom="blue">
          <p>
            Quase todos os botões que abrem a <strong>intranet da PMESP</strong>
            {" "}(Consulta de escala, Marcar/Desmarcar, Folha de Pagamento e iNotes)
            exigem que a VPN <strong>Cisco Secure Client (AnyConnect)</strong> esteja
            conectada. Sem a VPN, essas páginas simplesmente não abrem.
          </p>

          <SubTitulo>Como conectar passo a passo</SubTitulo>
          <Lista ordenada>
            <li>
              Toque em <strong>"Guia AnyConnect"</strong> na tela inicial.
            </li>
            <li>Siga o tutorial com prints (Conexão, Servidor, Autenticação EAP-AnyConnect…).</li>
            <li>
              No final, toque em <strong>"Abrir AnyConnect"</strong>. Se o
              Cisco Secure Client não estiver instalado, baixe pela Play Store
              ou App Store.
            </li>
            <li>
              Dentro do AnyConnect, toque em <strong>Connect</strong>, escolha o
              {" "}<strong>Grupo 13 - DEJEM DELEGADA</strong> e faça login.
            </li>
          </Lista>

          <BoxLogin grupo="13 - DEJEM DELEGADA" />

          <Dica>
            Sempre confirme que o AnyConnect está conectado antes de abrir
            qualquer botão que leva à intranet — caso contrário a página fica
            carregando sem fim.
          </Dica>
        </Bloco>

        <Bloco id="consulta" titulo="5. Consulta de escala por ID" icone={Search} tom="blue">
          <Lista ordenada>
            <li>Conecte o AnyConnect (veja a seção VPN).</li>
            <li>
              Na tela inicial, digite o <strong>número da escala</strong> no campo
              "Insira o ID da Escala".
            </li>
            <li>Toque na seta amarela ao lado, ou pressione Enter.</li>
            <li>A escala abre no navegador interno do app.</li>
          </Lista>
        </Bloco>

        <Bloco id="marcar" titulo="6. Marcar / Desmarcar Dejem-Delegada" icone={CalendarPlus}>
          <Lista ordenada>
            <li>Conecte o AnyConnect.</li>
            <li>
              Na home, toque em <strong>"Marcar / Desmarcar Dejem/Delegada"</strong>.
            </li>
            <li>A página oficial da PMESP abre dentro do navegador do app.</li>
            <li>Faça login (mesmas credenciais usadas na intranet PMESP — veja o quadro abaixo).</li>
            <li>Escolha a data, o tipo (Dejem ou Delegada) e confirme a operação.</li>
            <li>Para sair, toque na seta de voltar no topo da tela.</li>
          </Lista>
          <BoxLogin />
        </Bloco>

        <Bloco id="calendario" titulo="7. Calendário e histórico" icone={Calendar} tom="blue">
          <p>
            O calendário guarda os plantões que você marcou, com o valor recebido
            por cada um. Tudo fica salvo <strong>somente no seu celular</strong>
            — o app não envia nada pra nenhum servidor.
          </p>
          <SubTitulo>Adicionar um plantão</SubTitulo>
          <Lista ordenada>
            <li>
              Toque em <strong>"Calendário"</strong> no acesso rápido ou no menu lateral.
            </li>
            <li>Toque no dia desejado.</li>
            <li>Escolha o tipo: Dejem, Delegada Capital ou Delegada Outras.</li>
            <li>Informe horário e valor, depois confirme.</li>
          </Lista>
          <SubTitulo>Editar ou remover</SubTitulo>
          <Lista>
            <li>Toque no plantão existente no calendário.</li>
            <li>Use os botões "Editar" ou "Remover" no card que aparece.</li>
          </Lista>
          <SubTitulo>Histórico</SubTitulo>
          <p>
            O histórico mostra todos os plantões anteriores, com totais por mês.
            Útil para conferir pagamentos e organizar os recebíveis.
          </p>
        </Bloco>

        <Bloco id="folha" titulo="8. Folha de Pagamento (CIAF)" icone={Wallet}>
          <Lista ordenada>
            <li>Conecte o AnyConnect.</li>
            <li>
              Toque em <strong>"Folha de Pagamento"</strong>.
            </li>
            <li>
              A página do CIAF abre em <strong>modo celular</strong> dentro do app.
            </li>
            <li>Faça login (veja o quadro abaixo) e consulte holerites e demais informações financeiras.</li>
          </Lista>
          <BoxLogin />
          <Dica>
            Se a página abrir em formato de computador, feche o navegador interno
            e tente novamente — o app força a versão mobile do CIAF.
          </Dica>
        </Bloco>

        <Bloco id="inotes" titulo="9. Email iNotes" icone={Mail} tom="blue">
          <Lista ordenada>
            <li>Conecte o AnyConnect.</li>
            <li>
              Toque em <strong>"Email iNotes"</strong>.
            </li>
            <li>A página oficial do correio PMESP abre no navegador.</li>
            <li>Faça login (mesmas credenciais — veja o quadro abaixo).</li>
          </Lista>
          <BoxLogin />
        </Bloco>

        <Bloco id="menu" titulo="10. Menu lateral, tema e instalação" icone={Menu}>
          <SubTitulo>Menu lateral (☰)</SubTitulo>
          <p>
            Toque no ícone <strong>☰</strong> no canto superior direito da home.
            O menu mostra atalhos para: Início, Calendário, Correio PMESP,
            Folha de Pagamento, Guia AnyConnect, Manual e Política de Privacidade.
            Ele também tem o botão de <strong>instalar o app</strong>
            {" "}(quando disponível) e o <strong>toggle de tema</strong>
            {" "}claro/escuro.
          </p>

          <SubTitulo>Tema claro / escuro</SubTitulo>
          <Lista>
            <li>
              Toque no <strong>sol/lua</strong> no topo direito da home.
            </li>
            <li>
              Ou abra o menu lateral e toque em "Modo claro" / "Modo escuro".
            </li>
          </Lista>
          <Dica>O tema escolhido é lembrado mesmo depois de fechar o app.</Dica>
        </Bloco>

        <Bloco id="privacidade" titulo="11. Privacidade e dados" icone={Lock} tom="blue">
          <p>
            Seus plantões, valores e histórico ficam guardados <strong>apenas no
            seu celular</strong>. O app não envia esses dados para nenhum servidor.
            Login e senha são digitados direto nos sites oficiais da PMESP, dentro
            do navegador interno — o app não vê nem armazena essas informações.
          </p>
          <p>
            Para mais detalhes, leia a{" "}
            <Link to="/privacidade" className="font-semibold text-blue-700 underline dark:text-blue-400">
              Política de Privacidade
            </Link>
            .
          </p>
        </Bloco>

        <Bloco id="problemas" titulo="12. Solução de problemas" icone={AlertTriangle}>
          <SubTitulo>Página fica carregando e não abre</SubTitulo>
          <Lista>
            <li>Confirme que o AnyConnect está realmente conectado.</li>
            <li>Feche o navegador interno e tente abrir de novo.</li>
            <li>Se persistir, desconecte e reconecte a VPN.</li>
          </Lista>

          <SubTitulo>Botão "Abrir AnyConnect" não faz nada</SubTitulo>
          <Lista>
            <li>Verifique se o Cisco Secure Client está instalado no celular.</li>
            <li>Se não estiver, baixe pela Play Store ou App Store.</li>
          </Lista>

          <SubTitulo>Folha de Pagamento abre em formato de PC</SubTitulo>
          <Lista>
            <li>
              Feche a aba e abra de novo pelo botão "Folha de Pagamento" — o app
              força a versão mobile do CIAF.
            </li>
          </Lista>

          <SubTitulo>Histórico do calendário sumiu</SubTitulo>
          <Lista>
            <li>
              Os dados ficam só no celular. Se você limpar os dados do navegador
              ou desinstalar o atalho, o histórico é perdido.
            </li>
          </Lista>
        </Bloco>

        <Bloco id="suporte" titulo="13. Suporte" icone={HelpCircle} tom="blue">
          <p>
            Encontrou um erro ou tem sugestão de melhoria? Procure o canal de
            contato divulgado junto com o app. Quanto mais detalhes você enviar
            (qual tela, o que apareceu, qual celular), mais rápido o problema é
            resolvido.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => navigate({ to: "/" })}
              className="rounded-xl bg-amber-500 px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-black active:scale-95"
            >
              Voltar ao início
            </button>
            <button
              onClick={() => navigate({ to: "/anyconnect" })}
              className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 active:scale-95"
            >
              Abrir Guia AnyConnect
            </button>
          </div>
        </Bloco>
      </div>
    </div>
  );
}

function Bloco({
  id,
  titulo,
  icone: Icone,
  tom = "gold",
  children,
}: {
  id: string;
  titulo: string;
  icone: LucideIcon;
  tom?: "gold" | "blue";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkHash = () => {
      if (window.location.hash === `#${id}`) {
        setOpen(true);
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, [id]);

  const iconCls =
    tom === "blue"
      ? "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-400"
      : "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400";

  return (
    <section
      id={id}
      className="scroll-mt-20 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/5 dark:bg-slate-900/40 shadow-sm dark:shadow-none"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-5 text-left transition active:scale-[0.995] hover:bg-slate-50 dark:hover:bg-slate-900/70"
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconCls}`}>
          <Icone size={18} />
        </div>
        <h2 className="flex-1 text-[16px] font-extrabold text-slate-900 dark:text-white">
          {titulo}
        </h2>
        <ChevronRight
          size={20}
          className={`shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <div className="space-y-3 px-5 pb-5 text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-300 animate-fade-in">
          {children}
        </div>
      )}
    </section>
  );
}

function SubTitulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-3 text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
      {children}
    </h3>
  );
}

function Lista({
  children,
  ordenada = false,
}: {
  children: React.ReactNode;
  ordenada?: boolean;
}) {
  const cls =
    "ml-5 space-y-1.5 text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-300 [&>li]:pl-1";
  return ordenada ? (
    <ol className={`list-decimal ${cls}`}>{children}</ol>
  ) : (
    <ul className={`list-disc ${cls}`}>{children}</ul>
  );
}

function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-[12.5px] leading-relaxed text-amber-900 dark:text-amber-100">
      <strong className="font-bold">Dica: </strong>
      {children}
    </div>
  );
}

function BoxLogin({ grupo }: { grupo?: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 text-[12.5px] leading-relaxed text-blue-900 dark:text-blue-100">
      <KeyRound size={16} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />
      <div className="space-y-0.5">
        <p><strong>Usuário:</strong> seu CPF (somente números)</p>
        <p><strong>Senha:</strong> a mesma da aba <strong>Procedimentos</strong> da intranet PMESP</p>
        {grupo && <p><strong>Grupo:</strong> {grupo}</p>}
      </div>
    </div>
  );
}
