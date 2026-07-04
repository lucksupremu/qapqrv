## Objetivo
No popover que abre ao tocar em um dia do calendário, adicionar um segundo botão **"Adicionar compromisso"** ao lado do já existente **"Adicionar plantão neste dia"**, reutilizando o `EventoLivreModal` que já existe no projeto.

## Mudanças

**Arquivo:** `src/components/escala-calendar-card.tsx`

1. No `PopoverContent` de cada dia (por volta da linha 621, onde hoje só existe o botão "Adicionar plantão neste dia"), transformar o bloco em dois botões empilhados:
   - **Adicionar plantão neste dia** (mantém comportamento atual: abre `EscalaDiaModal`, ícone `Plus`, cor primária azul).
   - **Adicionar compromisso** (novo: fecha o popover, define `eventoBaseDate` para o dia clicado, `eventoEditing = null` e abre `EventoLivreModal`). Estilo consistente (borda tracejada), mas usando cor roxa `#7C3AED` — mesma cor já usada para o marcador de eventos no calendário, mantendo coerência visual.
2. Nenhuma outra alteração de lógica: o `EventoLivreModal` já está montado no final do componente e já sabe criar/editar eventos a partir de `baseDate`.

## Fora de escopo
- Sem alterações no post-it, no contorno, na legenda ou nos modais.
- Sem mudanças de dados/persistência.
