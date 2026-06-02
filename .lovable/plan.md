## Problema

Ao excluir uma marca (Dejem / Delegada) na tela de Calendário, ela some de lá, mas o calendário da tela inicial (`EscalaCalendarCard`) continua mostrando a marca até dar refresh/focus.

Causa: `EscalaCalendarCard` só recarrega via `window.storage` (que **não dispara na mesma aba**), `focus` e `visibilitychange`. Como a edição/exclusão acontece na mesma aba, o card da home não é notificado.

## Correção

1. **`src/lib/marcas.ts`** — dentro de `saveMarcas`, após gravar no `localStorage`, disparar um evento customizado na mesma aba:
   ```ts
   window.dispatchEvent(new CustomEvent("marcas-changed"));
   ```
   Isso vira o canal único de sincronização para qualquer tela que leia marcas.

2. **`src/components/escala-calendar-card.tsx`** — no `useEffect` que já registra `focus`/`storage`/`visibilitychange`, adicionar listener para `"marcas-changed"` chamando o mesmo `refresh()` (e remover no cleanup). Assim, ao excluir/editar/criar marca em qualquer lugar do app, o calendário da home atualiza imediatamente.

3. **`src/routes/calendario.tsx`** — nenhuma mudança de lógica necessária; o `useEffect(() => saveMarcas(marcas), [marcas])` já vai disparar o novo evento automaticamente, cobrindo exclusão, edição e criação.

## Observação

Cancelamento de lembretes (`cancelForMarca`) na exclusão já está feito em `calendario.tsx`. Esta correção é apenas de propagação de estado UI — escopo puramente de frontend, sem alterar regras de negócio.