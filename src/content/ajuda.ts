export type SecaoAjuda = {
  slug: string;
  titulo: string;
  itens: { titulo: string; conteudo: string }[];
};

export const AJUDA: SecaoAjuda[] = [
  {
    slug: "primeiros-passos",
    titulo: "Primeiros passos",
    itens: [
      { titulo: "O que é o QAP, QRV!", conteudo: "Um aplicativo independente com ferramentas úteis para o policial militar da PMESP — calendário, consulta de escala, atalhos, backup. Funciona no navegador (PWA) e como APK Android." },
      { titulo: "Preciso criar conta?", conteudo: "Não. Nenhuma ferramenta exige cadastro. Todos os dados ficam no seu aparelho." },
      { titulo: "Como abrir o app?", conteudo: "Acesse pelo navegador ou pelo ícone instalado. A tela inicial é o Dashboard, com atalhos para as principais ferramentas." },
    ],
  },
  {
    slug: "configurar-escalas",
    titulo: "Como configurar escalas",
    itens: [
      { titulo: "Adicionar plantão recorrente", conteudo: "No Calendário, use 'Configurar escala' para plantões periódicos (12x24, 12x48, 24x72). O sistema aplica automaticamente em todos os dias correspondentes." },
      { titulo: "Adicionar plantão avulso", conteudo: "Toque em qualquer dia e selecione 'Adicionar plantão'. Escolha horário, local e o tipo (dia ou noite é definido pelo horário)." },
      { titulo: "Editar ou excluir", conteudo: "Toque no dia com o plantão. Escolha entre editar aquele dia ou toda a série." },
    ],
  },
  {
    slug: "cadastrar-dejem",
    titulo: "Como cadastrar DEJEM",
    itens: [
      { titulo: "Fluxo típico", conteudo: "A inscrição em Dejem é feita na intranet PMESP. Use o atalho 'Marcar / Desmarcar Dejem/Delegada' na Home para chegar direto na página oficial. Depois, registre o serviço no calendário do QAP, QRV! para receber lembrete." },
      { titulo: "Vale para todos?", conteudo: "Somente policiais que atendem aos requisitos da diretriz vigente (higidez, situação funcional regular)." },
    ],
  },
  {
    slug: "cadastrar-delegada",
    titulo: "Como cadastrar Delegada",
    itens: [
      { titulo: "Inscrição", conteudo: "Também feita pela intranet PMESP. As vagas são geridas por convênio com o município. Confira sempre o edital de cada operação." },
      { titulo: "Diferença para Dejem", conteudo: "Delegada é paga pela prefeitura; Dejem é paga pelo Estado. Escalas, valores e locais mudam." },
    ],
  },
  {
    slug: "calendario",
    titulo: "Como usar o calendário",
    itens: [
      { titulo: "Leitura visual", conteudo: "Plantões diurnos têm fundo dourado, noturnos azul-marinho, compromissos avulsos aparecem como post-it amarelo. O dia de hoje tem um risco horizontal azul." },
      { titulo: "Contador de horas", conteudo: "O topo do calendário exibe o total de horas e plantões daquele mês." },
      { titulo: "Exportar", conteudo: "Você pode exportar seus plantões em formato .ics para importar em Google Agenda, Apple Calendário ou Outlook." },
    ],
  },
  {
    slug: "vpn",
    titulo: "Como utilizar VPN",
    itens: [
      { titulo: "Por que usar", conteudo: "Vários serviços da intranet exigem VPN AnyConnect. O QAP, QRV! detecta e orienta você a ativá-la antes de acessar a intranet." },
      { titulo: "Instalação", conteudo: "Consulte o 'Vídeo tutorial ANYCONECT' no menu para o passo a passo oficial." },
    ],
  },
  {
    slug: "folha-pagamento",
    titulo: "Folha de pagamento",
    itens: [
      { titulo: "Consulta", conteudo: "Use o atalho 'Folha de Pagamento' na Home. Ele abre o portal oficial CIAF-PMESP dentro do app." },
      { titulo: "Segurança", conteudo: "Digite sua senha apenas em conexões de confiança. O QAP, QRV! não armazena a senha." },
    ],
  },
  {
    slug: "backup",
    titulo: "Backup",
    itens: [
      { titulo: "Exportar dados", conteudo: "Em Configurações, use 'Exportar dados' para salvar um JSON com seus plantões, marcas e preferências." },
      { titulo: "Importar", conteudo: "Ao reinstalar, use 'Importar dados' para restaurar seu histórico." },
    ],
  },
  {
    slug: "sincronizacao",
    titulo: "Sincronização",
    itens: [
      { titulo: "Local", conteudo: "Todos os dados ficam no aparelho. Não há sincronização em nuvem ainda." },
      { titulo: "Multiaparelho", conteudo: "Para usar em dois aparelhos, exporte e importe manualmente via JSON." },
    ],
  },
  {
    slug: "recuperacao",
    titulo: "Recuperação de dados",
    itens: [
      { titulo: "Se perdeu", conteudo: "Se você não fez backup, não há como recuperar dados apagados: eles são locais e ficam no seu navegador ou APK." },
      { titulo: "Prevenção", conteudo: "Exporte o JSON pelo menos uma vez por mês." },
    ],
  },
  {
    slug: "instalacao",
    titulo: "Instalação do aplicativo",
    itens: [
      { titulo: "Android (Chrome)", conteudo: "Menu ⋮ → 'Instalar app'. O app aparece como ícone na tela inicial e funciona offline." },
      { titulo: "iPhone (Safari)", conteudo: "Compartilhar → 'Adicionar à Tela de Início'." },
      { titulo: "APK", conteudo: "Baixe o APK oficial pela seção de download e instale manualmente. Ative 'Fontes desconhecidas' se necessário." },
    ],
  },
  {
    slug: "videos",
    titulo: "Vídeos",
    itens: [
      { titulo: "Tutoriais", conteudo: "Os principais tutoriais em vídeo estão na página ANYCONECT do menu. Novos vídeos são adicionados periodicamente." },
    ],
  },
];
