export type FerramentaInfo = {
  slug: string;
  oQueE: string;
  quandoUsar: string;
  beneficios: string[];
  boasPraticas: string[];
  errosComuns: string[];
};

export const FERRAMENTAS_INFO: Record<string, FerramentaInfo> = {
  "consulta-escala": {
    slug: "consulta-escala",
    oQueE: "Ferramenta para consultar rapidamente escalas Dejem ou Delegada pelo número (ID) da escala publicado pela sua unidade.",
    quandoUsar: "Sempre que precisar conferir data, local, função e horário de um serviço já publicado, sem navegar por vários menus da intranet.",
    beneficios: [
      "Acesso direto ao PDF da escala em segundos.",
      "Salva a escala offline para consulta sem internet.",
      "Compartilha com colegas por link ou arquivo.",
    ],
    boasPraticas: [
      "Confirme o ID com a Seção de Pessoal antes de consultar.",
      "Baixe o PDF assim que a escala for publicada.",
      "Confira sempre horário e local de apresentação.",
    ],
    errosComuns: [
      "Digitar ID errado (confira os dígitos).",
      "Consultar sem VPN ativa em rede pública.",
      "Confiar apenas na versão em cache sem revalidar.",
    ],
  },
  "minha-localizacao": {
    slug: "minha-localizacao",
    oQueE: "Compartilha sua localização atual com um contato via link, útil em apoio ou deslocamento operacional.",
    quandoUsar: "Ao precisar comunicar sua posição rapidamente a um superior, colega ou familiar sem digitar endereço.",
    beneficios: [
      "Link curto que abre em qualquer mapa.",
      "Precisão de GPS, não depende de endereço.",
      "Funciona no PWA e no APK.",
    ],
    boasPraticas: [
      "Autorize a permissão de localização apenas quando for usar.",
      "Prefira compartilhar por canal seguro.",
      "Desative a permissão depois se não for uso rotineiro.",
    ],
    errosComuns: [
      "Compartilhar em grupos públicos.",
      "Esquecer de revogar a permissão em aparelhos emprestados.",
      "Usar sem sinal de GPS — o link fica impreciso.",
    ],
  },
};

export function getFerramentaInfo(slug: string): FerramentaInfo | undefined {
  return FERRAMENTAS_INFO[slug];
}
