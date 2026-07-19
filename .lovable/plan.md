Adicionar, abaixo do card "Minha Escala" na tela inicial, uma legenda/lista dos próximos 5 eventos futuros (a partir de hoje), unindo plantões/escalas e compromissos do calendário, com contagem de dias que faltam para cada um.

## O que será feito

1. **Criar helper de próximos eventos** (`src/lib/escala-proximos.ts`):
   - Ler plantões gerados (`gerarPlantoesDoMes` de `escala-trabalho.ts`) e eventos personalizados (`loadEventos` de `eventos-personalizados.ts`).
   - Filtrar itens a partir de hoje (data/hora maior ou igual ao início do dia atual).
   - Ordenar por data/hora crescente.
   - Limitar a 5 itens.
   - Calcular "dias que faltam": 0 = hoje, 1 = amanhã, 2+ = "faltam N dias".
   - Retornar array tipado com: título, data, hora, tipo ("plantão" | "compromisso"), cor, diasRestantes.

2. **Criar componente visual** (`src/components/proximos-eventos-list.tsx`):
   - Lista vertical com até 5 cards.
   - Cada card mostra: ícone/bola de cor, título truncado, data/hora, e distância em dias ("Hoje", "Amanhã", "Faltam 3 dias").
   - Estilização alinhada ao card da escala: bordas arredondadas, cores do tema, fontes pequenas.
   - Botão "Ver na Agenda →" no final que leva para `/calendario`.

3. **Integrar na tela inicial** (`src/routes/index.tsx`):
   - Renderizar `<ProximosEventosList />` logo abaixo do `<EscalaCalendarCard />` dentro da seção "Minha Escala".
   - Se não houver eventos futuros, mostrar estado vazio discreto: "Nenhum plantão ou compromisso nos próximos dias. Toque em Abrir Agenda para adicionar."

4. **Atualizar tipos legados** se necessário (`src/lib/escala-trabalho.ts`):
   - Garantir que `gerarPlantoesDoMes` já exportado possa ser usado em um helper agnóstico ao mês, ou criar função que itere pelos meses necessários até coletar 5 eventos futuros (provavelmente iterar mês atual + próximo).

## O que não será alterado

- Não muda a lógica de salvamento de escalas/eventos.
- Não altera os modais de adicionar plantão/compromisso.
- Não muda a aparência do calendário em si; apenas adiciona a lista abaixo.

## Critério de aceitação

- Na tela inicial, abaixo do calendário, aparecem os próximos 5 plantões e compromissos futuros.
- Cada item exibe quantos dias faltam (Hoje, Amanhã, Faltam N dias).
- Build passa sem erros de tipo.