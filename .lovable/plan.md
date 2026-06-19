# Preencher célula com a cor do plantão + ícone de turno

Trocar a barrinha proporcional pelo preenchimento **da célula inteira** (área abaixo do número do dia) com a cor translúcida do plantão. O turno fica indicado apenas pelo emoji 🌞 (diurno) ou 🌙 (noturno) no canto inferior direito.

Mudança contida em `src/components/escala-calendar-card.tsx`. Sem alterações em lógica de escalas.

## Como vai ficar

```text
┌──────────┐         ┌──────────┐
│ 12       │         │ 12       │
│ ░░░░░░░░ │ diurno  │ ▒▒▒▒▒▒▒▒ │ noturno
│ ░░░░░░░░ │         │ ▒▒▒▒▒▒▒▒ │
│ ░░░░░ 🌞 │         │ ▒▒▒▒▒ 🌙 │
└──────────┘         └──────────┘
```

Quando há mais de um plantão no mesmo dia, cada coluna vira uma faixa vertical cheia lado a lado (comportamento atual de `slotW`), cada uma com seu próprio emoji se houver largura.

## Comportamento

- Faixa do plantão ocupa toda a área da célula abaixo do número do dia (`top: 18`, `bottom: 2`), sem altura/posição variável.
- `borderTop` 3px com a cor do plantão como referência visual.
- Background = `color-mix(in srgb, <cor> 28%, transparent)` — mesmo para diurno e noturno (sem fundo escurecido).
- Emoji 🌞 / 🌙 no canto inferior direito, mesmo tamanho/posicionamento já testado.
- Marcas (Dejem/Delegada) e eventos livres permanecem inalterados.

## Detalhes técnicos

1. **Render do slot plantão** (≈ linhas 384–434): remover o cálculo de `barTop`/`barHeight` baseado em `horaInicio`/`duracaoNoDia` e voltar a usar `top: 20` e `bottom: 2` fixos, com `borderRadius: "6px"`. `horaInicio`/`duracaoNoDia` podem ser removidos do tipo `Slot` e de `colunasDoDia` para limpeza (mantemos `periodo` para escolher o emoji).
2. **Legenda** (≈ linhas 636–660): substituir as miniaturas com barras posicionadas pela miniatura de retângulo cheio + emoji; texto explicativo passa a ser "🌞 indica plantão diurno e 🌙 indica plantão noturno. Toque em um dia para detalhes."
3. Não tocar em `escala-trabalho.ts`, modais ou listas.

## Fora de escopo

- Cores, tokens, tipografia e tema global.
- Lógica de geração de plantões.
