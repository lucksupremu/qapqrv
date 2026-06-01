## Objetivo

Deixar visualmente óbvio, no calendário de "Minha escala", quais dias são plantão **inteiro no dia** e quais são plantão **noturno que atravessa a meia-noite** — hoje a escala 12x24/12x48 parece "três dias seguidos" porque cada dia tocado pelo plantão recebe um círculo igual. Trocar a marcação por **barras dentro da célula** e, ao tocar no dia, abrir um pequeno detalhe com os horários.

---

## 1. Nova marcação visual (barra na célula)

Em `src/components/escala-calendar-card.tsx`, substituir os anéis (`cellRing` / `cellContinuacao`) por uma **barra fina horizontal** dentro da célula do dia, posicionada na parte inferior (abaixo do número), com a cor da regra.

Regras de preenchimento da barra, calculadas por plantão que toca o dia:

| Situação no dia | Barra |
|---|---|
| Plantão começa **e** termina no mesmo dia (ex.: 07:00 → 19:00) | **Barra cheia** (100% da largura) |
| Plantão começa neste dia e termina no dia seguinte (ex.: 19:00 → 07:00) | **Metade direita** preenchida |
| Plantão veio do dia anterior e termina neste dia (continuação) | **Metade esquerda** preenchida |
| Plantão atravessa o dia inteiro (continuação que não termina aqui, raro em 12h) | **Barra cheia** |
| Múltiplos plantões/cores no mesmo dia | Empilhar barras finas (uma por cor), até 2 visíveis; "+N" se houver mais |

Detalhes:
- Barra com ~4px de altura, cantos arredondados, posicionada com `position: absolute; left/right: 4px; bottom: 3px`.
- Meias-barras usam `width: 50%` com `left: 4px` (esquerda) ou `right: 4px` (direita).
- Remover `cellRing` e `cellContinuacao` atuais. O número do dia volta a ser limpo, sem círculo em volta.
- O destaque de "hoje" passa a ser um fundo leve `COR_BG_SOFT` arredondado (já existe) — manter, mas reduzir para não competir com a barra.
- O post-it amarelo de Dejem/Delegada continua igual; quando houver post-it, a barra fica **dentro** do post-it (sobre o amarelo) para não brigar visualmente.

Estado calculado por célula a partir dos `PlantaoEntry` já fornecidos por `gerarPlantoesDoMes`:
- `tipo === "inicio"` + `fim` no mesmo dia → barra cheia
- `tipo === "inicio"` + `fim` em dia diferente → metade direita
- `tipo === "continuacao"` + `fim` no mesmo dia → metade esquerda
- `tipo === "continuacao"` + `fim` em dia posterior → barra cheia

## 2. Toque no dia abre detalhe

Hoje a célula não é clicável. Tornar cada célula um `<button>` e, ao tocar, abrir um **Popover** (shadcn `popover` já disponível) ancorado na célula com:

- Data por extenso (ex.: "Sex, 14 de março").
- Para cada plantão do dia, uma linha com:
  - Bolinha colorida da regra.
  - Nome do local.
  - Horário: `19:00 → 07:00 (termina no dia seguinte)` ou `07:00 → 19:00`, deduzido de `inicio`/`fim` do `PlantaoEntry`.
  - Tag "Início do plantão" ou "Continuação (vem de dd/mm)".
- Para cada marca (Dejem/Delegada) do dia, uma linha com a label correspondente e a cor.
- Se o dia não tem nada, popover não abre (ou mostra "Sem plantão").

Apenas um popover aberto por vez; fechar tocando fora ou em outra célula.

## 3. Legenda

Atualizar a mini-legenda visual no rodapé do card (ou inline acima do grid) com 3 ícones:

```
[████]  Plantão no dia
[██  ]  Início (vai até o dia seguinte)
[  ██]  Continuação (vem do dia anterior)
```

Texto curto: "Toque em um dia para ver detalhes."

## Detalhes técnicos

- Arquivo único alterado: `src/components/escala-calendar-card.tsx`.
- Nenhuma mudança em `escala-trabalho.ts`, storage ou modal.
- Helper local `barraDoDia(entries: PlantaoEntry[], date: Date)` que retorna `{ cor: string; lado: "cheia"|"esq"|"dir" }[]`, comparando `entry.fim` com o dia atual via `sameDay`.
- Usar `Popover` + `PopoverTrigger`/`PopoverContent` de `@/components/ui/popover`.
- Acessibilidade: o `<button>` mantém o `aria-label` atual e ganha `aria-haspopup="dialog"`.

## Fora do escopo

- Editar plantão direto pelo popover (só leitura).
- Mudar como Dejem/Delegada são marcadas.
- Mudar o algoritmo de geração de plantões.
