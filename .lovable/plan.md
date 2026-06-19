# Barra proporcional ao horário do plantão

Voltar o visual da célula ao estilo original (fundo claro translúcido, sem faixa lateral, sem fundo azulado) e fazer a barrinha **representar visualmente o horário do plantão dentro do dia**: posição vertical = hora de entrada, altura = horas trabalhadas naquele dia. O emoji 🌞/🌙 continua no canto como reforço.

Toda a mudança acontece em `src/components/escala-calendar-card.tsx`. Nenhuma alteração na lógica de geração de escalas (`src/lib/escala-trabalho.ts`).

## Como vai ficar

```text
célula 40×40
┌──────────┐
│ 12       │  ← número do dia (topo)
│ ░░       │  diurno 07h→19h: barra ocupa metade de cima
│ ░░       │
│ ░░    🌞 │
│          │
└──────────┘

┌──────────┐
│ 12       │
│          │  noturno 19h→07h: barra começa embaixo
│          │  e desce até o final da célula
│ ▓▓       │
│ ▓▓    🌙 │
└──────────┘

┌──────────┐
│ 12       │
│ ░░       │  plantão 24h (07h→07h): barra ocupa
│ ░░       │  toda a área útil
│ ░░    🌞 │
│ ░░       │
└──────────┘
```

## Comportamento

- **Posição vertical** = hora de entrada do plantão (mapeada de 0h às 24h sobre a área útil da célula, logo abaixo do número do dia).
- **Altura** = horas trabalhadas que cabem no mesmo dia (de `horaInicio` até no máximo 24h). Mínimo de ~6 px para continuar legível em turnos curtos.
- A célula só marca o **dia em que o plantão começa** (regra atual, mantida). Se o turno cruza a meia-noite, a barra simplesmente vai até o fim da área útil — o próximo dia segue limpo.
- Quando há mais de um plantão no mesmo dia, cada coluna ganha sua própria barra proporcional, na largura já calculada hoje (`slotW`).
- Emoji 🌞 (diurno, início entre 6h e 18h) ou 🌙 (noturno, início ≥18h ou <6h) permanece no canto inferior direito da célula.
- Marcas (Dejem/Delegada) e eventos livres seguem inalterados.

## Detalhes técnicos

1. **Tipo `Slot`** ganha dois campos opcionais para plantões: `horaInicio: number` (0..23.99, considerando minutos) e `duracaoNoDia: number` (horas que cabem entre `horaInicio` e 24h, com mínimo prático para o desenho).
2. **`colunasDoDia`** passa esses campos ao montar o slot a partir de `PlantaoEntry`:
   - `horaInicio = e.inicio.getHours() + e.inicio.getMinutes()/60`
   - `duracaoNoDia = Math.min(e.regra.trabalho, 24 - horaInicio)`
3. **Render do slot plantão** (≈ linhas 379–438) substitui o cálculo fixo de `top`/`bottom` por:
   - `AREA_TOP = 18`, `AREA_BOTTOM = 2`, `AREA_H = 40 - AREA_TOP - AREA_BOTTOM` (área útil abaixo do número do dia).
   - `top = AREA_TOP + (horaInicio / 24) * AREA_H`
   - `height = Math.max(6, (duracaoNoDia / 24) * AREA_H)`
   - `bottom` deixa de ser usado; passamos a controlar `height` direto.
   - `borderTop` continua usando `s.cor` (linha de referência no topo da barra, marcando o instante exato da entrada).
4. **Reverter** o fundo escurecido e a faixa lateral introduzidos na última mudança. O `background` volta a ser `color-mix(in srgb, ${s.cor} 28%, transparent)` para qualquer turno, e o `<span>` da faixa lateral é removido. `overflow: hidden` deixa de ser necessário.
5. **Emoji 🌞/🌙** continua exatamente como hoje (canto inferior direito, `drop-shadow`, oculto quando `totalCol >= 3`).
6. **Legenda** (≈ linhas 638–663):
   - "Plantão diurno": miniatura com barrinha encostada no topo + 🌞.
   - "Plantão noturno": miniatura com barrinha encostada na base + 🌙.
   - Texto explicativo abaixo: "A altura da barra mostra quantas horas o plantão dura; a posição mostra a hora de entrada (topo = manhã, base = noite)."
7. **Não mexer** em `escala-trabalho.ts`, na geração de entries, nem em modais/listas — somente apresentação visual.

## Fora de escopo

- Não alterar paleta de cores das escalas.
- Não alterar tipografia, tokens globais ou tema.
- Não introduzir dependências novas.
