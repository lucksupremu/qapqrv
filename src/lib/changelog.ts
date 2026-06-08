// Changelog do app — exibido na "Novidades" após cada update.
// Bump APP_VERSION sempre que tiver algo novo pra mostrar.

export const APP_VERSION = "2026.06.08";

export type ChangelogEntry = {
  version: string;
  date: string; // "08/06/2026"
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
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
