/**
 * Conteúdo editorial estático para a seção /blog.
 * Importante para a aprovação no Google AdSense: o robô avalia o site pelo
 * volume e qualidade do conteúdo público, não pelas ferramentas internas.
 */

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date
  readingMinutes: number;
  category: string;
  // Cada parágrafo ou bloco é um item: string = parágrafo, { h: string } = subtítulo,
  // { list: string[] } = lista com bullets.
  body: Array<string | { h: string } | { list: string[] }>;
};

export const POSTS: BlogPost[] = [
  {
    slug: "escala-dejem-pmesp",
    title: "Como funciona a escala Dejem na PMESP",
    description:
      "Entenda o que é a escala Dejem (Detalhe de Jornada Extra Militar), quem pode participar, como ela é distribuída e dicas para se organizar.",
    publishedAt: "2026-06-10",
    readingMinutes: 7,
    category: "Operacional",
    body: [
      "A escala Dejem — sigla para Detalhe de Jornada Extra Militar — é uma das formas mais conhecidas pelas quais o policial militar do Estado de São Paulo pode realizar jornada complementar remunerada, fora do seu serviço ordinário. Conhecer suas regras evita falhas, perdas de remuneração e até desgaste administrativo.",
      { h: "O que é a Dejem" },
      "A Dejem é uma jornada extra autorizada pela Corporação para reforço do policiamento ostensivo em pontos com maior demanda. O militar trabalha em seu período de folga e recebe um valor por hora trabalhada, conforme tabela vigente. É facultativa: o policial só entra quando se inscreve e é convocado.",
      { h: "Quem pode participar" },
      "Em regra, podem participar policiais militares da ativa que estejam em condições de saúde compatíveis, não estejam respondendo a procedimentos disciplinares restritivos e atendam aos critérios da Diretriz vigente. A inscrição costuma ser feita pela intranet da PMESP, com janelas de abertura definidas pelas unidades.",
      { h: "Como a escala é montada" },
      "Cada OPM publica a relação de Dejem disponíveis, considerando o efetivo necessário, a função (motorizado, a pé, atendimento) e o local. O policial pleiteia as vagas e a Seção de Pessoal consolida a escala, observando intervalos mínimos entre serviços para preservar a higidez física do efetivo.",
      { h: "Cuidados práticos" },
      {
        list: [
          "Confira sempre o dia, horário, local de apresentação e função antes de sair de casa.",
          "Leve o material orgânico (colete, arma, munição, rádio) em ordem.",
          "Respeite o intervalo entre Dejem e serviço ordinário previsto na diretriz — não vale acumular sem descanso.",
          "Em caso de impedimento, comunique a chefia o quanto antes para abrir vaga a outro militar.",
        ],
      },
      { h: "Como o QAP, QRV! ajuda" },
      "O app permite consultar a escala publicada pela sua unidade, salvar o PDF para acesso offline, marcar o serviço no calendário com lembrete automático e compartilhar a escala com colegas. Tudo sem cadastro: basta abrir e usar.",
      "Importante: o QAP, QRV! é independente. Sempre confirme dados oficiais nos canais da Corporação.",
    ],
  },
  {
    slug: "diferenca-dejem-delegada",
    title: "Dejem x Delegada: qual a diferença na prática",
    description:
      "Comparativo direto entre Dejem e Operação Delegada — quem paga, onde se trabalha, como se inscrever e o que muda no contracheque.",
    publishedAt: "2026-06-12",
    readingMinutes: 6,
    category: "Operacional",
    body: [
      "Muito policial militar confunde Dejem e Delegada porque ambas são jornadas extras remuneradas. Mas elas têm origens, empregadores e regras diferentes.",
      { h: "Quem paga" },
      "A Dejem é paga pelo Governo do Estado de São Paulo, dentro da estrutura da própria PMESP. Já a Operação Delegada é paga pela Prefeitura de São Paulo (ou de outros municípios que firmam convênio) para reforço do policiamento em áreas e horários definidos pelo município.",
      { h: "Onde se trabalha" },
      "Na Dejem, o policial atua em pontos definidos pela OPM, normalmente reforçando o policiamento ostensivo regular. Na Delegada, o emprego é pautado por demandas municipais: feiras, terminais, áreas comerciais, zeladoria urbana e eventos.",
      { h: "Inscrição e escala" },
      "Ambas usam a intranet PMESP para inscrição. As vagas, valores e horários, porém, vêm de fontes distintas — Comando da Unidade no caso da Dejem, convênio municipal no caso da Delegada. Verifique sempre o edital de cada operação.",
      { h: "Remuneração" },
      "Os valores por hora costumam ser diferentes. A Delegada, por ser custeada pelo município, segue tabela do convênio. A Dejem segue tabela estadual. Em ambos os casos, há tributação na fonte e os valores entram em rubrica específica do contracheque, separados do soldo.",
      { h: "Qual escolher" },
      "Não há regra única. Muitos policiais combinam as duas conforme disponibilidade e proximidade do local. Use o QAP, QRV! para enxergar Dejem e Delegada no mesmo calendário, evitar conflitos de horário e respeitar o intervalo mínimo entre serviços.",
    ],
  },
  {
    slug: "organizacao-plantao",
    title: "5 dicas para se organizar nos plantões",
    description:
      "Sono, alimentação, materiais e calendário: práticas simples para chegar bem ao serviço e cuidar da saúde no longo prazo.",
    publishedAt: "2026-06-14",
    readingMinutes: 5,
    category: "Bem-estar",
    body: [
      "Trabalhar em escala exige adaptação do corpo e da rotina. Pequenos hábitos fazem diferença para evitar fadiga, irritação e queda de rendimento no plantão.",
      { h: "1. Planeje o sono com antecedência" },
      "Antes de um plantão noturno, tente dormir em blocos de 90 minutos durante a tarde. Use cortinas blackout, máscara de olhos e protetor auricular. Após o serviço, durma o quanto for necessário — não tente ‘compensar’ todo o sono em um único bloco curto.",
      { h: "2. Alimentação leve e funcional" },
      "Evite refeições muito pesadas antes de assumir. Aposte em proteínas magras, frutas e carboidratos complexos. Leve água em quantidade suficiente — desidratação é causa silenciosa de queda de atenção.",
      { h: "3. Cheque o material no dia anterior" },
      "Colete, arma, munição, lanterna, rádio carregado, documentos. Uma checklist evita esquecer item crítico na correria.",
      { h: "4. Calendário visível" },
      "Tenha sua escala em um lugar fácil de consultar — no app QAP, QRV!, num calendário compartilhado com a família e, se possível, com lembrete 24h antes do serviço.",
      { h: "5. Cuide da saúde mental" },
      "Conversar com pares de confiança sobre o que sentiu no serviço previne acúmulos. Se notar sinais de esgotamento, procure o SAS (Serviço de Assistência Social) ou um profissional de saúde mental.",
    ],
  },
  {
    slug: "vpn-anyconnect-seguranca",
    title: "Como usar a VPN AnyConnect com segurança",
    description:
      "Boas práticas para conexão à intranet PMESP via AnyConnect: senha, atualizações, dispositivos confiáveis e o que evitar.",
    publishedAt: "2026-06-16",
    readingMinutes: 6,
    category: "Tecnologia",
    body: [
      "O AnyConnect é o cliente VPN usado para acessar a intranet da PMESP fora da rede corporativa. Como ele dá acesso a sistemas sensíveis, alguns cuidados são obrigatórios.",
      { h: "Dispositivo confiável" },
      "Use a VPN apenas em aparelhos pessoais sob seu controle. Evite computadores compartilhados, lan-houses e máquinas de terceiros. No celular, mantenha bloqueio de tela com biometria ou senha forte.",
      { h: "Atualizações em dia" },
      "Sistema operacional, app AnyConnect e navegador devem estar sempre atualizados. Falhas conhecidas costumam ser exploradas em poucas horas após a divulgação de uma vulnerabilidade.",
      { h: "Senha forte e sem reuso" },
      "Nunca reuse a senha da intranet em outros serviços. Use um gerenciador de senhas (KeePass, Bitwarden) e ative o segundo fator quando disponível.",
      { h: "Desconecte ao terminar" },
      "Encerre a sessão e desconecte a VPN ao terminar o uso. Deixar a conexão ativa em segundo plano expõe a rede caso o aparelho seja perdido ou roubado.",
      { h: "Cuidado com o que você acessa" },
      "Não tire screenshots de telas restritas para postar em redes sociais ou grupos. Informação interna é informação interna — vazamentos podem gerar consequências disciplinares e penais.",
      "O QAP, QRV! oferece um atalho para abrir o AnyConnect e indicadores de status da VPN, mas não armazena suas credenciais nem trafega dados sensíveis pelos nossos servidores. O acesso continua sob sua responsabilidade.",
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
