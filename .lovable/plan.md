## Objetivo

Trocar a barra fina embaixo do número por uma **faixa colorida translúcida que cobre o dia inteiro** (estilo Google Agenda) — o número continua visível por cima. Plantão diurno = faixa cheia. Plantão noturno = metade direita no dia de início + metade esquerda no dia seguinte.

---

## Mudanças em `src/components/escala-calendar-card.tsx`

1. **Substituir a barra fina** (atualmente `height: 3` posicionada `bottom: 3`) por uma **faixa translúcida que cobre toda a célula** atrás do número:
   - Altura: ocupa a célula inteira (`inset: 2px` para respirar nas bordas).
   - Cor: a cor da regra com **~28% de opacidade** (`color-mix(in srgb, <cor> 28%, transparent)`), para não competir com o número.
   - Borda esquerda colorida sólida (3px) para reforçar a cor da escala, estilo Google Agenda.
   - Cantos arredondados (`borderRadius: 6px`).
   - `z-index` abaixo do número (que já é `relative`).

2. **Geometria da faixa por tipo**:
   - `cheia` (plantão começa e termina no mesmo dia): cobre 100% da largura.
   - `dir` (plantão noturno, começa neste dia, termina no próximo): cobre da metade até a direita (`left: 50%; right: 2px`), borda colorida do lado esquerdo da faixa.
   - `esq` (continuação no dia seguinte do plantão noturno): cobre do início até a metade (`left: 2px; right: 50%`), borda colorida do lado esquerdo.
   - Para meias-faixas, arredondar só o lado externo (lado direito de `dir` e lado esquerdo de `esq`) e deixar o lado interno reto, para sugerir "continua".

3. **Múltiplos plantões no mesmo dia**:
   - Empilhar até 2 faixas verticalmente (cada uma ocupa metade da altura da célula), usando `top: 2/8/...` calculado.
   - Se houver mais que 2, mostrar o "+N" pequeno no canto inferior direito (já existe lógica de `extras`).

4. **Ajustes visuais relacionados**:
   - Remover o fundo `rgba(0,0,0,0.06)` que servia de "trilho" da meia-barra antiga.
   - O destaque de "hoje" continua sendo o círculo `COR_BG_SOFT` quando não há plantão.
   - Quando houver post-it amarelo (Dejem/Delegada), a faixa colorida fica **por trás** do post-it (post-it sobrepõe). O número volta a usar a cor escura (já é).
   - Aumentar o `font-weight` do número para `800` quando houver faixa (já é) e garantir contraste — número em `#1a1a1a` em vez de azul quando há faixa por baixo.

5. **Legenda** (rodapé do calendário): atualizar os 3 exemplos para mostrar a faixa translúcida em vez da barrinha fina:
   - `[▮▮▮▮]` faixa cheia → "Plantão no dia"
   - `[  ▮▮]` meia direita → "Início noturno"
   - `[▮▮  ]` meia esquerda → "Continuação"

## Detalhes técnicos

- Único arquivo alterado: `src/components/escala-calendar-card.tsx`.
- Reescrever o bloco JSX das barras dentro do `cellInner` (sem mexer em `barrasDoDia`, que já retorna `{cor, lado}`).
- Continuar usando `color-mix` em CSS inline (suportado em todos os browsers modernos onde o app já roda).
- Sem mudanças no popover, no algoritmo de plantões ou no storage.

## Fora do escopo

- Mostrar texto (nome do local) dentro da faixa — a célula é muito pequena (40×40) e isso brigaria com o número.
- Mudar a altura da célula do calendário.
