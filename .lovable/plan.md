## Objetivo

1. Permitir escolher hora **e minuto** de início (hoje só dá pra escolher hora cheia).
2. Mostrar com clareza no calendário os plantões **noturnos** que viram a noite — o dia seguinte precisa indicar visualmente que o policial ainda está de serviço até a manhã, e só depois entra na folga.

---

## 1. Hora + minuto no modal

**`src/lib/escala-trabalho.ts`**
- Adicionar `minutoInicio: number` (0–59) em `EscalaRegra` e em `EscalaTurno`. Opcional, default `0` para regras antigas já salvas no `localStorage` (retrocompatível).
- `gerarPlantoesDoMes` passa a usar `setHours(horaInicio, minutoInicio, 0, 0)`.

**`src/components/escala-config-modal.tsx`**
- Trocar o `Select` de hora por um `<Input type="time">` (teclado nativo no celular, com hora e minuto). Mantém o mesmo grid `Trabalho × Folga × Início`.
- Mesma troca no bloco do turno alternado.
- Estado: `horaInicio` (number) + `minutoInicio` (number); parse/format do valor `"HH:MM"`.

**`src/components/escala-calendar-card.tsx`**
- Legenda passa a mostrar `19:30` em vez de `19h` quando houver minuto.

---

## 2. Visualização de plantão noturno (que vira a noite)

Hoje cada plantão só pinta o **dia em que começa**. Um plantão 19:00 × 12h aparece só no dia X, mesmo o policial ficando de serviço até 07:00 do dia X+1 — o usuário não enxerga que a manhã do dia seguinte ainda é trabalho.

### Mudança no algoritmo (`gerarPlantoesDoMes`)

Para cada plantão gerado, calcular `fimPlantao = inicio + trabalho horas`. Se `fimPlantao` cair em outro dia, registrar **duas entradas** no `Map`:

- Dia do início → `tipo: "inicio"` (com horário de entrada e saída)
- Dia(s) seguinte(s) até o fim → `tipo: "continuacao"` (com horário em que o serviço termina naquele dia)

Estrutura nova de `DiaPlantao.plantoes[i]`:
```
{ regra, tipo: "inicio" | "continuacao", inicio: Date, fim: Date }
```

### Mudança visual no calendário

Cada célula do dia pode ter dois estados sobrepostos:

- **Início de plantão** → anel completo colorido (como hoje).
- **Continuação (manhã ainda de serviço)** → meia-lua na parte **superior** da célula, mesma cor, indicando "ainda no serviço da noite anterior".

Quando o dia tem só continuação (ex.: plantão começou ontem e termina hoje de manhã), a célula mostra a meia-lua superior + número do dia com peso forte; o resto do dia fica visualmente "livre" (folga).

Quando o dia tem continuação **e** início de um novo plantão (escalas seguidas), mostra a meia-lua superior + anel embaixo.

### Legenda de detalhe

Abaixo da grade, manter a lista de regras como hoje, mas adicionar uma linha curta de exemplo do horário (ex.: `19:00 → 07:00 do dia seguinte`) para deixar explícito que é serviço noturno.

---

## Detalhes técnicos

- `EscalaRegra` ganha `minutoInicio?: number` (opcional para não quebrar dados salvos). Loader normaliza `?? 0` ao ler.
- `<input type="time" step="60">` retorna `"HH:MM"`; helpers `parseHHMM` / `formatHHMM` no próprio componente.
- Render da meia-lua: `clip-path: inset(0 0 50% 0)` aplicado a um anel colorido absoluto dentro da célula (`h-10 w-10`).
- Z-index: continuação fica atrás do anel de início, para o caso de coexistirem no mesmo dia.
- Algoritmo continua puro frontend, sem mudanças de storage além do campo novo opcional.

## Fora do escopo

- Notificações de início/fim de plantão.
- Exibição em formato semanal/agenda.
- Edição de regra direto pelo card (continua só criar + remover).
