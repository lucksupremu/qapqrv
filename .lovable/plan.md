## Objetivo

Permitir que, ao tocar em qualquer dia do card **Minha Escala** (home), o usuário possa **criar um evento livre** apenas para aquele dia, com título, hora e observação opcional, e receber lembrete antes do evento.

Esses eventos aparecem **somente** no card Minha Escala (não no Calendário cheio).

---

## Comportamento de UI

1. Hoje, tocar num dia da grade só abre o Popover se houver plantão ou marca. **Mudança:** todo dia do mês corrente fica clicável.
2. O Popover do dia passa a mostrar, no rodapé, um botão **"+ Adicionar evento"**.
3. Ao clicar, abre um modal `EventoLivreModal` com:
   - Título (texto, obrigatório, ex.: "Curso", "Médico", "Audiência")
   - Hora (input time, padrão 08:00)
   - Observação (textarea, opcional)
   - Lembrete: select com opções **No horário / 30 min antes / 1 h antes / 2 h antes / 1 dia antes / Sem lembrete** (padrão: 1 h antes)
   - Botões **Salvar** / **Cancelar** (e **Excluir** quando estiver editando)
4. Eventos já existentes aparecem **listados dentro do mesmo Popover do dia**, acima do botão "+ Adicionar evento", com ícone próprio (📌 / lucide `BookmarkPlus`) e cor distinta (roxo/violeta) para diferenciar de plantões e marcas Dejem/Delegada. Tocar num evento abre o modal em modo edição.
5. Indicador visual no dia: além das faixas atuais de plantão/marca, dias com evento livre ganham um **pequeno selo no canto inferior esquerdo** (bolinha violeta) — sem ocupar coluna na grade, para não atrapalhar o layout estilo Google Agenda.

---

## Persistência (`src/lib/eventos-personalizados.ts` — novo)

```ts
export type EventoPersonalizado = {
  id: string;
  titulo: string;
  data: string;          // ISO (data + hora)
  observacao?: string;
  lembreteMin: number | null; // minutos antes; null = sem lembrete
  criado: string;        // ISO
};
```

- Chave em `localStorage`: `eventos_personalizados_v1`.
- Funções: `loadEventos()`, `saveEventos(list)`, `upsertEvento(e)`, `removeEvento(id)`.
- Dispara `window.dispatchEvent(new CustomEvent("eventos-changed"))` no save, no mesmo padrão de `marcas.ts`.

---

## Lembretes

Reutiliza `scheduleRemindersForMarca` de `src/lib/notifications-adapter.ts` (já suporta qualquer id de origem):

- `marcaId = \`evento:\${evento.id}\``
- `whenISOs = [dataDoEvento - lembreteMin]` (vazio se `lembreteMin === null`)
- `buildContent` → título `"Lembrete: <titulo>"`, corpo `"Hoje às HH:mm — <obs?>"`.

Ao excluir o evento, chamar `cancelForMarca(\`evento:\${id}\`)`.

---

## Arquivos a criar / editar

**Novo**
- `src/lib/eventos-personalizados.ts` — storage + tipos.
- `src/components/evento-livre-modal.tsx` — modal de criação/edição usando `Dialog` do shadcn.

**Editar**
- `src/components/escala-calendar-card.tsx`
  - Carregar eventos + listener `eventos-changed` (espelhando o padrão atual de `marcas`).
  - Mapa `eventosPorDia` (igual `marcasPorDia`).
  - Tornar todas as células do mês clicáveis (`interativo = cell.inMonth`).
  - Renderizar selo violeta quando o dia tiver evento.
  - No `PopoverContent`, listar `eventosDia` (título + hora + observação) com clique para editar.
  - Adicionar botão **+ Adicionar evento** que fecha o popover e abre o modal já com a data selecionada.
  - Estado novo: `eventoModalOpen`, `eventoEditing`, `eventoBaseDate`.

Nenhuma mudança no `src/routes/calendario.tsx` — eventos ficam restritos à home conforme pedido.

---

## Detalhes técnicos

- O modal reusa tokens do design system (`bg-card`, `text-foreground`, `--primary`) e segue o estilo dos modais existentes (`marcar-modal.tsx`, `escala-config-modal.tsx`).
- Validação: título obrigatório (`trim().length > 0`), data válida.
- IDs gerados com `crypto.randomUUID()`.
- SSR-safe: storage funcs checam `typeof window`.
- Tipos exportados via barrel — sem alteração em outros componentes.

---

## Fora de escopo

- Exportar eventos para o iCal/compartilhar.
- Recorrência (semanal/mensal). Cada evento vale apenas para o dia escolhido.
- Sincronização entre dispositivos (segue local apenas, como as marcas).
