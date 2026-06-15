// Changelog do app — exibido na "Novidades" após cada update.
// Bump APP_VERSION sempre que tiver algo novo pra mostrar.

export const APP_VERSION = "2026.06.15.2";

export type ChangelogEntry = {
  version: string;
  date: string; // "15/06/2026"
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2026.06.15.2",
    date: "15/06/2026",
    highlights: [
      "✨ Botões × e ⋮ do navegador interno menores e com auto-fade — não cobrem mais campos de login.",
      "📱 Páginas da intranet PMESP agora abrem otimizadas pra celular: campos grandes, sem zoom horizontal.",
      "🔐 Login da intranet finalmente legível e clicável no celular.",
    ],
  },
  {
    version: "2026.06.15",
    date: "15/06/2026",
    highlights: [
      "🌐 Novo navegador interno estilo Instagram: tela cheia, sem barra de endereço.",
      "👆 Gestos: arraste pra baixo pra fechar, deslize da borda pra voltar, puxe pra atualizar.",
      "📄 PDFs agora abrem no seu leitor preferido (Drive, Adobe) — zoom e navegação muito melhores.",
      "🔐 Intranet PMESP unificada no novo navegador, com \"Salvar escala\" no menu ⋮.",
    ],
  },

  {
    version: "2026.06.08",
    date: "08/06/2026",
    highlights: [
      "📅 Agenda infinita: role pelos meses sem trocar de tela.",
      "📝 Observação por marca (ex.: \"OP Rotam\", \"trocada com Cb Silva\").",
      "🔄 Revalidação automática das escalas baixadas quando a VPN está ativa.",
      "🌙 Tema escuro real, busca global e cofre de login da intranet.",
    ],
  },
];
