## Problema

Escalas como 12x24 / 12x48 noturna (turno começa 19h, termina 7h do dia seguinte) hoje pintam **duas meias-células** no calendário: metade de baixo no dia que começa, metade de cima no dia seguinte. Isso visualmente parece "dois plantões" e confunde.

## Solução

Mostrar o plantão **apenas no dia em que começa**, com a célula cheia (sem dividir em metades), e adicionar um **ícone Sol/Lua** dentro da célula para deixar óbvio se é diurno ou noturno.

### Critério Sol/Lua
- **Lua** (noturno): `horaInicio >= 18` **ou** `horaInicio < 6`.
- **Sol** (diurno): caso contrário.

(Aplicado por plantão, então uma escala 12x24/12x48 alternada mostra Sol num dia, Lua no próximo plantão e assim por diante.)

### Mudanças no código

**`src/lib/escala-trabalho.ts` — `gerarPlantoesDoMes`**
- Parar de gerar entries `tipo: "continuacao"` para os dias seguintes. Só registrar a entry `"inicio"` no dia em que o plantão começa.
- Manter `inicio`/`fim` reais na entry (assim o tooltip/legendas continuam mostrando "19:00 → 07:00").

**`src/components/escala-calendar-card.tsx` — `colunasDoDia`**
- Como não existem mais entries de continuação, todo plantão vira `lado: "cheia"`. Remover o cálculo top/bottom.
- Acrescentar campo `periodo: "dia" | "noite"` no `Slot` (kind: "plantao") derivado do `horaInicio` do plantão.

**Renderização da célula (mesmo arquivo, no `cellInner`)**
- Quando a coluna tem 1 slot do tipo plantão com largura cheia, sobrepor um **ícone branco de `Sun` ou `Moon`** (lucide-react) ~12px no canto inferior-direito da célula, com leve sombra para legibilidade sobre qualquer cor.
- Quando há múltiplas colunas (dia tem >1 plantão), reduzir o ícone (~10px) e centralizar em cada coluna; se o espaço ficar pequeno demais, ocultar o ícone e manter só a cor.
- O número do dia continua centralizado em branco como hoje.

### Compatibilidade
- Marcas/eventos personalizados continuam funcionando igual (a lógica de encaixe na metade livre da coluna deixa de ser necessária — marcas viram colunas próprias, como já acontece quando não há plantão pareável).
- Modal de detalhes e tooltip continuam mostrando `inicio → fim` real, incluindo a virada de meia-noite ("19:00 → 07:00 do dia seguinte").

### Fora do escopo
- Não muda os presets nem a lógica de geração de horários (apenas como são *exibidos* no calendário).
- Não altera notificações, PDFs, ou widget.

## Detalhes técnicos

```ts
// escala-trabalho.ts — bloco removido
if (endDay > startDay) {
  // gera entries "continuacao" para cada dia seguinte
}
// → deletar este bloco inteiro

// Slot ganha campo:
type Slot = {
  kind: "plantao" | "marca";
  cor: string;
  lado: "cheia";              // sempre "cheia" para plantao agora
  periodo?: "dia" | "noite";  // novo (só plantao)
  marcaTipo?: string;
};
```

Posso aplicar?
