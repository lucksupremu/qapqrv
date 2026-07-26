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
      { h: "Como o MIKE TOOLS ajuda" },
      "O app permite consultar a escala publicada pela sua unidade, salvar o PDF para acesso offline, marcar o serviço no calendário com lembrete automático e compartilhar a escala com colegas. Tudo sem cadastro: basta abrir e usar.",
      "Importante: o MIKE TOOLS é independente. Sempre confirme dados oficiais nos canais da Corporação.",
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
      "Não há regra única. Muitos policiais combinam as duas conforme disponibilidade e proximidade do local. Use o MIKE TOOLS para enxergar Dejem e Delegada no mesmo calendário, evitar conflitos de horário e respeitar o intervalo mínimo entre serviços.",
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
      "Tenha sua escala em um lugar fácil de consultar — no app MIKE TOOLS, num calendário compartilhado com a família e, se possível, com lembrete 24h antes do serviço.",
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
      "O MIKE TOOLS oferece um atalho para abrir o AnyConnect e indicadores de status da VPN, mas não armazena suas credenciais nem trafega dados sensíveis pelos nossos servidores. O acesso continua sob sua responsabilidade.",
    ],
  },
  {
    slug: "consultar-escala-passo-a-passo",
    title: "Como consultar sua escala Dejem passo a passo",
    description:
      "Guia completo para acessar, salvar e compartilhar a escala Dejem publicada pela sua OPM, mesmo sem sinal de internet.",
    publishedAt: "2026-06-20",
    readingMinutes: 8,
    category: "Operacional",
    body: [
      "A escala Dejem é publicada pela Seção de Pessoal de cada OPM em ciclos que costumam variar entre quinzenal e mensal. Saber onde procurar, quando conferir e como salvar uma cópia para acesso offline é básico para não perder um serviço.",
      { h: "Passo 1 — Onde a escala fica publicada" },
      "A publicação oficial ocorre em canais internos: intranet da PMESP, murais físicos da OPM e, em muitas unidades, grupos oficiais de comunicação. A versão que vale é sempre a assinada pelo Comandante da OPM ou por quem ele designar. Documentos que circulam sem assinatura devem ser confirmados antes de servir de referência.",
      { h: "Passo 2 — Frequência de conferência" },
      "Adote uma rotina fixa. Uma boa prática é conferir a escala ao menos duas vezes por semana: uma no início da semana, para se planejar, e outra 24 a 48 horas antes de cada plantão previsto, para confirmar horário e local. Alterações de última hora acontecem, especialmente em datas com eventos.",
      { h: "Passo 3 — Como abrir a escala no MIKE TOOLS" },
      "No app, toque em ‘Consulta de Escala’, informe sua unidade e o período desejado. O MIKE TOOLS busca a escala publicada, exibe em formato legível e permite marcar o serviço no calendário do próprio app com um lembrete automático programado para algumas horas antes do horário de apresentação.",
      { h: "Passo 4 — Salvando para acesso offline" },
      "Toque em ‘Baixar’ para armazenar a escala localmente. A cópia fica disponível em ‘Escalas baixadas’ e pode ser aberta mesmo sem sinal de internet — útil em plantões em bairros com cobertura ruim ou em áreas rurais. O download não expira e você pode remover a qualquer momento.",
      { h: "Passo 5 — Compartilhando com colegas" },
      "Use o botão de compartilhamento para enviar a escala por WhatsApp, Telegram ou e-mail. O app gera um link com a imagem da escala já ajustada para leitura no celular, sem expor dados sensíveis do dispositivo do remetente.",
      { h: "Passo 6 — Lidando com erros comuns" },
      {
        list: [
          "Escala não aparece: confirme se a OPM já publicou o período. Alguns comandos publicam apenas na sexta-feira anterior.",
          "Dados diferentes do publicado: force uma atualização puxando a lista para baixo; o app faz nova busca.",
          "Sem internet: abra em ‘Escalas baixadas’ a última versão salva localmente.",
          "Escala com nome trocado: comunique imediatamente sua Seção de Pessoal — o MIKE TOOLS só exibe o que foi publicado oficialmente.",
        ],
      },
      { h: "Passo 7 — Depois do plantão" },
      "Confira se o serviço foi lançado corretamente na folha de frequência. Erros administrativos são mais fáceis de corrigir na semana seguinte do que meses depois, quando a folha já foi encerrada.",
      "Seguindo esses passos você reduz drasticamente a chance de perder um plantão por confusão de horário ou local — e ainda ganha uma trilha organizada de todas as suas Dejem no calendário do app.",
    ],
  },
  {
    slug: "direitos-operacao-delegada",
    title: "Direitos e deveres na Operação Delegada",
    description:
      "O que o policial pode e não pode fazer durante a Operação Delegada, valores, jornada, uso de equipamentos e limites de atuação.",
    publishedAt: "2026-06-24",
    readingMinutes: 7,
    category: "Operacional",
    body: [
      "A Operação Delegada é um convênio entre a PMESP e municípios — o mais conhecido é o da Prefeitura de São Paulo — em que o policial atua em áreas de interesse do município durante sua folga, com remuneração paga pela prefeitura conveniada. Conhecer direitos e deveres evita problemas administrativos e mal-entendidos com autoridades municipais.",
      { h: "Vínculo funcional" },
      "Mesmo durante a Delegada, o policial continua sendo militar do estado. Ele responde pelo Estatuto dos Policiais Militares (Lei 42/1974), pelas normas disciplinares da Corporação e pela Constituição. O município não passa a ser seu ‘empregador’ no sentido celetista — é apenas o pagador do convênio.",
      { h: "Jornada e intervalo" },
      "A jornada é definida no edital da operação e costuma variar entre 4 e 8 horas. O intervalo mínimo entre o serviço ordinário e a Delegada deve ser respeitado (em regra, 11 horas). Ignorar esse intervalo pode gerar responsabilização administrativa e coloca em risco a própria integridade do militar.",
      { h: "Emprego e limites geográficos" },
      "O policial atua nos pontos definidos pelo edital municipal. Não é lícito ‘abandonar o ponto’ para atender demanda espontânea distante, salvo em caso de flagrante grave. A supervisão é feita por oficiais da PMESP, não por servidores municipais, mesmo que estes indiquem áreas prioritárias.",
      { h: "Equipamento" },
      "O uso é o mesmo do serviço ordinário: uniforme de PM, colete, arma orgânica, munição, algemas, rádio. Não é permitido usar equipamento de terceiros nem fardamento não oficial. Viaturas usadas na operação seguem os mesmos protocolos de utilização e responsabilidade.",
      { h: "Remuneração" },
      "O pagamento segue tabela do convênio e é feito por meio de rubrica específica no contracheque. Costuma cair no mês seguinte à operação. Guarde comprovantes: em caso de divergência, a comprovação é responsabilidade do próprio militar. O valor é tributável e sofre desconto na fonte.",
      { h: "Deveres específicos" },
      {
        list: [
          "Apresentar-se com uniforme completo e material orgânico em ordem.",
          "Registrar entrada e saída no ponto conforme instruções do edital.",
          "Comunicar de imediato qualquer ocorrência relevante ao superior direto.",
          "Não realizar propaganda pessoal ou político-partidária em serviço.",
          "Respeitar a hierarquia militar, mesmo diante de solicitações de servidores municipais.",
        ],
      },
      { h: "Direitos" },
      "Além da remuneração prevista no convênio, o policial tem direito a assistência jurídica da Corporação em ocorrências realizadas em serviço, a atendimento médico em caso de acidente e a benefícios previdenciários aplicáveis à atividade militar.",
      "A Operação Delegada é uma oportunidade importante de complementação de renda. Como toda atividade remunerada em folga, exige planejamento e respeito aos limites físicos. Use o calendário do MIKE TOOLS para visualizar serviço ordinário, Dejem e Delegada no mesmo painel.",
    ],
  },
  {
    slug: "escala-12x36-higidez-fisica",
    title: "Escala 12x36: como preservar sua higidez física",
    description:
      "Estratégias de sono, alimentação, exercício e saúde mental para quem trabalha em regime 12x36 por longos períodos.",
    publishedAt: "2026-06-27",
    readingMinutes: 8,
    category: "Bem-estar",
    body: [
      "A escala 12x36 — 12 horas de serviço seguidas de 36 horas de folga — é rotina de boa parte do efetivo operacional. Ela concentra descanso em blocos longos, mas cobra caro do corpo quando não há disciplina no sono, na alimentação e no acompanhamento médico.",
      { h: "O que a ciência diz sobre trabalho por turnos" },
      "Trabalho em turnos, especialmente com noites, altera o ritmo circadiano — o relógio biológico que regula sono, hormônios e digestão. Estudos apontam maior risco de doenças metabólicas, cardiovasculares e transtornos de humor em quem trabalha nesse regime por décadas sem cuidados específicos. A boa notícia é que os riscos podem ser mitigados com hábitos consistentes.",
      { h: "Sono: qualidade importa mais que quantidade" },
      "Dormir 8 horas em um quarto claro e barulhento equivale, do ponto de vista fisiológico, a dormir 5 horas em um ambiente ideal. Invista em blackout, ar-condicionado ou ventilador, protetor auricular e desligamento total de notificações. Se possível, faça uma soneca de 20 minutos antes de plantões noturnos para reduzir o débito de sono.",
      { h: "Alimentação em plantões longos" },
      "Comer bem em plantão é regra, não luxo. Leve refeições preparadas em casa quando possível — proteína, carboidrato complexo, fibra e uma fonte de gordura boa. Evite ultraprocessados, refrigerantes e excesso de cafeína após a metade do plantão, para não comprometer o sono após o serviço.",
      {
        list: [
          "Água em quantidade: 30 ml por kg de peso corporal por dia é uma referência.",
          "Frutas na guarnição para lanches rápidos.",
          "Café até 6 horas antes do horário previsto de dormir.",
          "Refeição leve nas últimas 2 horas do plantão noturno.",
        ],
      },
      { h: "Exercício físico" },
      "A atividade física é obrigação legal (TAF) e também ferramenta de saúde mental. Priorize dois ou três blocos de 45 minutos por semana. Trabalhos combinados de força e resistência dão melhor resultado que só corrida. Use o dia longo de folga (36h) para uma sessão mais intensa e o dia curto para atividade leve como caminhada.",
      { h: "Saúde mental" },
      "A rotina policial soma exposição a eventos críticos, privação de sono e distanciamento social. Se você notar irritabilidade persistente, dificuldade de dormir mesmo cansado, uso crescente de álcool ou pensamentos intrusivos, procure ajuda. O SAS/PMESP e os CBMDF/psicólogos militares oferecem atendimento sigiloso. Buscar ajuda é sinal de fortaleza, não de fraqueza.",
      { h: "Consultas médicas periódicas" },
      "Faça exames anuais, mesmo se sentir bem. Pressão arterial, glicemia, colesterol e função tireoidiana são marcadores importantes. Quem trabalha à noite deve conversar com o médico sobre vitamina D e melatonina, frequentemente alteradas em profissionais de turno.",
      { h: "Planejamento com a família" },
      "Combine com quem mora com você quais horários da folga são para descanso e quais são para vida familiar. Use o calendário do app para todos enxergarem seus plantões e evitarem cobranças em horários de sono. A previsibilidade reduz atrito e melhora o descanso real.",
      "Longevidade na carreira depende menos de esforço isolado e mais de hábitos repetidos por anos. Invista em você — a Corporação e sua família dependem de um policial saudável no longo prazo.",
    ],
  },
  {
    slug: "configurar-anyconnect-android",
    title: "Como configurar a VPN AnyConnect no Android",
    description:
      "Passo a passo para instalar, configurar o servidor, autenticar e resolver os erros mais comuns do Cisco AnyConnect em celulares Android.",
    publishedAt: "2026-07-01",
    readingMinutes: 8,
    category: "Tecnologia",
    body: [
      "O aplicativo Cisco Secure Client (nome atual do antigo AnyConnect) é o cliente VPN oficial para acesso remoto à intranet da PMESP em dispositivos Android. A instalação é simples, mas alguns detalhes evitam retrabalho.",
      { h: "1. Instalação" },
      "Baixe o Cisco Secure Client na Google Play Store. Instale a versão principal (não a variação ‘AnyConnect ICS+’, que é uma dependência interna). Ao abrir pela primeira vez, aceite os termos de uso da Cisco e conceda a permissão de VPN pedida pelo Android.",
      { h: "2. Adicionar o servidor" },
      "Toque em ‘Conexões’ → ‘Adicionar nova conexão VPN’. Dê um nome fácil (‘Intranet PMESP’) e cole o endereço do gateway informado pela sua unidade ou pelo canal de TI da Corporação. Nunca use endereços obtidos em grupos informais — golpistas costumam replicar telas de login para roubar credenciais.",
      { h: "3. Autenticação" },
      "Ao conectar pela primeira vez, o app abre uma tela com os campos de usuário e senha. O usuário costuma ser sua matrícula (ou RG PM) e a senha é a mesma da intranet. Se sua unidade usa segundo fator (código por SMS ou app autenticador), digite o código quando solicitado. Nunca marque ‘lembrar senha’ em celular sem bloqueio de tela forte.",
      { h: "4. Confirmando a conexão" },
      "Depois de autenticado, o ícone de chave na barra de notificação indica que o túnel VPN está ativo. Abra o navegador e teste um endereço interno (por exemplo, a página inicial da intranet). Se carregar, tudo certo. Se der erro, siga a próxima seção.",
      { h: "5. Erros comuns e soluções" },
      {
        list: [
          "‘Login failed’: senha incorreta ou expirada. Redefina pela intranet acessada em rede corporativa.",
          "‘Server certificate is untrusted’: instale o certificado indicado pela sua unidade. Não aceite certificados desconhecidos.",
          "Conecta mas nada abre: verifique se outro app de VPN está ativo. Deixe apenas um cliente VPN ligado por vez.",
          "Desconecta sozinho: modo de economia de bateria pode estar matando o app. Adicione o Cisco Secure Client à lista de apps sem restrição.",
          "‘Certificate expired’: seu certificado precisa ser renovado pela seção de TI da Corporação.",
        ],
      },
      { h: "6. Boas práticas de segurança" },
      "Desconecte a VPN quando não estiver usando. Não deixe seu celular desbloqueado em locais públicos. Ative bloqueio biométrico. Evite conectar em Wi-Fi público sem antes ativar um segundo túnel confiável. Se perder o aparelho, comunique imediatamente a TI para revogar o acesso.",
      { h: "7. Como o MIKE TOOLS ajuda" },
      "O app oferece um atalho para abrir o Cisco Secure Client, um indicador de status da VPN (conectado ou não) e um teste rápido de acesso a serviços da intranet. Ele não armazena sua senha nem intercepta o tráfego — apenas facilita o uso.",
      "Se você é o primeiro do seu Batalhão a usar o Secure Client em Android, tire foto das etapas e passe adiante. Documentação simples resolve 80% das dúvidas dos colegas.",
    ],
  },
  {
    slug: "erros-comuns-intranet-pmesp",
    title: "Erros mais comuns ao acessar a intranet da PMESP",
    description:
      "Diagnóstico rápido dos erros que mais impedem o acesso à intranet: senha, VPN, certificado, cache, DNS e horário do sistema.",
    publishedAt: "2026-07-03",
    readingMinutes: 6,
    category: "Tecnologia",
    body: [
      "A intranet da PMESP concentra sistemas críticos: publicação de escala, folha de frequência, boletins, cursos e mensagens oficiais. Quando ela não abre, o serviço trava. Este é um guia rápido para diagnosticar antes de acionar suporte.",
      { h: "1. ‘Página não pode ser exibida’" },
      "Quase sempre é problema de VPN. Verifique se o Cisco Secure Client está conectado. Se estiver, desconecte e reconecte para reestabelecer o túnel. Persistindo, teste em outra rede (dados móveis ou Wi-Fi de casa) para descartar problema local.",
      { h: "2. ‘Login inválido’ ou ‘usuário bloqueado’" },
      "Cada falha em sequência conta. Após três tentativas erradas, o usuário costuma ser bloqueado por 15 minutos. Espere, redefina a senha por um canal oficial se necessário, e evite copiar-colar de gerenciadores que preservam espaços em branco.",
      { h: "3. ‘Certificado inválido’ ou ‘conexão não segura’" },
      "O certificado do servidor pode ter expirado ou o seu dispositivo pode estar sem as raízes atualizadas. Atualize o sistema operacional e o navegador. Nunca aceite certificados manualmente sem confirmar com a TI da Corporação.",
      { h: "4. Sistema abre mas fica ‘carregando’ eternamente" },
      "Cache corrompido ou cookies velhos. Limpe cache e cookies apenas do domínio da intranet. Em navegadores baseados em Chromium (Chrome, Edge, Opera), o caminho é Configurações → Privacidade → Cookies e outros dados → Ver todos os cookies → buscar pelo domínio.",
      { h: "5. Horário do sistema fora" },
      "Autenticação com certificados falha quando o relógio do celular ou computador está muito diferente do real. Verifique se está no automático. Diferenças de mais de 5 minutos costumam quebrar a validação.",
      { h: "6. Problemas de DNS" },
      "Menos comum, mas ocorre: o roteador de casa ou o Wi-Fi do quartel não resolvem o nome interno. Se você tiver instruções da TI para trocar o DNS do celular, siga-as. Caso contrário, tente pelos dados móveis.",
      { h: "7. Quando acionar o suporte" },
      "Testou tudo acima e nada resolveu? Registre o horário exato, print da tela de erro e descrição da rede (Wi-Fi ou 4G). Envie ao canal de suporte da TI da sua unidade — dados objetivos aceleram a solução.",
      "O MIKE TOOLS oferece um teste de acesso rápido à intranet, indicando se o problema é geral ou específico do seu dispositivo. É um bom primeiro passo antes de reinstalar aplicativos ou entrar em contato com o suporte.",
    ],
  },
  {
    slug: "usar-app-offline",
    title: "Como usar o MIKE TOOLS sem sinal de internet",
    description:
      "O que continua funcionando no app quando você está em área sem sinal, como preparar antes do plantão e limites do modo offline.",
    publishedAt: "2026-07-05",
    readingMinutes: 5,
    category: "App",
    body: [
      "Boa parte da rotina policial acontece em bairros ou regiões com sinal instável. O MIKE TOOLS foi pensado para continuar útil mesmo quando o celular fica sem conexão — desde que você faça um pequeno preparo antes de sair de casa.",
      { h: "O que funciona offline" },
      {
        list: [
          "Consulta a escalas previamente baixadas em ‘Escalas baixadas’.",
          "Calendário de plantões, com todos os eventos já sincronizados.",
          "Lembretes locais programados — disparam mesmo sem internet.",
          "Manual do usuário e ferramentas puramente locais (calculadoras, checklists).",
          "Histórico e favoritos.",
        ],
      },
      { h: "O que precisa de internet" },
      {
        list: [
          "Buscar uma escala nova ou atualizada.",
          "Baixar um PDF que ainda não estava salvo localmente.",
          "Compartilhar via link com colegas.",
          "Receber notificações push da equipe do app.",
        ],
      },
      { h: "Preparando o app antes do plantão" },
      "Na noite anterior, abra o MIKE TOOLS conectado ao Wi-Fi de casa e:",
      {
        list: [
          "Consulte a escala do dia seguinte para forçar cache atualizado.",
          "Toque em ‘Baixar’ na escala vigente e nas próximas duas semanas.",
          "Verifique se os lembretes estão ativos em Configurações → Notificações.",
          "Confira se a bateria vai aguentar até o fim do plantão (leve carregador se necessário).",
        ],
      },
      { h: "Se o sinal cair no meio do plantão" },
      "Todo conteúdo já carregado continua acessível. Se precisar de informação nova, tente andar até um ponto de melhor sinal, ou peça a um colega em outra localidade para tirar print e enviar por rádio ou mensagem. O app não trava por falta de rede: apenas mostra os dados que já tinha.",
      { h: "Modo avião" },
      "Se você quiser economizar bateria em plantões longos, pode colocar o celular em modo avião e ainda assim usar as escalas baixadas e o calendário. Lembre-se de desativar antes de reassumir comunicação com a equipe.",
      "Trabalhar em campo é sempre um exercício de antecipação. Poucos minutos preparando o app na noite anterior evitam surpresas ruins no meio do serviço.",
    ],
  },
  {
    slug: "compartilhar-escala-com-seguranca",
    title: "Como compartilhar sua escala com segurança",
    description:
      "Boas práticas para enviar a escala ao chefe de equipe, família e colegas sem expor dados pessoais ou operacionais sensíveis.",
    publishedAt: "2026-07-06",
    readingMinutes: 5,
    category: "App",
    body: [
      "Compartilhar a escala é rotineiro — chefe de equipe precisa saber quem entra, família precisa se organizar, colega troca dia. Mas cuidado com o que exatamente você envia: uma foto de tela pode revelar mais informação do que parece.",
      { h: "Riscos de compartilhar prints diretos" },
      "Um print de tela pode incluir número da viatura, nome de operações sensíveis, endereço de residência de terceiros, telefones e até anotações pessoais. Antes de enviar qualquer imagem, revise o que está visível.",
      { h: "Como o MIKE TOOLS ajuda" },
      "O botão de compartilhar do app gera uma imagem otimizada da escala: só data, horário, função e local. Nome do policial fica visível apenas se ele estiver na escala — dados de terceiros que não sejam colegas ficam ocultos por padrão.",
      { h: "Escolhendo o canal certo" },
      {
        list: [
          "Chefe de equipe: canal oficial (rádio, e-mail funcional ou grupo oficial do quartel).",
          "Família: WhatsApp ou apps de calendário; nunca redes sociais públicas.",
          "Colega para troca de serviço: WhatsApp ou Telegram, sempre com confirmação por voz depois.",
          "Terceiros (fornecedor, escola dos filhos): nunca. Combine só data e horário sem detalhar local.",
        ],
      },
      { h: "O que NUNCA compartilhar publicamente" },
      {
        list: [
          "Escalas em grupos abertos ou redes sociais.",
          "Fotos de escala com nome completo de colegas.",
          "Local exato de operações reservadas.",
          "Fotos de crachá funcional, boletim ou documento interno.",
        ],
      },
      { h: "Se você recebeu uma escala por engano" },
      "Não repasse. Comunique ao remetente e apague a mensagem. Se contiver dados sensíveis, informe o superior direto — vazamento de escala pode gerar consequências disciplinares para o autor.",
      "Segurança começa nos hábitos pequenos. Compartilhar bem é tão importante quanto ter as informações certas.",
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
